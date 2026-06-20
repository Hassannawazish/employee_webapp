import { useEffect, useRef, useState } from 'react';
import './MaterialTestingCard.css';

type MaterialTestingCardProps = {
  roomName: string;
};

type DetectionResult = {
  confidence?: number;
  detected: boolean;
  label?: string;
  message: string;
  placement: 'left' | 'right' | null;
  source?: 'browser-fallback' | 'yolo-model';
};

type ModelDetection = {
  box: {
    x1: number;
    x2: number;
    y1: number;
    y2: number;
  };
  confidence: number;
  label: string;
};

type TemplateMask = {
  mask: Uint8Array;
  name: 'health-hazard' | 'exclamation' | 'flame';
};

const TEMPLATE_SIZE = 40;
const RIGHT_SIDE_MATCH_THRESHOLD = 0.34;
const CAMERA_ANALYSIS_WIDTH = 640;
const CAMERA_ANALYSIS_MIN_HEIGHT = 360;
const HAZARD_DETECTION_URL = process.env.REACT_APP_HAZARD_DETECTION_URL;
const LEFT_SIDE_HAZARD_LABEL = 'Skull and Crossbones';

const TEMPLATE_URLS: Array<{ name: TemplateMask['name']; url: string }> = [
  {
    name: 'health-hazard',
    url: `${process.env.PUBLIC_URL}/material-sign-health-hazard.jpeg`
  },
  {
    name: 'exclamation',
    url: `${process.env.PUBLIC_URL}/material-sign-exclamation.jpeg`
  },
  {
    name: 'flame',
    url: `${process.env.PUBLIC_URL}/material-sign-flame.jpeg`
  }
];

type BoundingBox = {
  maxX: number;
  maxY: number;
  minX: number;
  minY: number;
};

function getRedBoundingBox(imageData: ImageData): BoundingBox | null {
  const { data, width, height } = imageData;
  let redCount = 0;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const a = data[index + 3];

      if (a < 120) {
        continue;
      }

      const isRedEdge = r > 150 && g < 140 && b < 140 && r - g > 40 && r - b > 40;
      if (isRedEdge) {
        redCount += 1;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (redCount < 140 || maxX <= minX || maxY <= minY) {
    return null;
  }

  const boxWidth = maxX - minX + 1;
  const boxHeight = maxY - minY + 1;
  const aspectRatio = boxWidth / boxHeight;
  const boxArea = boxWidth * boxHeight;
  const redDensity = redCount / boxArea;

  const hasHazardFrame =
    aspectRatio > 0.65 &&
    aspectRatio < 1.35 &&
    redDensity > 0.06 &&
    redDensity < 0.42;

  if (!hasHazardFrame) {
    return null;
  }

  return { minX, minY, maxX, maxY };
}

function buildSymbolMask(imageData: ImageData, boundingBox: BoundingBox): Uint8Array {
  const { data, width, height } = imageData;
  const { minX, minY, maxX, maxY } = boundingBox;
  const sourceCanvas = document.createElement('canvas');
  const sourceContext = sourceCanvas.getContext('2d');
  const maskCanvas = document.createElement('canvas');
  const maskContext = maskCanvas.getContext('2d');

  if (!sourceContext || !maskContext) {
    return new Uint8Array(TEMPLATE_SIZE * TEMPLATE_SIZE);
  }

  sourceCanvas.width = width;
  sourceCanvas.height = height;
  sourceContext.putImageData(imageData, 0, 0);

  const cropInsetX = Math.floor((maxX - minX + 1) * 0.16);
  const cropInsetY = Math.floor((maxY - minY + 1) * 0.16);
  const cropX = Math.max(0, minX + cropInsetX);
  const cropY = Math.max(0, minY + cropInsetY);
  const cropWidth = Math.max(1, maxX - minX + 1 - cropInsetX * 2);
  const cropHeight = Math.max(1, maxY - minY + 1 - cropInsetY * 2);

  maskCanvas.width = TEMPLATE_SIZE;
  maskCanvas.height = TEMPLATE_SIZE;
  maskContext.drawImage(
    sourceCanvas,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    TEMPLATE_SIZE,
    TEMPLATE_SIZE
  );

  const resized = maskContext.getImageData(0, 0, TEMPLATE_SIZE, TEMPLATE_SIZE);
  const mask = new Uint8Array(TEMPLATE_SIZE * TEMPLATE_SIZE);

  for (let i = 0; i < mask.length; i += 1) {
    const pixelIndex = i * 4;
    const r = resized.data[pixelIndex];
    const g = resized.data[pixelIndex + 1];
    const b = resized.data[pixelIndex + 2];
    const isDark = r < 120 && g < 120 && b < 120;
    mask[i] = isDark ? 1 : 0;
  }

  return mask;
}

async function loadTemplateMasks(): Promise<TemplateMask[]> {
  const results = await Promise.all(
    TEMPLATE_URLS.map(
      (template) =>
        new Promise<TemplateMask | null>((resolve) => {
          const image = new Image();
          image.onload = () => {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) {
              resolve(null);
              return;
            }

            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            context.drawImage(image, 0, 0);
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const boundingBox = getRedBoundingBox(imageData);
            if (!boundingBox) {
              resolve(null);
              return;
            }

            resolve({
              name: template.name,
              mask: buildSymbolMask(imageData, boundingBox)
            });
          };

          image.onerror = () => resolve(null);
          image.src = template.url;
        })
    )
  );

  return results.filter((result): result is TemplateMask => result !== null);
}

function compareMasks(a: Uint8Array, b: Uint8Array) {
  let intersection = 0;
  let union = 0;
  let aCount = 0;
  let bCount = 0;

  for (let i = 0; i < a.length; i += 1) {
    if (a[i] === 1) {
      aCount += 1;
    }

    if (b[i] === 1) {
      bCount += 1;
    }

    if (a[i] === 1 || b[i] === 1) {
      union += 1;
    }

    if (a[i] === 1 && b[i] === 1) {
      intersection += 1;
    }
  }

  if (union === 0) {
    return 0;
  }

  const iou = intersection / union;
  const sizeRatio = Math.min(aCount, bCount) / Math.max(aCount, bCount, 1);

  return iou * 0.82 + sizeRatio * 0.18;
}

type MaskMetrics = {
  activeCount: number;
  aspectRatio: number;
  bottomBandDensity: number;
  centerColumnDensity: number;
  fillRatio: number;
  lowerHalfDensity: number;
  middleBandDensity: number;
  topHalfDensity: number;
  upperThirdDensity: number;
};

function getMaskMetrics(mask: Uint8Array): MaskMetrics | null {
  let minX = TEMPLATE_SIZE;
  let minY = TEMPLATE_SIZE;
  let maxX = -1;
  let maxY = -1;
  let activeCount = 0;
  let topHalfCount = 0;
  let lowerHalfCount = 0;
  let upperThirdCount = 0;
  let middleBandCount = 0;
  let bottomBandCount = 0;
  let centerColumnCount = 0;

  for (let y = 0; y < TEMPLATE_SIZE; y += 1) {
    for (let x = 0; x < TEMPLATE_SIZE; x += 1) {
      const value = mask[y * TEMPLATE_SIZE + x];
      if (value !== 1) {
        continue;
      }

      activeCount += 1;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);

      if (y < TEMPLATE_SIZE * 0.5) {
        topHalfCount += 1;
      } else {
        lowerHalfCount += 1;
      }

      if (y < TEMPLATE_SIZE * 0.33) {
        upperThirdCount += 1;
      }

      if (y >= TEMPLATE_SIZE * 0.32 && y <= TEMPLATE_SIZE * 0.72) {
        middleBandCount += 1;
      }

      if (y >= TEMPLATE_SIZE * 0.78) {
        bottomBandCount += 1;
      }

      if (x >= TEMPLATE_SIZE * 0.36 && x <= TEMPLATE_SIZE * 0.64) {
        centerColumnCount += 1;
      }
    }
  }

  if (activeCount === 0 || maxX <= minX || maxY <= minY) {
    return null;
  }

  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const area = width * height;

  return {
    activeCount,
    aspectRatio: width / height,
    bottomBandDensity: bottomBandCount / activeCount,
    centerColumnDensity: centerColumnCount / activeCount,
    fillRatio: activeCount / area,
    lowerHalfDensity: lowerHalfCount / activeCount,
    middleBandDensity: middleBandCount / activeCount,
    topHalfDensity: topHalfCount / activeCount,
    upperThirdDensity: upperThirdCount / activeCount
  };
}

function analyzeHazardSign(imageData: ImageData, templates: TemplateMask[]): DetectionResult {
  const boundingBox = getRedBoundingBox(imageData);
  if (!boundingBox) {
    return {
      detected: false,
      message: 'Vous devez demander au responsable',
      placement: null,
      source: 'browser-fallback'
    };
  }

  const sourceMask = buildSymbolMask(imageData, boundingBox);
  const metrics = getMaskMetrics(sourceMask);

  const bestTemplateMatch = templates.reduce<{ name: TemplateMask['name'] | null; score: number }>(
    (best, template) => {
      const score = compareMasks(sourceMask, template.mask);
      return score > best.score ? { name: template.name, score } : best;
    },
    { name: null, score: 0 }
  );

  if (bestTemplateMatch.score >= RIGHT_SIDE_MATCH_THRESHOLD) {
    return {
      detected: true,
      message: 'Veuillez placer le matériel sur le côté droit.',
      placement: 'right',
      source: 'browser-fallback'
    };
  }

  if (metrics) {
    const isExclamationMark =
      metrics.aspectRatio < 0.52 &&
      metrics.centerColumnDensity > 0.58 &&
      metrics.middleBandDensity > 0.42 &&
      metrics.bottomBandDensity < 0.18;

    const isFlameSymbol =
      metrics.aspectRatio > 0.55 &&
      metrics.aspectRatio < 1.15 &&
      metrics.upperThirdDensity > 0.22 &&
      metrics.lowerHalfDensity > 0.36 &&
      metrics.fillRatio > 0.24;

    const isHealthHazardSymbol =
      metrics.aspectRatio > 0.55 &&
      metrics.aspectRatio < 0.98 &&
      metrics.topHalfDensity > 0.52 &&
      metrics.middleBandDensity > 0.46 &&
      metrics.bottomBandDensity < 0.16 &&
      metrics.fillRatio > 0.26;

    if (isExclamationMark || isFlameSymbol || isHealthHazardSymbol) {
      return {
        detected: true,
        message: 'Veuillez placer le matériel sur le côté droit.',
        placement: 'right',
        source: 'browser-fallback'
      };
    }
  }

  const activePixels = sourceMask.reduce((sum, value) => sum + value, 0);
  if (activePixels < TEMPLATE_SIZE * 2) {
    return {
      detected: false,
      message: 'Vous devez demander au responsable',
      placement: null,
      source: 'browser-fallback'
    };
  }

  return {
    detected: true,
    message: 'Veuillez placer le matériel sur le côté gauche.',
    placement: 'left',
    source: 'browser-fallback'
  };
}

function getPlacementForHazardLabel(label: string): DetectionResult['placement'] {
  return label === LEFT_SIDE_HAZARD_LABEL ? 'left' : 'right';
}

function buildModelDetectionResult(detection: ModelDetection | undefined): DetectionResult {
  if (!detection) {
    return {
      detected: false,
      message: 'Aucun pictogramme reconnu par le modèle. Vous devez demander au responsable.',
      placement: null,
      source: 'yolo-model'
    };
  }

  const placement = getPlacementForHazardLabel(detection.label);
  const direction = placement === 'right' ? 'côté droit' : 'côté gauche';

  return {
    confidence: detection.confidence,
    detected: true,
    label: detection.label,
    message: `Veuillez placer le matériel sur le ${direction}.`,
    placement,
    source: 'yolo-model'
  };
}

async function detectHazardSignWithModel(snapshotUrl: string): Promise<DetectionResult | null> {
  if (!HAZARD_DETECTION_URL) {
    return null;
  }

  const response = await fetch(`${HAZARD_DETECTION_URL.replace(/\/$/, '')}/detect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      image: snapshotUrl
    })
  });

  if (!response.ok) {
    throw new Error('Hazard detector request failed.');
  }

  const payload = (await response.json()) as { detections?: ModelDetection[] };
  return buildModelDetectionResult(payload.detections?.[0]);
}

function MaterialTestingCard({ roomName }: MaterialTestingCardProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<'idle' | 'open' | 'error'>('idle');
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
  const [templates, setTemplates] = useState<TemplateMask[]>([]);
  const [placementImage, setPlacementImage] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState(
    "Capturez une image pour vérifier le pictogramme d'avertissement."
  );

  useEffect(() => {
    let isMounted = true;

    loadTemplateMasks().then((loadedTemplates) => {
      if (isMounted) {
        setTemplates(loadedTemplates);
      }
    });

    return () => {
      isMounted = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (cameraState === 'open' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraState]);

  async function openCamera() {
    try {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      setSnapshotUrl(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment'
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraState('open');
      setResultMessage('Caméra prête. Prenez une photo du pictogramme du matériau.');
    } catch {
      setCameraState('error');
      setResultMessage("Impossible d'ouvrir la caméra. Veuillez vérifier l'autorisation de la caméra.");
    }
  }

  function retakeImage() {
    setSnapshotUrl(null);
    setResultMessage('Caméra en attente');
    void openCamera();
  }

  async function captureImage() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) {
      setResultMessage("Le flux de la caméra n'est pas encore prêt.");
      return;
    }

    const targetWidth = CAMERA_ANALYSIS_WIDTH;
    const targetHeight = Math.max(
      CAMERA_ANALYSIS_MIN_HEIGHT,
      Math.round((video.videoHeight / video.videoWidth) * targetWidth)
    );
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext('2d');
    if (!context) {
      setResultMessage("Impossible d'analyser l'image capturée.");
      return;
    }

    context.drawImage(video, 0, 0, targetWidth, targetHeight);
    const nextSnapshotUrl = canvas.toDataURL('image/png');
    const imageData = context.getImageData(0, 0, targetWidth, targetHeight);

    let detection = analyzeHazardSign(imageData, templates);
    if (HAZARD_DETECTION_URL) {
      setResultMessage('Analyse du pictogramme avec le modèle...');
      try {
        detection = (await detectHazardSignWithModel(nextSnapshotUrl)) ?? detection;
      } catch {
        detection = {
          ...detection,
          message: `${detection.message} (modèle indisponible, analyse locale utilisée).`
        };
      }
    }

    setSnapshotUrl(nextSnapshotUrl);
    setResultMessage(detection.message);
    setPlacementImage(
      detection.placement
        ? `${process.env.PUBLIC_URL}/material-${detection.placement}.jpeg`
        : null
    );
  }

  function closeCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setSnapshotUrl(null);
    setCameraState('idle');
    setPlacementImage(null);
  }

  return (
    <article className="material-testing-card">
      <div className="material-header">
        <div>
          <p className="material-room">{roomName}</p>
          <h3 className="material-title">Test des matériaux</h3>
        </div>
        <div className="material-status">
          <span className={cameraState === 'open' ? 'material-status-dot live' : 'material-status-dot'} />
          <span>
            {cameraState === 'open'
              ? 'Caméra active'
              : cameraState === 'error'
                ? 'Caméra indisponible'
                : 'Caméra en attente'}
          </span>
        </div>
      </div>
      <div className="material-body">
        <div className="material-preview-wrap">
          <div className="material-preview">
            {snapshotUrl ? (
              <img src={snapshotUrl} alt="Pictogramme du matériau capturé" className="material-preview-image" />
            ) : cameraState === 'open' ? (
              <video ref={videoRef} autoPlay playsInline muted className="material-preview-image" />
            ) : (
              <div className="material-camera-placeholder" aria-label="Caméra fermée">
                <div className="camera-illustration" aria-hidden="true">
                  <span className="camera-lens" />
                  <span className="camera-flash" />
                </div>
                <span className="camera-scan-line" aria-hidden="true" />
              </div>
            )}
          </div>
        </div>

        <div className="material-side">
          <p className="material-copy">
            Ouvrez la caméra, capturez le pictogramme d'avertissement sur le matériau, puis
            laissez l'assistant de la salle vérifier si le symbole est présent.
          </p>
          <div className="material-actions">
            <button type="button" className="material-button primary" onClick={openCamera}>
              Ouvrir la caméra
            </button>
            <button type="button" className="material-button" onClick={captureImage}>
              Prendre une image
            </button>
            <button type="button" className="material-button" onClick={retakeImage}>
              Reprendre l'image
            </button>
            <button type="button" className="material-button" onClick={closeCamera}>
              Fermer
            </button>
          </div>

          <div className="material-result-panel">
            <p className="material-result-label">Résultat de détection</p>
            <p className="material-result">{resultMessage}</p>
            {placementImage ? (
              <div className="material-placement">
                <img
                  src={placementImage}
                  alt="Position suggérée du matériau"
                  className="material-placement-image"
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <canvas ref={canvasRef} className="material-canvas" />
    </article>
  );
}

export default MaterialTestingCard;

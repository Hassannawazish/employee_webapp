import base64
import io
import os
from pathlib import Path

os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")
os.environ.setdefault("OMP_NUM_THREADS", "1")

import torch
from flask import Flask, jsonify, request
from flask_cors import CORS
from PIL import Image


ROOT = Path(__file__).resolve().parent
MODEL_PATH = Path(os.environ.get("HAZARD_MODEL_PATH", ROOT / "models" / "hazard-symbols-best.pt"))
YOLOV5_REPO = Path(os.environ.get("YOLOV5_REPO", ROOT / "yolov5"))
CONFIDENCE_THRESHOLD = float(os.environ.get("HAZARD_CONFIDENCE", "0.35"))

app = Flask(__name__)
CORS(app)
model = None


def load_model():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Model not found at {MODEL_PATH}. Run ml/train_hazard_yolov5.ps1 first."
        )

    if not YOLOV5_REPO.exists():
        raise FileNotFoundError(
            f"YOLOv5 repo not found at {YOLOV5_REPO}. Run ml/train_hazard_yolov5.ps1 first."
        )

    loaded_model = torch.hub.load(
        str(YOLOV5_REPO),
        "custom",
        path=str(MODEL_PATH),
        source="local",
        force_reload=False,
    )
    loaded_model.conf = CONFIDENCE_THRESHOLD
    return loaded_model


def image_from_data_url(data_url: str) -> Image.Image:
    if "," in data_url:
        data_url = data_url.split(",", 1)[1]

    image_bytes = base64.b64decode(data_url)
    image = Image.open(io.BytesIO(image_bytes))
    return image.convert("RGB")


@app.get("/health")
def health():
    return jsonify({"ok": True, "model": str(MODEL_PATH), "confidence": CONFIDENCE_THRESHOLD})


@app.post("/detect")
def detect():
    global model

    body = request.get_json(silent=True) or {}
    image_data = body.get("image")
    if not image_data:
        return jsonify({"error": "Missing image data URL in request body."}), 400

    if model is None:
        model = load_model()

    image = image_from_data_url(image_data)
    results = model(image)
    detections = []

    for row in results.xyxy[0].tolist():
        x1, y1, x2, y2, confidence, class_id = row
        if confidence < CONFIDENCE_THRESHOLD:
            continue

        label = results.names[int(class_id)]
        detections.append(
            {
                "label": label,
                "confidence": float(confidence),
                "box": {
                    "x1": float(x1),
                    "y1": float(y1),
                    "x2": float(x2),
                    "y2": float(y2),
                },
            }
        )

    detections.sort(key=lambda item: item["confidence"], reverse=True)
    return jsonify({"detections": detections})


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.environ.get("HAZARD_DETECTOR_PORT", "5055")))

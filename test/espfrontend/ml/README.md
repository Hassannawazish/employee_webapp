# Hazard Symbol YOLOv5 Training

This folder trains the camera detector used by the `Test des materiaux` card.

## Dataset

The dataset is expected at:

```text
test/espfrontend/dataset/hazard symbols.v15i.yolov5pytorch
```

Classes:

```text
Corrosion
Environment
Exclamation Mark
Flame
Flame Over Circle
Health Hazard
Skull and Crossbones
```

## Train

Install a real Python 3.10+ runtime first. The Microsoft Store `python.exe` placeholder will not work.

From PowerShell:

```powershell
cd C:\Users\hassa\Desktop\employee_webapp\test\espfrontend
.\ml\train_hazard_yolov5.ps1
```

The script will:

- clone YOLOv5 into `ml/yolov5`
- install YOLOv5 and detector API requirements
- generate `ml/hazard_symbols.local.yaml` with absolute dataset paths, quoted Windows-safe paths, and UTF-8 without BOM
- train from `yolov5s.pt`
- copy the trained model to `ml/models/hazard-symbols-best.pt`
- export an ONNX copy to `ml/models/exported/hazard-symbols-best.onnx`

For a faster first test:

```powershell
.\ml\train_hazard_yolov5.ps1 -Epochs 20 -BatchSize 4
```

If YOLO reports `data.yaml 'train:' field missing`, rerun the script after this fix. Older generated YAML files used a UTF-8 BOM, which can make YOLO read the key as `﻿train` instead of `train`.

## Run Detector API

After training:

```powershell
cd C:\Users\hassa\Desktop\employee_webapp\test\espfrontend
python .\ml\serve_hazard_detector.py
```

The API runs at:

```text
http://127.0.0.1:5055
```

Health check:

```text
http://127.0.0.1:5055/health
```

## Connect React

Start React with the detector URL:

```powershell
$env:REACT_APP_HAZARD_DETECTION_URL="http://127.0.0.1:5055"
npm.cmd start
```

When this variable is set, `Test des materiaux` sends each captured camera image to YOLO. If the API is unavailable, the card falls back to the older browser-only symbol matcher.

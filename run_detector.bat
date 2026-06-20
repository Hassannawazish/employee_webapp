@echo off
cd /d "%~dp0test\espfrontend"

if not exist ".\ml\serve_hazard_detector.py" (
  echo YOLO detector script was not found:
  echo %CD%\ml\serve_hazard_detector.py
  pause
  exit /b 1
)

if not exist ".\ml\models\hazard-symbols-best.pt" (
  echo YOLO model weights were not found:
  echo %CD%\ml\models\hazard-symbols-best.pt
  echo.
  echo Train the model first:
  echo powershell -ExecutionPolicy Bypass -File ".\ml\train_hazard_yolov5.ps1"
  pause
  exit /b 1
)

set "KMP_DUPLICATE_LIB_OK=TRUE"
set "OMP_NUM_THREADS=1"
echo Starting YOLO detector API on http://127.0.0.1:5055
python ".\ml\serve_hazard_detector.py"
pause

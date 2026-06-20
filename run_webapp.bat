@echo off
cd /d "%~dp0test\espfrontend"
set "REACT_APP_MQTT_URL=ws://127.0.0.1:9002"
set "REACT_APP_HAZARD_DETECTION_URL=http://127.0.0.1:5055"
echo Starting React webapp
echo MQTT URL: %REACT_APP_MQTT_URL%
echo YOLO API: %REACT_APP_HAZARD_DETECTION_URL%
echo.
npm.cmd start
pause

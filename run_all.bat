@echo off
setlocal

set "ROOT=%~dp0"
set "MOSQUITTO_DIR=%ROOT%test\mosquitto"
set "FRONTEND_DIR=%ROOT%test\espfrontend"
set "MQTT_URL=ws://127.0.0.1:9002"
set "HAZARD_DETECTION_URL=http://127.0.0.1:5055"

echo Starting SCAI local stack...
echo.
echo Mosquitto: %MOSQUITTO_DIR%
echo Detector:  %HAZARD_DETECTION_URL%
echo React:     %FRONTEND_DIR%
echo MQTT URL:  %MQTT_URL%
echo.

start "SCAI Mosquitto MQTT" "%ROOT%run_mosquitto.bat"

timeout /t 2 /nobreak >nul

start "SCAI YOLO Detector" "%ROOT%run_detector.bat"

timeout /t 2 /nobreak >nul

start "SCAI React Webapp" "%ROOT%run_webapp.bat"

echo Started all services in separate windows.
echo.
echo Keep all three windows open while using the app.
echo If React opens before Mosquitto is ready, refresh the browser page.
echo.
pause

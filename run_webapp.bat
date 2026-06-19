@echo off
cd /d "%~dp0test\espfrontend"
set "REACT_APP_MQTT_URL=ws://127.0.0.1:9002"
set "REACT_APP_HAZARD_DETECTION_URL=http://127.0.0.1:5055"
npm.cmd start
pause

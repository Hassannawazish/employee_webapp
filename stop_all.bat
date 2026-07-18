@echo off
echo Stopping SCAI local stack windows...
taskkill /FI "WINDOWTITLE eq SCAI Mosquitto MQTT*" /T /F >nul 2>nul
taskkill /FI "WINDOWTITLE eq SCAI YOLO Detector*" /T /F >nul 2>nul
taskkill /FI "WINDOWTITLE eq SCAI React Webapp*" /T /F >nul 2>nul
echo Done.
pause

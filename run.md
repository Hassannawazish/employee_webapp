# Run Guide

Use these steps to run the MQTT broker, React webapp, YOLO detector, and ESP32 sketch together.

## 1. Start Mosquitto for Arduino and Webapp

Open PowerShell:

```powershell
cd C:\Users\hassa\Desktop\employee_webapp\test\mosquitto
.\run-mosquitto-dev.bat
```

Keep this window open.

Expected output:

```text
Opening ipv4 listen socket on port 1884
Opening ipv4 listen socket on port 9002
```

Check WebSocket MQTT is listening:

```powershell
Test-NetConnection -ComputerName localhost -Port 9002
```

Expected:

```text
TcpTestSucceeded : True
```

## 2. Start React Webapp

Open a second PowerShell:

```powershell
cd C:\Users\hassa\Desktop\employee_webapp\test\espfrontend
$env:REACT_APP_MQTT_URL="ws://127.0.0.1:9002"
npm.cmd start
```

If opening the webapp from another device on the network, use the PC IP:

```powershell
$env:REACT_APP_MQTT_URL="ws://192.168.1.82:9002"
npm.cmd start
```

React reads `REACT_APP_MQTT_URL` only when it starts. If React is already running, stop it with `Ctrl+C`, set the variable again, then run `npm.cmd start`.

## 3. Arduino MQTT Settings

The Arduino sketch uses raw MQTT:

```text
Broker: 192.168.1.82
Port: 1884
```

The browser webapp uses MQTT over WebSocket:

```text
URL: ws://127.0.0.1:9002
```

Sensor topics:

```text
hassa/esp32-office/temperature
hassa/esp32-office/light
hassa/esp32-office/humidity
hassa/esp32-office/gas
hassa/esp32-office/led/command
hassa/esp32-office/led/state
```

Pins in the current Arduino sketch:

```text
Temperature + humidity DHT11: GPIO 4
Light sensor analog: GPIO 34
Gas/smoke digital: GPIO 27
Door control relay/LED: GPIO 14
```

## 4. Train YOLO Hazard Detector

Only needed when retraining the model.

```powershell
cd C:\Users\hassa\Desktop\employee_webapp\test\espfrontend
.\ml\train_hazard_yolov5.ps1
```

Fast test training:

```powershell
.\ml\train_hazard_yolov5.ps1 -Epochs 20 -BatchSize 4
```

After training, confirm the model exists:

```powershell
dir .\ml\models\hazard-symbols-best.pt
```

## 5. Start YOLO Detector API

Open another PowerShell:

```powershell
cd C:\Users\hassa\Desktop\employee_webapp\test\espfrontend
python .\ml\serve_hazard_detector.py
```

Health check:

```text
http://127.0.0.1:5055/health
```

The root URL `http://127.0.0.1:5055` shows `Not Found`; that is normal. The API endpoint used by React is `/detect`, and it expects a POST request from the webapp.

## 6. Start React With YOLO Detector

To connect `Test des materiaux` to YOLO:

```powershell
cd C:\Users\hassa\Desktop\employee_webapp\test\espfrontend
$env:REACT_APP_MQTT_URL="ws://127.0.0.1:9002"
$env:REACT_APP_HAZARD_DETECTION_URL="http://127.0.0.1:5055"
npm.cmd start
```

In the webapp:

1. Open `Stock chimique`.
2. Go to `Test des materiaux`.
3. Click `Ouvrir la camera`.
4. Show a hazard sign.
5. Click `Prendre une image`.

Placement rule:

```text
Skull and Crossbones -> left
All other hazard classes -> right
```

## Troubleshooting

If React says MQTT connection error:

```powershell
Test-NetConnection -ComputerName localhost -Port 9002
```

If it fails, the dev Mosquitto config is not running. Start:

```powershell
cd C:\Users\hassa\Desktop\employee_webapp\test\mosquitto
.\run-mosquitto-dev.bat
```

If only port `1883` is listening, Windows Mosquitto service is running but not the dev config. The webapp needs `9002`.

If YOLO detector shows OpenMP `libiomp5md.dll` error:

```powershell
$env:KMP_DUPLICATE_LIB_OK="TRUE"
python .\ml\serve_hazard_detector.py
```

If Arduino cannot find `WiFi.h`, select an ESP32 board in Arduino IDE and install `esp32 by Espressif Systems` from Boards Manager.

If Arduino cannot find `DHT.h`, install `DHT sensor library by Adafruit` and `Adafruit Unified Sensor` from Library Manager.

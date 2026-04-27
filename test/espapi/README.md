# ESP32-CAM MQTT Sensor Publisher

This Arduino sketch reads the ESP32 internal temperature sensor and a digital rain / water sensor, then publishes both readings to a self-hosted Mosquitto MQTT broker.

## Current Workflow

```text
ESP32-CAM -> Wi-Fi -> Mosquitto on your PC -> React frontend
```

No cloud MQTT service is required.

## Published Topics

```text
hassa/esp32-office/temperature
hassa/esp32-office/rain
hassa/esp32-office/led/command
hassa/esp32-office/led/state
```

## Ports

This project uses non-default local development ports so it does not fight with the Mosquitto Windows service:

```text
1884: raw MQTT for ESP32-CAM
9002: MQTT over WebSocket for React/browser clients
```

## Sensor Behavior

The sketch publishes every 5 seconds:

- Temperature JSON from the ESP32 internal sensor
- Rain sensor JSON from the external module connected to a GPIO pin

Current rain sensor settings in the sketch:

```cpp
const int rainSensorPin = 13;
const bool rainDetectedStateIsLow = true;
```

This means:

- The rain sensor module is connected to GPIO `13`
- Water is considered detected when the sensor output reads `LOW`

If your rain module behaves the opposite way, change `rainDetectedStateIsLow` to `false`.

Current LED settings in the sketch:

```cpp
const int ledPin = 14;
```

The ESP32 listens for:

- `true` on `hassa/esp32-office/led/command` to turn the LED on
- `false` on `hassa/esp32-office/led/command` to turn the LED off

After applying the command, it publishes the current LED state to `hassa/esp32-office/led/state`.

## Install Mosquitto on Windows

Mosquitto has already been installed on this machine with `winget`:

```powershell
winget install --id EclipseFoundation.Mosquitto -e --accept-package-agreements --accept-source-agreements
```

If you need to install it again on another Windows machine, run the same command or download it from:

```text
https://mosquitto.org/download/
```

The installed files are usually here:

```text
C:\Program Files\mosquitto
```

## Mosquitto Config

Use the project config:

```text
test/mosquitto/mosquitto-dev.conf
```

Typical contents:

```text
allow_anonymous true

listener 1884 0.0.0.0

listener 9002 0.0.0.0
protocol websockets
```

If you enable MQTT authentication on the broker, make sure the sketch credentials match:

```cpp
const char* mqttUsername = "esp32";
const char* mqttPassword = "CHANGE_ME_MQTT_PASSWORD";
```

## Run Mosquitto

Open a dedicated PowerShell window and leave it open:

```powershell
& "C:\Program Files\mosquitto\mosquitto.exe" -c "C:\Users\hassa\Desktop\employee_webapp\test\mosquitto\mosquitto-dev.conf" -v
```

You should see:

```text
Opening ipv4 listen socket on port 1884.
Opening ipv4 listen socket on port 9002.
mosquitto version 2.1.2 running
```

## Find Your PC LAN IP

In PowerShell:

```powershell
ipconfig
```

Look for the Wi-Fi IPv4 address. On this machine it was:

```text
192.168.1.82
```

The Arduino sketch currently uses:

```cpp
const char* mqttServer = "192.168.1.82";
const int mqttPort = 1884;
```

If your PC IP changes, update `mqttServer`.

## Arduino Setup

1. Open Arduino IDE.
2. Install the ESP32 board package if needed.
3. Install this Arduino library:

```text
PubSubClient by Nick O'Leary
```

Arduino IDE path:

```text
Sketch -> Include Library -> Manage Libraries -> search PubSubClient -> Install
```

4. Open:

```text
test/espapi/Arduino/esp32_temperature_client/esp32_temperature_client.ino
```

5. Confirm Wi-Fi, broker, and sensor values:

```cpp
const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";
const char* mqttServer = "192.168.1.82";
const int mqttPort = 1884;
const char* temperatureTopic = "hassa/esp32-office/temperature";
const char* rainTopic = "hassa/esp32-office/rain";
const char* ledCommandTopic = "hassa/esp32-office/led/command";
const char* ledStateTopic = "hassa/esp32-office/led/state";
const int rainSensorPin = 13;
const bool rainDetectedStateIsLow = true;
const int ledPin = 14;
```

6. Wire the rain sensor module digital output `D0` to the configured ESP32 GPIO pin and connect power/ground.
7. Upload the sketch to the ESP32-CAM.
8. Open Serial Monitor at:

```text
115200 baud
```

Expected output:

```text
Connecting to WiFi...
Connected. ESP32 IP: ...
Connecting to MQTT broker...connected.
Publishing temperature topic: hassa/esp32-office/temperature
Publishing rain topic: hassa/esp32-office/rain
Listening for LED commands on: hassa/esp32-office/led/command
LED command topic subscription ready.
Published temperature: {"deviceId":"esp32-office","recordedAtUtc":"...","temperatureC":...}
Published rain sensor: {"deviceId":"esp32-office","recordedAtUtc":"...","rainDetected":true,"digitalState":0,"pin":13}
Published LED state: {"deviceId":"esp32-office","recordedAtUtc":"...","enabled":false,"pin":14,"source":"mqtt-command"}
```

## Published Payloads

Temperature payload:

```json
{
  "deviceId": "esp32-office",
  "recordedAtUtc": "2026-04-20T09:50:00Z",
  "temperatureC": 42.15
}
```

Rain payload:

```json
{
  "deviceId": "esp32-office",
  "recordedAtUtc": "2026-04-20T09:50:00Z",
  "rainDetected": true,
  "digitalState": 0,
  "pin": 13
}
```

`digitalState` is the raw GPIO reading from the rain sensor module.

LED state payload:

```json
{
  "deviceId": "esp32-office",
  "recordedAtUtc": "2026-04-20T09:50:00Z",
  "enabled": true,
  "pin": 14,
  "source": "mqtt-command"
}
```

## Test LED Command

Open another PowerShell window:

```powershell
cd "C:\Program Files\mosquitto"
.\mosquitto_pub.exe -h localhost -p 1884 -u esp32 -P CHANGE_ME_MQTT_PASSWORD -t hassa/esp32-office/led/command -m true
```

Turn it back off:

```powershell
cd "C:\Program Files\mosquitto"
.\mosquitto_pub.exe -h localhost -p 1884 -u esp32 -P CHANGE_ME_MQTT_PASSWORD -t hassa/esp32-office/led/command -m false
```

## Test Without React

Open another PowerShell window:

```powershell
cd "C:\Program Files\mosquitto"
.\mosquitto_sub.exe -h localhost -p 1884 -t hassa/esp32-office/temperature -v
```

To subscribe to both sensor topics:

```powershell
cd "C:\Program Files\mosquitto"
.\mosquitto_sub.exe -h localhost -p 1884 -t hassa/esp32-office/# -v
```

If the ESP32-CAM is publishing, you should see temperature and rain JSON messages every 5 seconds.

## Local vs Global

This setup is local by default:

```text
ESP32-CAM -> your PC broker -> React on your PC/local network
```

To view data globally for free, use a private network tool such as Tailscale or ZeroTier.

Do not expose anonymous Mosquitto directly to the public internet.

## Troubleshooting

If Serial Monitor shows:

```text
failed, rc=-2
```

The ESP32-CAM cannot reach Mosquitto. Check:

- Mosquitto is running
- `mqttServer` is your PC LAN IP
- Port `1884` is allowed through Windows Firewall
- ESP32-CAM and PC are on the same Wi-Fi
- MQTT username/password match the broker configuration

If rain messages are published but the sensor state is inverted, flip:

```cpp
const bool rainDetectedStateIsLow = true;
```

If the rain payload never changes, check:

- Rain sensor wiring
- The selected GPIO pin
- Whether your module is using the digital `D0` output
- Whether the sensor board threshold potentiometer needs adjustment

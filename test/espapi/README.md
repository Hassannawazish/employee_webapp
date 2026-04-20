# ESP32-CAM MQTT Temperature Publisher

This Arduino sketch reads the ESP32-CAM internal chip temperature and publishes it to a free self-hosted Mosquitto MQTT broker.

## Current Workflow

```text
ESP32-CAM -> Wi-Fi -> Mosquitto on your PC -> React frontend
```

No cloud MQTT service is required.

## Ports

This project uses non-default local development ports so it does not fight with the Mosquitto Windows service:

```text
1884: raw MQTT for ESP32-CAM
9002: MQTT over WebSocket for React/browser clients
```

The topic is:

```text
hassa/esp32-office/temperature
```

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

Its contents are:

```text
allow_anonymous true

listener 1884 0.0.0.0

listener 9002 0.0.0.0
protocol websockets
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

5. Confirm Wi-Fi and broker values:

```cpp
const char* ssid = "Bbox-5BDE03F7-Plus";
const char* password = "YOUR_WIFI_PASSWORD";
const char* mqttServer = "192.168.1.82";
const int mqttPort = 1884;
```

6. Upload the sketch to the ESP32-CAM.
7. Open Serial Monitor at:

```text
115200 baud
```

Expected output:

```text
Connecting to WiFi...
Connected. ESP32 IP: ...
Connecting to MQTT broker...connected.
Publishing topic: hassa/esp32-office/temperature
Published: {"temperatureC":...}
```

The sketch publishes JSON every 5 seconds:

```json
{
  "temperatureC": 42.15,
  "deviceId": "esp32-office",
  "recordedAtUtc": "2026-04-20T09:50:00Z"
}
```

## Test Without React

Open another PowerShell window:

```powershell
cd "C:\Program Files\mosquitto"
.\mosquitto_sub.exe -h localhost -p 1884 -t hassa/esp32-office/temperature -v
```

If ESP32-CAM is publishing, you should see JSON messages every 5 seconds.

## Local vs Global

This setup is local by default:

```text
ESP32-CAM -> your PC broker -> React on your PC/local network
```

To view data globally for free, use a private network tool such as Tailscale or ZeroTier.

Recommended free global option:

```text
Tailscale
```

With Tailscale:

```text
ESP32-CAM publishes to your PC on home Wi-Fi
Your remote phone/laptop connects to your PC broker using the PC's Tailscale IP
```

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

If `mosquitto_sub` receives messages but React does not, check the frontend WebSocket URL and topic.

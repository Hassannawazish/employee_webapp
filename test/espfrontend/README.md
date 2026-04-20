# ESP Temperature Frontend

React app that subscribes to your free self-hosted Mosquitto broker and displays the latest ESP32-CAM internal chip temperature.

## Current Workflow

```text
ESP32-CAM -> Mosquitto on your PC -> React frontend
```

No paid MQTT service is required.

## Current MQTT Settings

```text
Broker machine: your Windows PC
Raw MQTT URL for ESP32: 192.168.1.82:1884
WebSocket URL for React: ws://localhost:9002
Topic: hassa/esp32-office/temperature
Username/password: none for local testing
```

Browsers cannot connect to raw MQTT port `1884`, so the React app uses Mosquitto's WebSocket listener on port `9002`.

## Step 1: Run Mosquitto

Mosquitto is installed at:

```text
C:\Program Files\mosquitto
```

The project config is:

```text
C:\Users\hassa\Desktop\employee_webapp\test\mosquitto\mosquitto-dev.conf
```

Open a dedicated PowerShell window and keep it open:

```powershell
& "C:\Program Files\mosquitto\mosquitto.exe" -c "C:\Users\hassa\Desktop\employee_webapp\test\mosquitto\mosquitto-dev.conf" -v
```

Expected output:

```text
Opening ipv4 listen socket on port 1884.
Opening ipv4 listen socket on port 9002.
mosquitto version 2.1.2 running
```

## Step 2: Upload ESP32-CAM Sketch

Open:

```text
test/espapi/Arduino/esp32_temperature_client/esp32_temperature_client.ino
```

Confirm the broker IP and port:

```cpp
const char* mqttServer = "192.168.1.82";
const int mqttPort = 1884;
```

Upload the sketch. Open Serial Monitor at `115200` baud and wait for:

```text
Published:
```

## Step 3: Test MQTT Before React

Open another PowerShell window:

```powershell
cd "C:\Program Files\mosquitto"
.\mosquitto_sub.exe -h localhost -p 1884 -t hassa/esp32-office/temperature -v
```

Expected messages:

```json
hassa/esp32-office/temperature {"temperatureC":42.15,"deviceId":"esp32-office","recordedAtUtc":"2026-04-20T09:50:00Z"}
```

## Step 4: Run React Frontend

Open another PowerShell window:

```powershell
cd C:\Users\hassa\Desktop\employee_webapp\test\espfrontend
npm.cmd install
npm.cmd start
```

Open:

```text
http://localhost:3000
```

Expected status flow:

```text
Connecting to MQTT...
Connected to MQTT
Waiting for ESP32 reading...
Live
```

When the status is `Live`, React is receiving MQTT data.

## Run Frontend from Another Device on Your Wi-Fi

If the browser is on another device, `localhost` will not point to your broker PC. Use your PC IP instead:

```powershell
$env:REACT_APP_MQTT_URL="ws://192.168.1.82:9002"
$env:REACT_APP_MQTT_TOPIC="hassa/esp32-office/temperature"
npm.cmd start
```

## Make It Global for Free

The current setup is local. To view data globally without paying for a cloud MQTT broker, use Tailscale or ZeroTier.

### Recommended: Tailscale

1. Install Tailscale on your broker PC:

```text
https://tailscale.com/download/windows
```

2. Install Tailscale on your phone or remote laptop.
3. Login with the same Tailscale account.
4. Find your PC's Tailscale IP. It usually starts with:

```text
100.x.x.x
```

5. From a remote device, use:

```text
ws://100.x.x.x:9002
```

For a React app running on a remote computer:

```powershell
$env:REACT_APP_MQTT_URL="ws://100.x.x.x:9002"
$env:REACT_APP_MQTT_TOPIC="hassa/esp32-office/temperature"
npm.cmd start
```

This is global but private. Only your Tailscale devices can access the broker.

### Not Recommended: Public Port Forwarding

You can expose Mosquitto through your router, but do not expose the current anonymous config to the internet.

Before using port forwarding, add:

- Mosquitto username/password
- TLS or a secure reverse proxy
- Firewall restrictions

Anonymous public MQTT is unsafe.

## Verify Frontend

```powershell
cd C:\Users\hassa\Desktop\employee_webapp\test\espfrontend
node_modules\.bin\tsc.cmd --noEmit
npm.cmd test -- --watchAll=false --runInBand
```

## Troubleshooting

If the frontend shows `MQTT connection error.`, check:

- Mosquitto is running
- WebSocket listener `9002` is enabled
- React is using `ws://localhost:9002` on the broker PC

If the frontend stays on `Waiting for ESP32 reading...`, React connected to Mosquitto but no ESP32 message arrived. Check:

- Arduino Serial Monitor for `Published:`
- `mosquitto_sub` output
- Topic spelling: `hassa/esp32-office/temperature`

If ESP32 shows `failed, rc=-2`, it cannot reach Mosquitto. Check:

- PC IP in Arduino sketch
- Windows Firewall
- Mosquitto listener `1884`
- Same Wi-Fi network

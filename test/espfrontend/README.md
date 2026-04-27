# ESP Sensor Frontend

React app that subscribes to a self-hosted Mosquitto broker and displays the latest ESP32 sensor readings.

## Current Workflow

```text
ESP32-CAM -> Mosquitto on your PC -> React frontend
```

No paid MQTT service is required.

## Sensors Shown in the UI

- Temperature card: latest internal ESP32 temperature reading
- Rain card: latest digital rain / water sensor state
- LED card: sends `true` / `false` MQTT commands and shows the last applied LED state

The rain card displays:

- `Wet` when `rainDetected` is `true`
- `Dry` when `rainDetected` is `false`
- The GPIO pin used by the sensor
- The raw digital state from the module

## Current MQTT Settings

```text
Broker machine: your Windows PC
Raw MQTT URL for ESP32: 192.168.1.82:1884
WebSocket URL for React: ws://localhost:9002
Temperature topic: hassa/esp32-office/temperature
Rain topic: hassa/esp32-office/rain
LED command topic: hassa/esp32-office/led/command
LED state topic: hassa/esp32-office/led/state
Username/password: optional in frontend, supported through env vars
```

Browsers cannot connect to raw MQTT port `1884`, so the React app uses Mosquitto's WebSocket listener on port `9002`.

## Environment Variables

The frontend supports these environment variables:

```text
REACT_APP_MQTT_URL
REACT_APP_MQTT_TEMPERATURE_TOPIC
REACT_APP_MQTT_TOPIC
REACT_APP_MQTT_RAIN_TOPIC
REACT_APP_MQTT_LED_COMMAND_TOPIC
REACT_APP_MQTT_LED_STATE_TOPIC
REACT_APP_MQTT_USERNAME
REACT_APP_MQTT_PASSWORD
```

Notes:

- `REACT_APP_MQTT_TOPIC` still works as a fallback for temperature.
- Rain uses `REACT_APP_MQTT_RAIN_TOPIC`.

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

Confirm the rain topic and GPIO pin:

```cpp
const char* rainTopic = "hassa/esp32-office/rain";
const int rainSensorPin = 13;
const bool rainDetectedStateIsLow = true;
```

Confirm the LED topic and pin:

```cpp
const char* ledCommandTopic = "hassa/esp32-office/led/command";
const char* ledStateTopic = "hassa/esp32-office/led/state";
const int ledPin = 14;
```

Upload the sketch. Open Serial Monitor at `115200` baud and wait for:

```text
Published temperature:
Published rain sensor:
```

## Step 3: Test MQTT Before React

Open another PowerShell window:

```powershell
cd "C:\Program Files\mosquitto"
.\mosquitto_sub.exe -h localhost -p 1884 -t hassa/esp32-office/temperature -v
```

To watch both sensor topics:

```powershell
cd "C:\Program Files\mosquitto"
.\mosquitto_sub.exe -h localhost -p 1884 -t hassa/esp32-office/# -v
```

Expected messages:

```json
hassa/esp32-office/temperature {"deviceId":"esp32-office","recordedAtUtc":"2026-04-20T09:50:00Z","temperatureC":42.15}
hassa/esp32-office/rain {"deviceId":"esp32-office","recordedAtUtc":"2026-04-20T09:50:00Z","rainDetected":true,"digitalState":0,"pin":13}
hassa/esp32-office/led/state {"deviceId":"esp32-office","recordedAtUtc":"2026-04-20T09:50:00Z","enabled":true,"pin":14,"source":"mqtt-command"}
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

Expected status flow for each card:

```text
Connecting to MQTT...
Connected to MQTT
Waiting for temperature reading...
Live
```

and

```text
Connecting to MQTT...
Connected to MQTT
Waiting for rain sensor reading...
Live
```

When both cards show `Live`, React is receiving MQTT data for both sensors.

## Run Frontend from Another Device on Your Wi-Fi

If the browser is on another device, `localhost` will not point to your broker PC. Use your PC IP instead:

```powershell
$env:REACT_APP_MQTT_URL="ws://192.168.1.82:9002"
$env:REACT_APP_MQTT_TEMPERATURE_TOPIC="hassa/esp32-office/temperature"
$env:REACT_APP_MQTT_RAIN_TOPIC="hassa/esp32-office/rain"
$env:REACT_APP_MQTT_LED_COMMAND_TOPIC="hassa/esp32-office/led/command"
$env:REACT_APP_MQTT_LED_STATE_TOPIC="hassa/esp32-office/led/state"
npm.cmd start
```

If your broker requires authentication:

```powershell
$env:REACT_APP_MQTT_USERNAME="esp32"
$env:REACT_APP_MQTT_PASSWORD="your-password"
```

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
- React is using the correct `ws://...:9002` URL
- Username/password are set correctly if your broker requires them

If the rain card stays on `Waiting for rain sensor reading...`, React connected to Mosquitto but no rain message arrived. Check:

- Arduino Serial Monitor for `Published rain sensor:`
- `mosquitto_sub` output
- Topic spelling: `hassa/esp32-office/rain`
- Sensor wiring to the configured GPIO pin

If the rain card shows the opposite state from the physical sensor, update this in the Arduino sketch:

```cpp
const bool rainDetectedStateIsLow = true;
```

Change it to `false` for modules that drive the pin `HIGH` when water is detected.

# ESP Temperature Frontend

React app that subscribes to HiveMQ Cloud over MQTT WebSocket and displays the latest ESP32-CAM internal chip temperature.

## Workflow

```text
ESP32-CAM -> HiveMQ Cloud MQTT topic -> React frontend
```

No local backend is required.

## MQTT Settings

```text
WebSocket URL: wss://add4b2d9bd574f0f9748031fdf440bd1.s1.eu.hivemq.cloud:8884/mqtt
Topic: hassa/esp32-office/temperature
Username: hassan
```

These settings must match the Arduino sketch.

## Run Everything

First, upload and start the ESP32-CAM sketch:

```text
test/espapi/Arduino/esp32_temperature_client/esp32_temperature_client.ino
```

Open Serial Monitor at `115200` baud and confirm it prints `Published:`.

Then run the frontend:

```powershell
cd C:\Users\hassa\Desktop\employee_webapp\test\espfrontend
npm.cmd install
$env:REACT_APP_MQTT_URL="wss://add4b2d9bd574f0f9748031fdf440bd1.s1.eu.hivemq.cloud:8884/mqtt"
$env:REACT_APP_MQTT_TOPIC="hassa/esp32-office/temperature"
$env:REACT_APP_MQTT_USERNAME="hassan"
$env:REACT_APP_MQTT_PASSWORD="YOUR_HIVEMQ_PASSWORD"
npm.cmd start
```

Open:

```text
http://localhost:3000
```

Expected frontend status flow:

```text
Connecting to MQTT...
Connected to MQTT
Waiting for ESP32 reading...
Live
```

When the status is `Live`, the card is receiving MQTT data.

## Global Viewing

HiveMQ Cloud makes the data globally reachable. Any device with internet access can view the data if it connects to the same MQTT broker, topic, username, and password.

For quick global testing, use a WebSocket MQTT client with:

```text
Host: add4b2d9bd574f0f9748031fdf440bd1.s1.eu.hivemq.cloud
Port: 8884
Path: /mqtt
Topic: hassa/esp32-office/temperature
Username: hassan
Password: your HiveMQ password
```

For a public dashboard, deploy this React app to a host such as Vercel, Netlify, Firebase Hosting, or GitHub Pages and set these environment variables in the hosting dashboard:

```text
REACT_APP_MQTT_URL=wss://add4b2d9bd574f0f9748031fdf440bd1.s1.eu.hivemq.cloud:8884/mqtt
REACT_APP_MQTT_TOPIC=hassa/esp32-office/temperature
REACT_APP_MQTT_USERNAME=hassan
REACT_APP_MQTT_PASSWORD=your HiveMQ password
```

## Verify Frontend

```powershell
cd C:\Users\hassa\Desktop\employee_webapp\test\espfrontend
node_modules\.bin\tsc.cmd --noEmit
npm.cmd test -- --watchAll=false --runInBand
```

## Troubleshooting

If the frontend stays on `Waiting for ESP32 reading...`, React is connected to MQTT but no ESP32 message has arrived yet. Check the Arduino Serial Monitor for `Published:`.

If the frontend shows `MQTT connection error.`, check the WebSocket URL, username, and password.

If the frontend works locally but not after deployment, confirm the deployed app has the same `REACT_APP_...` environment variables and rebuild the deployment.

## Security Note

For a test project, putting MQTT credentials in the frontend is okay. For production, browser JavaScript exposes these credentials. A safer production architecture is:

```text
ESP32-CAM -> HiveMQ Cloud -> backend server -> public frontend
```

The backend keeps MQTT credentials secret.

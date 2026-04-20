# ESP32-CAM MQTT Temperature Publisher

This Arduino sketch reads the ESP32-CAM internal chip temperature and publishes it to HiveMQ Cloud over MQTT.

## Workflow

```text
ESP32-CAM -> Wi-Fi -> HiveMQ Cloud -> React frontend
```

No local ASP.NET backend is required for the MQTT workflow.

## MQTT Settings

```text
Broker: add4b2d9bd574f0f9748031fdf440bd1.s1.eu.hivemq.cloud
MQTT TLS port: 8883
WebSocket TLS port: 8884
WebSocket URL: wss://add4b2d9bd574f0f9748031fdf440bd1.s1.eu.hivemq.cloud:8884/mqtt
Topic: hassa/esp32-office/temperature
Username: hassan
```

The sketch publishes this JSON every 5 seconds:

```json
{
  "temperatureC": 42.15,
  "deviceId": "esp32-office",
  "recordedAtUtc": "2026-04-20T09:50:00Z"
}
```

## Arduino Setup

1. Open Arduino IDE.
2. Install the ESP32 board package if it is not already installed.
3. Install this library:

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

5. Confirm these values in the sketch:

```cpp
const char* ssid = "Bbox-5BDE03F7-Plus";
const char* password = "YOUR_WIFI_PASSWORD";
const char* mqttUsername = "hassan";
const char* mqttPassword = "YOUR_HIVEMQ_PASSWORD";
```

6. Select your ESP32-CAM board and upload the sketch.
7. Open Serial Monitor at:

```text
115200 baud
```

You should see:

```text
Connecting to WiFi...
Connected. ESP32 IP: ...
Connecting to MQTT broker...connected.
Publishing topic: hassa/esp32-office/temperature
Published: {"temperatureC":...}
```

If you see `Published`, the ESP32-CAM is sending data to HiveMQ Cloud.

## Test MQTT Without React

Use HiveMQ's WebSocket client or your HiveMQ Cloud dashboard client.

Connection details:

```text
Host: add4b2d9bd574f0f9748031fdf440bd1.s1.eu.hivemq.cloud
Port: 8884
Path: /mqtt
Username: hassan
Password: your HiveMQ password
Topic: hassa/esp32-office/temperature
```

Subscribe to the topic. You should receive a new JSON message about every 5 seconds.

## Troubleshooting

If Serial Monitor shows:

```text
failed, rc=-2
```

The ESP32-CAM could not connect to the broker. Check Wi-Fi internet access, broker URL, port `8883`, and power stability.

If Serial Monitor shows:

```text
failed, rc=4
```

The MQTT username or password is wrong.

If Serial Monitor shows:

```text
failed, rc=5
```

The MQTT account is not authorized. Check HiveMQ Cloud credentials and permissions.

## Security Note

The sketch currently uses:

```cpp
wifiClient.setInsecure();
```

This is convenient for testing TLS. For production, replace it with the HiveMQ Cloud CA certificate.

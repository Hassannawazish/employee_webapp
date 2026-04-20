# ESP Temperature Notes

This folder contains two possible ways to expose ESP32 temperature data.

The current Arduino sketch follows the direct ESP32 server flow:

1. ESP32 connects to Wi-Fi.
2. ESP32 runs a tiny HTTP server.
3. Your web app calls that server.
4. ESP32 returns the internal chip temperature as JSON.

## ESP32 Server Endpoint

Upload `Arduino/esp32_temperature_client/esp32_temperature_client.ino` to the ESP32, then open Serial Monitor.

The sketch prints an endpoint like this:

```text
http://192.168.1.42/api/temperature/latest
```

The JSON response matches the frontend card:

```json
{
  "temperatureC": 42.15,
  "deviceId": "esp32-lab",
  "recordedAtUtc": "2026-04-20T09:50:00Z"
}
```

To make the React app call the ESP32 directly:

```powershell
cd C:\Users\hassa\Desktop\employee_webapp\test\espfrontend
$env:REACT_APP_ESP_API_URL="http://192.168.1.42"
npm.cmd start
```

Use the IP shown in your Serial Monitor.

## Optional ASP.NET API

The ASP.NET Core API can still be run for local testing if you want a PC-hosted API:

```powershell
dotnet run --project test\espapi\espapi.csproj
```

## Endpoints

- `POST /api/temperature`

```json
{
  "temperatureC": 24.7,
  "deviceId": "esp32-lab"
}
```

- `GET /api/temperature/latest`

Returns the most recent reading received from the ESP32.

# ESP Temperature Frontend

React app for displaying the latest ESP32 internal temperature value from `espapi`.

## Run the API

From the repository root:

```powershell
dotnet run --project test\espapi\espapi.csproj
```

The API listens on `http://localhost:5094`.

## Run the Frontend

From this folder:

```powershell
npm.cmd start
```

The frontend listens on `http://localhost:3000` and calls:

```text
http://localhost:5094/api/temperature/latest
```

## Use a Different API URL

If the API runs on another host or port:

```powershell
$env:REACT_APP_ESP_API_URL="http://192.168.1.20:5094"
npm.cmd start
```

## Verify

```powershell
npm.cmd test -- --watchAll=false --runInBand
node_modules\.bin\tsc.cmd --noEmit
```

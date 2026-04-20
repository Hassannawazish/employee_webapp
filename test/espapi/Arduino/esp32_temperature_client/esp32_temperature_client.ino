#include <WiFi.h>
#include <WebServer.h>
#include <time.h>

const char* ssid = "Bbox-5BDE03F7-Plus";
const char* password = "*ZqWza9tYCqwwUkXHV";
const char* deviceId = "esp32-office";

WebServer server(80);

String isoUtcNow() {
  struct tm timeInfo;

  if (!getLocalTime(&timeInfo)) {
    return "";
  }

  char buffer[25];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%SZ", &timeInfo);
  return String(buffer);
}

void addCorsHeaders() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

void handleOptions() {
  addCorsHeaders();
  server.send(204);
}

void handleRoot() {
  addCorsHeaders();
  server.send(
    200,
    "application/json",
    "{\"message\":\"ESP32 temperature server is running.\",\"endpoint\":\"/api/temperature/latest\"}"
  );
}

void handleLatestTemperature() {
  float temperatureC = temperatureRead();

  if (isnan(temperatureC)) {
    addCorsHeaders();
    server.send(500, "application/json", "{\"message\":\"Failed to read ESP32 internal temperature.\"}");
    return;
  }

  String payload = "{";
  payload += "\"temperatureC\":";
  payload += String(temperatureC, 2);
  payload += ",\"deviceId\":\"";
  payload += deviceId;
  payload += "\",\"recordedAtUtc\":\"";
  payload += isoUtcNow();
  payload += "\"}";

  addCorsHeaders();
  server.send(200, "application/json", payload);
}

void connectToWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.print("Connected. ESP32 IP: ");
  Serial.println(WiFi.localIP());
}

void setupRoutes() {
  server.on("/", HTTP_GET, handleRoot);
  server.on("/api/temperature/latest", HTTP_GET, handleLatestTemperature);
  server.on("/api/temperature/latest", HTTP_OPTIONS, handleOptions);

  server.begin();
  Serial.println("HTTP server started.");
  Serial.println("Open this endpoint from your app:");
  Serial.print("http://");
  Serial.print(WiFi.localIP());
  Serial.println("/api/temperature/latest");
}

void setup() {
  Serial.begin(115200);
  connectToWifi();

  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  setupRoutes();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectToWifi();
  }

  server.handleClient();
}

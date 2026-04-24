#include <WiFi.h>
#include <PubSubClient.h>
#include <time.h>

const char* ssid = "Bbox-5BDE03F7-Plus";
const char* password = "5ZqWza9tYCqwwUkXHV";
const char* deviceId = "esp32-office";

// Use the LAN IP address of the computer/Raspberry Pi running Mosquitto.
const char* mqttServer = "192.168.1.82";
const int mqttPort = 1884;
const char* temperatureTopic = "hassa/esp32-office/temperature";
const char* rainTopic = "hassa/esp32-office/rain";
const char* mqttClientId = "esp32-office-temperature-publisher";
const char* mqttUsername = "esp32";
const char* mqttPassword = "CHANGE_ME_MQTT_PASSWORD";

// Update this pin to match the ESP32 GPIO where the rain/water sensor D0 pin is connected.
const int rainSensorPin = 13;
// Many digital rain modules pull LOW when water is detected.
const bool rainDetectedStateIsLow = true;

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

unsigned long lastPublishAt = 0;
const unsigned long publishIntervalMs = 5000;

String isoUtcNow() {
  struct tm timeInfo;

  if (!getLocalTime(&timeInfo)) {
    return "";
  }

  char buffer[25];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%SZ", &timeInfo);
  return String(buffer);
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

void connectToMqtt() {
  while (!mqttClient.connected()) {
    Serial.print("Connecting to MQTT broker...");

    if (mqttClient.connect(mqttClientId, mqttUsername, mqttPassword)) {
      Serial.println("connected.");
      Serial.print("Publishing temperature topic: ");
      Serial.println(temperatureTopic);
      Serial.print("Publishing rain topic: ");
      Serial.println(rainTopic);
    } else {
      Serial.print("failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(". Retrying in 5 seconds.");
      delay(5000);
    }
  }
}

String basePayload() {
  String payload = "{";
  payload += "\"deviceId\":\"";
  payload += deviceId;
  payload += "\",\"recordedAtUtc\":\"";
  payload += isoUtcNow();
  payload += "\"";
  return payload;
}

void publishTemperature() {
  float temperatureC = temperatureRead();

  if (isnan(temperatureC)) {
    Serial.println("Failed to read ESP32 internal temperature.");
    return;
  }

  String payload = basePayload();
  payload += ",\"temperatureC\":";
  payload += String(temperatureC, 2);
  payload += "}";

  bool published = mqttClient.publish(temperatureTopic, payload.c_str(), true);

  if (published) {
    Serial.print("Published temperature: ");
    Serial.println(payload);
  } else {
    Serial.println("Failed to publish temperature.");
  }
}

void publishRainSensor() {
  int digitalState = digitalRead(rainSensorPin);
  bool rainDetected = rainDetectedStateIsLow ? digitalState == LOW : digitalState == HIGH;

  String payload = basePayload();
  payload += ",\"rainDetected\":";
  payload += rainDetected ? "true" : "false";
  payload += ",\"digitalState\":";
  payload += String(digitalState);
  payload += ",\"pin\":";
  payload += String(rainSensorPin);
  payload += "}";

  bool published = mqttClient.publish(rainTopic, payload.c_str(), true);

  if (published) {
    Serial.print("Published rain sensor: ");
    Serial.println(payload);
  } else {
    Serial.println("Failed to publish rain sensor.");
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(rainSensorPin, INPUT);
  connectToWifi();

  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  mqttClient.setServer(mqttServer, mqttPort);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectToWifi();
  }

  if (!mqttClient.connected()) {
    connectToMqtt();
  }

  mqttClient.loop();

  if (millis() - lastPublishAt >= publishIntervalMs) {
    lastPublishAt = millis();
    publishTemperature();
    publishRainSensor();
  }
}

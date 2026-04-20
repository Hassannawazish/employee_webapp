#include <WiFi.h>
#include <PubSubClient.h>
#include <time.h>

const char* ssid = "Bbox-5BDE03F7-Plus";
const char* password = "*ZqWza9tYCqwwUkXHV";
const char* deviceId = "esp32-office";

// Use the LAN IP address of the computer/Raspberry Pi running Mosquitto.
const char* mqttServer = "192.168.1.82";
const int mqttPort = 1884;
const char* mqttTopic = "hassa/esp32-office/temperature";
const char* mqttClientId = "esp32-office-temperature-publisher";
const char* mqttUsername = "esp32";
const char* mqttPassword = "CHANGE_ME_MQTT_PASSWORD";

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
      Serial.print("Publishing topic: ");
      Serial.println(mqttTopic);
    } else {
      Serial.print("failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(". Retrying in 5 seconds.");
      delay(5000);
    }
  }
}

void publishTemperature() {
  float temperatureC = temperatureRead();

  if (isnan(temperatureC)) {
    Serial.println("Failed to read ESP32 internal temperature.");
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

  bool published = mqttClient.publish(mqttTopic, payload.c_str(), true);

  if (published) {
    Serial.print("Published: ");
    Serial.println(payload);
  } else {
    Serial.println("Failed to publish temperature.");
  }
}

void setup() {
  Serial.begin(115200);
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
  }
}

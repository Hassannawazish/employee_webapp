#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <time.h>

const char* ssid = "Bbox-5BDE03F7-Plus";
const char* password = "5ZqWza9tYCqwwUkXHV";
const char* deviceId = "esp32-office";

// Use the LAN IP address of the computer/Raspberry Pi running Mosquitto.
const char* mqttServer = "192.168.1.82";
const int mqttPort = 1884;
const char* temperatureTopic = "hassa/esp32-office/temperature";
const char* lightTopic = "hassa/esp32-office/light";
const char* humidityTopic = "hassa/esp32-office/humidity";
const char* gasTopic = "hassa/esp32-office/gas";
const char* ledCommandTopic = "hassa/esp32-office/led/command";
const char* ledStateTopic = "hassa/esp32-office/led/state";
const char* mqttClientId = "esp32-office-sensor-publisher";
const char* mqttUsername = "esp32";
const char* mqttPassword = "CHANGE_ME_MQTT_PASSWORD";

// DHT11 sensor for temperature + humidity.
const int dhtPin = 4;
#define DHT_TYPE DHT11

// Analog light sensor / LDR output. Use ADC1 pins while WiFi is enabled.
const int lightSensorPin = 34;
const bool lightSensorBrighterWhenHigh = true;

// Digital smoke/gas module output.
const int gasSensorPin = 27;
const bool gasDetectedStateIsLow = false;

// Door-control relay/LED output.
const int ledPin = 14;

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);
DHT dht(dhtPin, DHT_TYPE);

unsigned long lastPublishAt = 0;
const unsigned long publishIntervalMs = 5000;
bool ledEnabled = false;

void publishLedState(const char* source);

void applyLedState(bool enabled, const char* source) {
  ledEnabled = enabled;
  digitalWrite(ledPin, enabled ? HIGH : LOW);

  Serial.print("LED changed to ");
  Serial.print(enabled ? "ON" : "OFF");
  Serial.print(" from source: ");
  Serial.println(source);

  publishLedState(source);
}

void handleMqttMessage(char* topic, byte* payload, unsigned int length) {
  String topicName = String(topic);
  String body;

  for (unsigned int index = 0; index < length; index++) {
    body += static_cast<char>(payload[index]);
  }

  body.trim();
  body.toLowerCase();

  Serial.print("Received MQTT message on ");
  Serial.print(topicName);
  Serial.print(": ");
  Serial.println(body);

  if (topicName != ledCommandTopic) {
    return;
  }

  if (body == "true") {
    applyLedState(true, "mqtt-command");
  } else if (body == "false") {
    applyLedState(false, "mqtt-command");
  } else {
    Serial.println("Ignoring unsupported LED command. Use true or false.");
  }
}

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
      Serial.print("Publishing light topic: ");
      Serial.println(lightTopic);
      Serial.print("Publishing humidity topic: ");
      Serial.println(humidityTopic);
      Serial.print("Publishing gas topic: ");
      Serial.println(gasTopic);
      Serial.print("Listening for LED commands on: ");
      Serial.println(ledCommandTopic);
      if (mqttClient.subscribe(ledCommandTopic, 1)) {
        Serial.println("LED command topic subscription ready.");
      } else {
        Serial.println("Failed to subscribe to LED command topic.");
      }
      publishLedState("mqtt-connect");
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

void publishTemperature(float temperatureC) {
  if (isnan(temperatureC)) {
    Serial.println("Failed to read DHT temperature.");
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

void publishHumidity(float humidityPercent) {
  if (isnan(humidityPercent)) {
    Serial.println("Failed to read DHT humidity.");
    return;
  }

  String payload = basePayload();
  payload += ",\"humidityPercent\":";
  payload += String(humidityPercent, 2);
  payload += "}";

  bool published = mqttClient.publish(humidityTopic, payload.c_str(), true);

  if (published) {
    Serial.print("Published humidity: ");
    Serial.println(payload);
  } else {
    Serial.println("Failed to publish humidity.");
  }
}

void publishTemperatureAndHumidity() {
  float humidityPercent = dht.readHumidity();
  float temperatureC = dht.readTemperature();

  publishTemperature(temperatureC);
  publishHumidity(humidityPercent);
}

void publishLightSensor() {
  int rawLight = analogRead(lightSensorPin);
  int normalizedLight = lightSensorBrighterWhenHigh
    ? map(rawLight, 0, 4095, 0, 1000)
    : map(rawLight, 0, 4095, 1000, 0);

  normalizedLight = constrain(normalizedLight, 0, 1000);

  String payload = basePayload();
  payload += ",\"lightLevel\":";
  payload += String(normalizedLight);
  payload += ",\"rawAnalog\":";
  payload += String(rawLight);
  payload += ",\"pin\":";
  payload += String(lightSensorPin);
  payload += "}";

  bool published = mqttClient.publish(lightTopic, payload.c_str(), true);

  if (published) {
    Serial.print("Published light sensor: ");
    Serial.println(payload);
  } else {
    Serial.println("Failed to publish light sensor.");
  }
}

void publishGasSensor() {
  int digitalState = digitalRead(gasSensorPin);
  bool gasDetected = gasDetectedStateIsLow ? digitalState == LOW : digitalState == HIGH;

  String payload = basePayload();
  payload += ",\"gasDetected\":";
  payload += gasDetected ? "true" : "false";
  payload += ",\"digitalState\":";
  payload += String(digitalState);
  payload += ",\"pin\":";
  payload += String(gasSensorPin);
  payload += "}";

  bool published = mqttClient.publish(gasTopic, payload.c_str(), true);

  if (published) {
    Serial.print("Published gas sensor: ");
    Serial.println(payload);
  } else {
    Serial.println("Failed to publish gas sensor.");
  }
}

void publishLedState(const char* source) {
  String payload = basePayload();
  payload += ",\"enabled\":";
  payload += ledEnabled ? "true" : "false";
  payload += ",\"pin\":";
  payload += String(ledPin);
  payload += ",\"source\":\"";
  payload += source;
  payload += "\"}";

  bool published = mqttClient.publish(ledStateTopic, payload.c_str(), true);

  if (published) {
    Serial.print("Published LED state: ");
    Serial.println(payload);
  } else {
    Serial.println("Failed to publish LED state.");
  }
}

void setup() {
  Serial.begin(115200);
  dht.begin();
  analogReadResolution(12);
  pinMode(gasSensorPin, INPUT);
  pinMode(ledPin, OUTPUT);
  applyLedState(false, "startup");
  connectToWifi();

  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  mqttClient.setServer(mqttServer, mqttPort);
  mqttClient.setCallback(handleMqttMessage);
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
    publishTemperatureAndHumidity();
    publishLightSensor();
    publishGasSensor();
  }
}

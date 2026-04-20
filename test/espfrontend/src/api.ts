import mqtt from 'mqtt';
import type { MqttClient } from 'mqtt';

export type TemperatureReading = {
  temperatureC: number;
  deviceId: string;
  recordedAtUtc: string;
};

export type TemperatureSubscription = {
  close: () => void;
};

const mqttUrl =
  process.env.REACT_APP_MQTT_URL ??
  'wss://add4b2d9bd574f0f9748031fdf440bd1.s1.eu.hivemq.cloud:8884/mqtt';
const mqttTopic = process.env.REACT_APP_MQTT_TOPIC ?? 'hassa/esp32-office/temperature';
const mqttUsername = process.env.REACT_APP_MQTT_USERNAME;
const mqttPassword = process.env.REACT_APP_MQTT_PASSWORD;

export function subscribeToTemperature(
  onReading: (reading: TemperatureReading) => void,
  onStatus: (status: string) => void
): TemperatureSubscription {
  const clientId = `espfrontend-${Math.random().toString(16).slice(2)}`;
  const client: MqttClient = mqtt.connect(mqttUrl, {
    clientId,
    clean: true,
    connectTimeout: 8000,
    reconnectPeriod: 3000,
    username: mqttUsername,
    password: mqttPassword
  });

  client.on('connect', () => {
    onStatus('Connected to MQTT');
    client.subscribe(mqttTopic, { qos: 0 }, (error: Error | null) => {
      if (error) {
        onStatus('Unable to subscribe to MQTT topic.');
      } else {
        onStatus('Waiting for ESP32 reading...');
      }
    });
  });

  client.on('reconnect', () => {
    onStatus('Reconnecting to MQTT...');
  });

  client.on('offline', () => {
    onStatus('MQTT connection is offline.');
  });

  client.on('error', () => {
    onStatus('MQTT connection error.');
  });

  client.on('message', (_topic: string, message: Buffer) => {
    try {
      const reading = JSON.parse(message.toString()) as TemperatureReading;
      onReading(reading);
      onStatus('Live');
    } catch {
      onStatus('Received invalid temperature payload.');
    }
  });

  return {
    close: () => {
      client.end(true);
    }
  };
}

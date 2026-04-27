import mqtt from 'mqtt';
import type { MqttClient } from 'mqtt';

export type TemperatureReading = {
  temperatureC: number;
  deviceId: string;
  recordedAtUtc: string;
};

export type RainReading = {
  rainDetected: boolean;
  digitalState: number;
  pin: number;
  deviceId: string;
  recordedAtUtc: string;
};

export type LedState = {
  enabled: boolean;
  pin: number;
  deviceId: string;
  recordedAtUtc: string;
  source?: string;
};

export type TemperatureSubscription = {
  close: () => void;
};

const mqttUrl = process.env.REACT_APP_MQTT_URL ?? 'ws://localhost:9002';
const temperatureTopic =
  process.env.REACT_APP_MQTT_TEMPERATURE_TOPIC ??
  process.env.REACT_APP_MQTT_TOPIC ??
  'hassa/esp32-office/temperature';
const rainTopic = process.env.REACT_APP_MQTT_RAIN_TOPIC ?? 'hassa/esp32-office/rain';
const ledCommandTopic =
  process.env.REACT_APP_MQTT_LED_COMMAND_TOPIC ?? 'hassa/esp32-office/led/command';
const ledStateTopic =
  process.env.REACT_APP_MQTT_LED_STATE_TOPIC ?? 'hassa/esp32-office/led/state';
const mqttUsername = process.env.REACT_APP_MQTT_USERNAME;
const mqttPassword = process.env.REACT_APP_MQTT_PASSWORD;

type SensorSubscription = {
  topic: string;
  waitingStatus: string;
  invalidPayloadStatus: string;
};

function subscribeToSensor<TReading>(
  sensor: SensorSubscription,
  onReading: (reading: TReading) => void,
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
    client.subscribe(sensor.topic, { qos: 0 }, (error: Error | null) => {
      if (error) {
        onStatus('Unable to subscribe to MQTT topic.');
      } else {
        onStatus(sensor.waitingStatus);
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
      const reading = JSON.parse(message.toString()) as TReading;
      onReading(reading);
      onStatus('Live');
    } catch {
      onStatus(sensor.invalidPayloadStatus);
    }
  });

  return {
    close: () => {
      client.end(true);
    }
  };
}

export function subscribeToTemperature(
  onReading: (reading: TemperatureReading) => void,
  onStatus: (status: string) => void
): TemperatureSubscription {
  return subscribeToSensor<TemperatureReading>(
    {
      topic: temperatureTopic,
      waitingStatus: 'Waiting for temperature reading...',
      invalidPayloadStatus: 'Received invalid temperature payload.'
    },
    onReading,
    onStatus
  );
}

export function subscribeToRainSensor(
  onReading: (reading: RainReading) => void,
  onStatus: (status: string) => void
): TemperatureSubscription {
  return subscribeToSensor<RainReading>(
    {
      topic: rainTopic,
      waitingStatus: 'Waiting for rain sensor reading...',
      invalidPayloadStatus: 'Received invalid rain sensor payload.'
    },
    onReading,
    onStatus
  );
}

export function subscribeToLedState(
  onReading: (reading: LedState) => void,
  onStatus: (status: string) => void
): TemperatureSubscription {
  return subscribeToSensor<LedState>(
    {
      topic: ledStateTopic,
      waitingStatus: 'Waiting for LED state...',
      invalidPayloadStatus: 'Received invalid LED state payload.'
    },
    onReading,
    onStatus
  );
}

export function publishLedCommand(enabled: boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    const clientId = `espfrontend-led-publisher-${Math.random().toString(16).slice(2)}`;
    const client: MqttClient = mqtt.connect(mqttUrl, {
      clientId,
      clean: true,
      connectTimeout: 8000,
      reconnectPeriod: 0,
      username: mqttUsername,
      password: mqttPassword
    });
    let settled = false;

    const closeWithError = (message: string) => {
      if (settled) {
        return;
      }

      settled = true;
      client.end(false, () => {
        reject(new Error(message));
      });
    };

    const closeAfterSuccess = () => {
      if (settled) {
        return;
      }

      settled = true;
      client.end(false, () => {
        resolve();
      });
    };

    client.on('connect', () => {
      client.publish(
        ledCommandTopic,
        enabled ? 'true' : 'false',
        { qos: 1, retain: true },
        (error?: Error | null) => {
          if (error) {
            closeWithError(error.message);
          } else {
            closeAfterSuccess();
          }
        }
      );
    });

    client.on('error', (error) => {
      const message = error instanceof Error ? error.message : 'MQTT connection error.';
      closeWithError(message);
    });

    client.on('offline', () => {
      closeWithError('MQTT connection is offline.');
    });

    client.on('close', () => {
      if (!settled) {
        settled = true;
        reject(new Error('MQTT connection closed before the LED command was sent.'));
      }
    });
  });
}

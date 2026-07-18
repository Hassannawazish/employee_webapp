import mqtt from 'mqtt';
import type { MqttClient } from 'mqtt';

export type TemperatureReading = {
  temperatureC: number;
  deviceId: string;
  recordedAtUtc: string;
};

export type LightReading = {
  lightLevel: number;
  deviceId: string;
  recordedAtUtc: string;
};

export type HumidityReading = {
  humidityPercent: number;
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

export type GasReading = {
  gasDetected: boolean;
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
const lightTopic = process.env.REACT_APP_MQTT_LIGHT_TOPIC ?? 'hassa/esp32-office/light';
const humidityTopic = process.env.REACT_APP_MQTT_HUMIDITY_TOPIC ?? 'hassa/esp32-office/humidity';
const rainTopic = process.env.REACT_APP_MQTT_RAIN_TOPIC ?? 'hassa/esp32-office/rain';
const gasTopic = process.env.REACT_APP_MQTT_GAS_TOPIC ?? 'hassa/esp32-office/gas';
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
    onStatus('Connecté à MQTT');
    client.subscribe(sensor.topic, { qos: 0 }, (error: Error | null) => {
      if (error) {
        onStatus("Impossible de s'abonner au sujet MQTT.");
      } else {
        onStatus(sensor.waitingStatus);
      }
    });
  });

  client.on('reconnect', () => {
    onStatus('Reconnexion à MQTT...');
  });

  client.on('offline', () => {
    onStatus('La connexion MQTT est hors ligne.');
  });

  client.on('error', () => {
    onStatus('Erreur de connexion MQTT.');
  });

  client.on('message', (_topic: string, message: Buffer) => {
    try {
      const reading = JSON.parse(message.toString()) as TReading;
      onReading(reading);
      onStatus('En direct');
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
  onStatus: (status: string) => void,
  topic = temperatureTopic
): TemperatureSubscription {
  return subscribeToSensor<TemperatureReading>(
    {
      topic,
      waitingStatus: 'En attente de la mesure de température...',
      invalidPayloadStatus: 'Mesure de température reçue invalide.'
    },
    onReading,
    onStatus
  );
}

export function subscribeToRainSensor(
  onReading: (reading: RainReading) => void,
  onStatus: (status: string) => void,
  topic = rainTopic
): TemperatureSubscription {
  return subscribeToSensor<RainReading>(
    {
      topic,
      waitingStatus: "En attente de l'état de verrouillage de la porte...",
      invalidPayloadStatus: 'État de verrouillage de la porte reçu invalide.'
    },
    onReading,
    onStatus
  );
}

export function subscribeToLightSensor(
  onReading: (reading: LightReading) => void,
  onStatus: (status: string) => void,
  topic = lightTopic
): TemperatureSubscription {
  return subscribeToSensor<LightReading>(
    {
      topic,
      waitingStatus: 'En attente de la mesure du capteur de lumière...',
      invalidPayloadStatus: 'Mesure du capteur de lumière reçue invalide.'
    },
    onReading,
    onStatus
  );
}

export function subscribeToHumiditySensor(
  onReading: (reading: HumidityReading) => void,
  onStatus: (status: string) => void,
  topic = humidityTopic
): TemperatureSubscription {
  return subscribeToSensor<HumidityReading>(
    {
      topic,
      waitingStatus: "En attente de la mesure d'humidité...",
      invalidPayloadStatus: "Mesure d'humidité reçue invalide."
    },
    onReading,
    onStatus
  );
}

export function subscribeToGasSensor(
  onReading: (reading: GasReading) => void,
  onStatus: (status: string) => void,
  topic = gasTopic
): TemperatureSubscription {
  return subscribeToSensor<GasReading>(
    {
      topic,
      waitingStatus: 'En attente de la mesure du détecteur de fumée...',
      invalidPayloadStatus: 'Mesure du détecteur de fumée reçue invalide.'
    },
    onReading,
    onStatus
  );
}

export function subscribeToLedState(
  onReading: (reading: LedState) => void,
  onStatus: (status: string) => void,
  topic = ledStateTopic
): TemperatureSubscription {
  return subscribeToSensor<LedState>(
    {
      topic,
      waitingStatus: "En attente de l'état du contrôle de porte...",
      invalidPayloadStatus: 'État du contrôle de porte reçu invalide.'
    },
    onReading,
    onStatus
  );
}

export function publishLedCommand(
  enabled: boolean,
  commandTopic = ledCommandTopic
): Promise<void> {
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
        commandTopic,
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
      const message = error instanceof Error ? error.message : 'Erreur de connexion MQTT.';
      closeWithError(message);
    });

    client.on('offline', () => {
      closeWithError('La connexion MQTT est hors ligne.');
    });

    client.on('close', () => {
      if (!settled) {
        settled = true;
        reject(new Error("La connexion MQTT s'est fermée avant l'envoi de la commande de porte."));
      }
    });
  });
}

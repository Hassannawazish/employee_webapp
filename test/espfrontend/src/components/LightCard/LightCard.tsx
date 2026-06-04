import { useEffect, useState } from 'react';
import { LightReading, subscribeToLightSensor } from '../../api';
import '../TemperatureCard/TemperatureCard.css';

type LightCardProps = {
  roomName: string;
  topic?: string;
};

function formatTime(value?: string) {
  if (!value) {
    return 'Waiting for first reading';
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(value));
}

function LightCard({ roomName, topic }: LightCardProps) {
  const [reading, setReading] = useState<LightReading | null>(null);
  const [status, setStatus] = useState('Connecting to MQTT...');

  useEffect(() => {
    const subscription = subscribeToLightSensor(
      (latestReading) => {
        setReading(latestReading);
      },
      (nextStatus) => {
        setStatus(nextStatus);
      },
      topic
    );

    return () => {
      subscription.close();
    };
  }, [topic]);

  const lightLevel = reading ? `${reading.lightLevel.toFixed(0)} lux` : '-- lux';

  return (
    <article className="temperature-card light-card">
      <div className="card-heading">
        <p className="card-room">{roomName}</p>
        <h3 className="card-title">Light Sensor</h3>
      </div>
      <div className="card-topline">
        <span className={status === 'Live' ? 'status-dot live' : 'status-dot'} />
        <span>{status}</span>
      </div>

      <div className="gauge" aria-label={`Current light sensor level ${lightLevel}`}>
        <span>{lightLevel}</span>
      </div>

      <dl className="reading-meta">
        <div>
          <dt>Device</dt>
          <dd>{reading?.deviceId ?? 'ESP32'}</dd>
        </div>
        <div>
          <dt>Measure</dt>
          <dd>Light level</dd>
        </div>
        <div>
          <dt>Level</dt>
          <dd>{lightLevel}</dd>
        </div>
        <div>
          <dt>Updated</dt>
          <dd>{formatTime(reading?.recordedAtUtc)}</dd>
        </div>
      </dl>
    </article>
  );
}

export default LightCard;

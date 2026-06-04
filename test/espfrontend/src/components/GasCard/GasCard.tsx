import { useEffect, useState } from 'react';
import { GasReading, subscribeToGasSensor } from '../../api';
import '../TemperatureCard/TemperatureCard.css';

type GasCardProps = {
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

function GasCard({ roomName, topic }: GasCardProps) {
  const [reading, setReading] = useState<GasReading | null>(null);
  const [status, setStatus] = useState('Connecting to MQTT...');

  useEffect(() => {
    const subscription = subscribeToGasSensor(
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

  const smokeState = reading ? (reading.gasDetected ? 'Detected' : 'Clear') : '--';
  const digitalState = reading ? String(reading.digitalState) : '--';

  return (
    <article className="temperature-card gas-card">
      <div className="card-heading">
        <p className="card-room">{roomName}</p>
        <h3 className="card-title">Smoke Sensor</h3>
      </div>
      <div className="card-topline">
        <span className={status === 'Live' ? 'status-dot live' : 'status-dot'} />
        <span>{status}</span>
      </div>

      <div className="gauge" aria-label={`Current smoke sensor state ${smokeState}`}>
        <span>{smokeState}</span>
      </div>

      <dl className="reading-meta">
        <div>
          <dt>GPIO Pin</dt>
          <dd>{reading?.pin ?? '--'}</dd>
        </div>
        <div>
          <dt>Digital State</dt>
          <dd>{digitalState}</dd>
        </div>
        <div>
          <dt>Sensor</dt>
          <dd>Smoke detector</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{smokeState}</dd>
        </div>
        <div>
          <dt>Updated</dt>
          <dd>{formatTime(reading?.recordedAtUtc)}</dd>
        </div>
      </dl>
    </article>
  );
}

export default GasCard;

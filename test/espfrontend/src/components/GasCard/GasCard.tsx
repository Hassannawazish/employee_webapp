import { useEffect, useState } from 'react';
import { GasReading, subscribeToGasSensor } from '../../api';
import '../TemperatureCard/TemperatureCard.css';

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

function GasCard() {
  const [reading, setReading] = useState<GasReading | null>(null);
  const [status, setStatus] = useState('Connecting to MQTT...');

  useEffect(() => {
    const subscription = subscribeToGasSensor(
      (latestReading) => {
        setReading(latestReading);
      },
      (nextStatus) => {
        setStatus(nextStatus);
      }
    );

    return () => {
      subscription.close();
    };
  }, []);

  const gasState = reading ? (reading.gasDetected ? 'Detected' : 'Clear') : '--';
  const digitalState = reading ? String(reading.digitalState) : '--';

  return (
    <article className="temperature-card gas-card">
      <div className="card-topline">
        <span className={status === 'Live' ? 'status-dot live' : 'status-dot'} />
        <span>{status}</span>
      </div>

      <div className="gauge" aria-label={`Current gas sensor state ${gasState}`}>
        <span>{gasState}</span>
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
          <dd>Gas / smoke</dd>
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

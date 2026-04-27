import { useEffect, useState } from 'react';
import { RainReading, subscribeToRainSensor } from '../../api';
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

function RainCard() {
  const [reading, setReading] = useState<RainReading | null>(null);
  const [status, setStatus] = useState('Connecting to MQTT...');

  useEffect(() => {
    const subscription = subscribeToRainSensor(
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

  const rainState = reading ? (reading.rainDetected ? 'Wet' : 'Dry') : '--';
  const digitalState = reading ? String(reading.digitalState) : '--';

  return (
    <article className="temperature-card rain-card">
      <div className="card-topline">
        <span className={status === 'Live' ? 'status-dot live' : 'status-dot'} />
        <span>{status}</span>
      </div>

      <div className="gauge" aria-label={`Current rain sensor state ${rainState}`}>
        <span>{rainState}</span>
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
          <dd>Rain / water</dd>
        </div>
        <div>
          <dt>Updated</dt>
          <dd>{formatTime(reading?.recordedAtUtc)}</dd>
        </div>
      </dl>
    </article>
  );
}

export default RainCard;

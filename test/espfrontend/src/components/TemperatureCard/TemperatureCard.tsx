import { useEffect, useState } from 'react';
import { getLatestTemperature, TemperatureReading } from '../../api';
import './TemperatureCard.css';

const refreshMs = 5000;

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

function TemperatureCard() {
  const [reading, setReading] = useState<TemperatureReading | null>(null);
  const [status, setStatus] = useState('Connecting to API...');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadTemperature() {
      try {
        const latestReading = await getLatestTemperature();

        if (!isMounted) {
          return;
        }

        setReading(latestReading);
        setStatus('Live');
      } catch (error) {
        if (isMounted) {
          setStatus(error instanceof Error ? error.message : 'Unable to read temperature.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadTemperature();
    const intervalId = window.setInterval(loadTemperature, refreshMs);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const temperature = reading ? `${reading.temperatureC.toFixed(1)} C` : '--.- C';

  return (
    <article className="temperature-card">
      <div className="card-topline">
        <span className={status === 'Live' ? 'status-dot live' : 'status-dot'} />
        <span>{isLoading ? 'Loading' : status}</span>
      </div>

      <div className="gauge" aria-label={`Current ESP32 internal temperature ${temperature}`}>
        <span>{temperature}</span>
      </div>

      <dl className="reading-meta">
        <div>
          <dt>Device</dt>
          <dd>{reading?.deviceId ?? 'ESP32'}</dd>
        </div>
        <div>
          <dt>Updated</dt>
          <dd>{formatTime(reading?.recordedAtUtc)}</dd>
        </div>
      </dl>
    </article>
  );
}

export default TemperatureCard;

import { useEffect, useState } from 'react';
import { subscribeToTemperature, TemperatureReading } from '../../api';
import './TemperatureCard.css';

function formatTime(value?: string) {
  if (!value) {
    return 'En attente de la premiere mesure';
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(value));
}

function TemperatureCard() {
  const [reading, setReading] = useState<TemperatureReading | null>(null);
  const [status, setStatus] = useState('Connexion a MQTT...');

  useEffect(() => {
    const subscription = subscribeToTemperature(
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

  const temperature = reading ? `${reading.temperatureC.toFixed(1)} C` : '--.- C';

  return (
    <article className="temperature-card">
      <div className="card-topline">
        <span className={status === 'En direct' ? 'status-dot live' : 'status-dot'} />
        <span>{status}</span>
      </div>

      <div className="gauge" aria-label={`Temperature interne actuelle de l'ESP32 ${temperature}`}>
        <span>{temperature}</span>
      </div>

      <dl className="reading-meta">
        <div>
          <dt>Appareil</dt>
          <dd>{reading?.deviceId ?? 'ESP32'}</dd>
        </div>
        <div>
          <dt>Mise a jour</dt>
          <dd>{formatTime(reading?.recordedAtUtc)}</dd>
        </div>
      </dl>
    </article>
  );
}

export default TemperatureCard;

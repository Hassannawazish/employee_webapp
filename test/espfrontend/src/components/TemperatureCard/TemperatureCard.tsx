import { useEffect, useState } from 'react';
import { subscribeToTemperature, TemperatureReading } from '../../api';
import './TemperatureCard.css';

type TemperatureCardProps = {
  roomName: string;
  topic?: string | null;
};

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

function TemperatureCard({ roomName, topic }: TemperatureCardProps) {
  const [reading, setReading] = useState<TemperatureReading | null>(null);
  const [status, setStatus] = useState('Connexion a MQTT...');

  useEffect(() => {
    if (topic === null) {
      setReading(null);
      setStatus('Aucun flux MQTT pour cette salle.');
      return;
    }

    const subscription = subscribeToTemperature(
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

  const temperature = reading ? `${reading.temperatureC.toFixed(1)} C` : '--.- C';

  return (
    <article className="temperature-card">
      <div className="card-heading">
        <p className="card-room">{roomName}</p>
        <h3 className="card-title">Capteur de temperature</h3>
      </div>
      <div className="card-topline">
        <span className={status === 'En direct' ? 'status-dot live' : 'status-dot'} />
        <span>{status}</span>
      </div>

      <div className="gauge" aria-label={`Niveau actuel du capteur de temperature ${temperature}`}>
        <span>{temperature}</span>
      </div>

      <dl className="reading-meta">
        <div>
          <dt>Appareil</dt>
          <dd>{reading?.deviceId ?? 'ESP32'}</dd>
        </div>
        <div>
          <dt>Mesure</dt>
          <dd>Temperature</dd>
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

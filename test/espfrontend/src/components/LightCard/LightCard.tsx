import { useEffect, useState } from 'react';
import { LightReading, subscribeToLightSensor } from '../../api';
import '../TemperatureCard/TemperatureCard.css';

type LightCardProps = {
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

function LightCard({ roomName, topic }: LightCardProps) {
  const [reading, setReading] = useState<LightReading | null>(null);
  const [status, setStatus] = useState('Connexion a MQTT...');

  useEffect(() => {
    if (topic === null) {
      setReading(null);
      setStatus('Aucun flux MQTT pour cette salle.');
      return;
    }

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
        <h3 className="card-title">Capteur de lumiere</h3>
      </div>
      <div className="card-topline">
        <span className={status === 'En direct' ? 'status-dot live' : 'status-dot'} />
        <span>{status}</span>
      </div>

      <div className="gauge" aria-label={`Niveau actuel du capteur de lumiere ${lightLevel}`}>
        <span>{lightLevel}</span>
      </div>

      <dl className="reading-meta">
        <div>
          <dt>Appareil</dt>
          <dd>{reading?.deviceId ?? 'ESP32'}</dd>
        </div>
        <div>
          <dt>Mesure</dt>
          <dd>Niveau de lumiere</dd>
        </div>
        <div>
          <dt>Niveau</dt>
          <dd>{lightLevel}</dd>
        </div>
        <div>
          <dt>Mise a jour</dt>
          <dd>{formatTime(reading?.recordedAtUtc)}</dd>
        </div>
      </dl>
    </article>
  );
}

export default LightCard;

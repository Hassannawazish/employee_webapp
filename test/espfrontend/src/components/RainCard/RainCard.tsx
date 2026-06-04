import { useEffect, useState } from 'react';
import { RainReading, subscribeToRainSensor } from '../../api';
import '../TemperatureCard/TemperatureCard.css';

type RainCardProps = {
  roomName: string;
  topic?: string;
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

function RainCard({ roomName, topic }: RainCardProps) {
  const [reading, setReading] = useState<RainReading | null>(null);
  const [status, setStatus] = useState('Connexion a MQTT...');

  useEffect(() => {
    const subscription = subscribeToRainSensor(
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

  const doorLockState = reading ? (reading.rainDetected ? 'Verrouillee' : 'Deverrouillee') : '--';
  const digitalState = reading ? String(reading.digitalState) : '--';

  return (
    <article className="temperature-card rain-card">
      <div className="card-heading">
        <p className="card-room">{roomName}</p>
        <h3 className="card-title">Etat du verrouillage de la porte</h3>
      </div>
      <div className="card-topline">
        <span className={status === 'En direct' ? 'status-dot live' : 'status-dot'} />
        <span>{status}</span>
      </div>

      <div className="gauge" aria-label={`Etat actuel du verrouillage de la porte ${doorLockState}`}>
        <span>{doorLockState}</span>
      </div>

      <dl className="reading-meta">
        <div>
          <dt>Broche GPIO</dt>
          <dd>{reading?.pin ?? '--'}</dd>
        </div>
        <div>
          <dt>Etat numerique</dt>
          <dd>{digitalState}</dd>
        </div>
        <div>
          <dt>Acces</dt>
          <dd>Verrou principal</dd>
        </div>
        <div>
          <dt>Statut</dt>
          <dd>{doorLockState}</dd>
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

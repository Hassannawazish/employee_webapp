import { useEffect, useState } from 'react';
import { GasReading, subscribeToGasSensor } from '../../api';
import '../TemperatureCard/TemperatureCard.css';

type GasCardProps = {
  roomName: string;
  topic?: string | null;
};

function formatTime(value?: string) {
  if (!value) {
    return 'En attente de la première mesure';
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(value));
}

function GasCard({ roomName, topic }: GasCardProps) {
  const [reading, setReading] = useState<GasReading | null>(null);
  const [status, setStatus] = useState('Connexion à MQTT...');

  useEffect(() => {
    if (topic === null) {
      setReading(null);
      setStatus('Aucun flux MQTT pour cette salle.');
      return;
    }

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

  const smokeState = reading ? (reading.gasDetected ? 'Détectée' : 'Normale') : '--';
  const digitalState = reading ? String(reading.digitalState) : '--';

  return (
    <article className="temperature-card gas-card">
      <div className="card-heading">
        <p className="card-room">{roomName}</p>
        <h3 className="card-title">Détecteur de fumée</h3>
      </div>
      <div className="card-topline">
        <span className={status === 'En direct' ? 'status-dot live' : 'status-dot'} />
        <span>{status}</span>
      </div>

      <div className="gauge" aria-label={`État actuel du détecteur de fumée ${smokeState}`}>
        <span>{smokeState}</span>
      </div>

      <dl className="reading-meta">
        <div>
          <dt>Broche GPIO</dt>
          <dd>{reading?.pin ?? '--'}</dd>
        </div>
        <div>
          <dt>État numérique</dt>
          <dd>{digitalState}</dd>
        </div>
        <div>
          <dt>Capteur</dt>
          <dd>Détecteur de fumée</dd>
        </div>
        <div>
          <dt>Statut</dt>
          <dd>{smokeState}</dd>
        </div>
        <div>
          <dt>Mise à jour</dt>
          <dd>{formatTime(reading?.recordedAtUtc)}</dd>
        </div>
      </dl>
    </article>
  );
}

export default GasCard;

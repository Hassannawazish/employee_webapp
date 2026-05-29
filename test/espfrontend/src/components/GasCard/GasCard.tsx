import { useEffect, useState } from 'react';
import { GasReading, subscribeToGasSensor } from '../../api';
import '../TemperatureCard/TemperatureCard.css';

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

function GasCard() {
  const [reading, setReading] = useState<GasReading | null>(null);
  const [status, setStatus] = useState('Connexion a MQTT...');

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

  const gasState = reading ? (reading.gasDetected ? 'Detecte' : 'Aucun') : '--';
  const digitalState = reading ? String(reading.digitalState) : '--';

  return (
    <article className="temperature-card gas-card">
      <div className="card-topline">
        <span className={status === 'En direct' ? 'status-dot live' : 'status-dot'} />
        <span>{status}</span>
      </div>

      <div className="gauge" aria-label={`Etat actuel du capteur de gaz ${gasState}`}>
        <span>{gasState}</span>
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
          <dt>Capteur</dt>
          <dd>Gaz / fumee</dd>
        </div>
        <div>
          <dt>Mise a jour</dt>
          <dd>{formatTime(reading?.recordedAtUtc)}</dd>
        </div>
      </dl>
    </article>
  );
}

export default GasCard;

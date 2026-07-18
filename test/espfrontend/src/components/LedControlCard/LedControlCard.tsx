import { useEffect, useState } from 'react';
import { LedState, publishLedCommand, subscribeToLedState } from '../../api';
import '../TemperatureCard/TemperatureCard.css';

type LedControlCardProps = {
  roomName: string;
  commandTopic?: string | null;
  stateTopic?: string | null;
};

function formatTime(value?: string) {
  if (!value) {
    return 'En attente de la première mise à jour';
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(value));
}

function LedControlCard({
  roomName,
  commandTopic,
  stateTopic
}: LedControlCardProps) {
  const [ledState, setLedState] = useState<LedState | null>(null);
  const [status, setStatus] = useState('Connexion à MQTT...');
  const [commandStatus, setCommandStatus] = useState('Prêt à envoyer');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (stateTopic === null) {
      setLedState(null);
      setStatus('Aucun flux MQTT pour cette salle.');
      setCommandStatus('Commande indisponible pour cette salle.');
      return;
    }

    const subscription = subscribeToLedState(
      (latestState) => {
        setLedState(latestState);
      },
      (nextStatus) => {
        setStatus(nextStatus);
      },
      stateTopic
    );

    return () => {
      subscription.close();
    };
  }, [stateTopic]);

  async function handleToggle(nextEnabled: boolean) {
    if (commandTopic === null) {
      setCommandStatus('Commande indisponible pour cette salle.');
      return;
    }

    try {
      setIsSending(true);
      setCommandStatus(nextEnabled ? 'Envoi de la commande de verrouillage...' : 'Envoi de la commande de déverrouillage...');
      await publishLedCommand(nextEnabled, commandTopic);
      setCommandStatus(nextEnabled ? 'Commande de verrouillage envoyée.' : 'Commande de déverrouillage envoyée.');
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible d'envoyer la commande de porte.";
      setCommandStatus(message);
    } finally {
      setIsSending(false);
    }
  }

  const isEnabled = ledState?.enabled ?? false;
  const doorLabel = ledState ? (ledState.enabled ? 'Verrouillée' : 'Déverrouillée') : '--';
  const controlsDisabled = isSending || commandTopic === null;

  return (
    <article className="temperature-card led-card">
      <div className="card-heading">
        <p className="card-room">{roomName}</p>
        <h3 className="card-title">Contrôle de porte</h3>
      </div>
      <div className="card-topline">
        <span className={status === 'En direct' ? 'status-dot live' : 'status-dot'} />
        <span>{status}</span>
      </div>

      <div className="gauge" aria-label={`État actuel du contrôle de porte ${doorLabel}`}>
        <span>{doorLabel}</span>
      </div>

      <div className="led-controls">
        <button
          type="button"
          className={!isEnabled ? 'led-button active' : 'led-button'}
          onClick={() => handleToggle(false)}
          disabled={controlsDisabled}
        >
          Déverrouiller
        </button>
        <button
          type="button"
          className={isEnabled ? 'led-button active' : 'led-button'}
          onClick={() => handleToggle(true)}
          disabled={controlsDisabled}
        >
          Verrouiller
        </button>
      </div>

      <p className="command-status">{commandStatus}</p>

      <dl className="reading-meta">
        <div>
          <dt>Broche GPIO</dt>
          <dd>{ledState?.pin ?? '--'}</dd>
        </div>
        <div>
          <dt>État</dt>
          <dd>{doorLabel}</dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>{ledState?.source ?? 'Commande MQTT de porte'}</dd>
        </div>
        <div>
          <dt>Mise à jour</dt>
          <dd>{formatTime(ledState?.recordedAtUtc)}</dd>
        </div>
      </dl>
    </article>
  );
}

export default LedControlCard;

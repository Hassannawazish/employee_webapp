import { useEffect, useState } from 'react';
import { LedState, publishLedCommand, subscribeToLedState } from '../../api';
import '../TemperatureCard/TemperatureCard.css';

function formatTime(value?: string) {
  if (!value) {
    return 'En attente de la premiere mise a jour';
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(value));
}

function LedControlCard() {
  const [ledState, setLedState] = useState<LedState | null>(null);
  const [status, setStatus] = useState('Connexion a MQTT...');
  const [commandStatus, setCommandStatus] = useState('Pret a envoyer');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const subscription = subscribeToLedState(
      (latestState) => {
        setLedState(latestState);
      },
      (nextStatus) => {
        setStatus(nextStatus);
      }
    );

    return () => {
      subscription.close();
    };
  }, []);

  async function handleToggle(nextEnabled: boolean) {
    try {
      setIsSending(true);
      setCommandStatus(`Envoi de ${String(nextEnabled)}...`);
      await publishLedCommand(nextEnabled);
      setCommandStatus(`Commande envoyee : ${String(nextEnabled)}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible d'envoyer la commande LED.";
      setCommandStatus(message);
    } finally {
      setIsSending(false);
    }
  }

  const isEnabled = ledState?.enabled ?? false;
  const ledLabel = ledState ? (ledState.enabled ? 'ON' : 'OFF') : '--';

  return (
    <article className="temperature-card led-card">
      <div className="card-topline">
        <span className={status === 'En direct' ? 'status-dot live' : 'status-dot'} />
        <span>{status}</span>
      </div>

      <div className="gauge" aria-label={`Etat actuel de la LED ${ledLabel}`}>
        <span>{ledLabel}</span>
      </div>

      <div className="led-controls">
        <button
          type="button"
          className={!isEnabled ? 'led-button active' : 'led-button'}
          onClick={() => handleToggle(false)}
          disabled={isSending}
        >
          Desactive
        </button>
        <button
          type="button"
          className={isEnabled ? 'led-button active' : 'led-button'}
          onClick={() => handleToggle(true)}
          disabled={isSending}
        >
          Active
        </button>
      </div>

      <p className="command-status">{commandStatus}</p>

      <dl className="reading-meta">
        <div>
          <dt>Broche GPIO</dt>
          <dd>{ledState?.pin ?? '--'}</dd>
        </div>
        <div>
          <dt>Etat</dt>
          <dd>{ledLabel}</dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>{ledState?.source ?? 'Commande MQTT'}</dd>
        </div>
        <div>
          <dt>Mise a jour</dt>
          <dd>{formatTime(ledState?.recordedAtUtc)}</dd>
        </div>
      </dl>
    </article>
  );
}

export default LedControlCard;

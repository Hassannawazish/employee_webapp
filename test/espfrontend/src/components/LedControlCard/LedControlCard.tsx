import { useEffect, useState } from 'react';
import { LedState, publishLedCommand, subscribeToLedState } from '../../api';
import '../TemperatureCard/TemperatureCard.css';

function formatTime(value?: string) {
  if (!value) {
    return 'Waiting for first update';
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(value));
}

function LedControlCard() {
  const [ledState, setLedState] = useState<LedState | null>(null);
  const [status, setStatus] = useState('Connecting to MQTT...');
  const [commandStatus, setCommandStatus] = useState('Ready to send');
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
      setCommandStatus(`Sending ${String(nextEnabled)}...`);
      await publishLedCommand(nextEnabled);
      setCommandStatus(`Command sent: ${String(nextEnabled)}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to publish LED command.';
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
        <span className={status === 'Live' ? 'status-dot live' : 'status-dot'} />
        <span>{status}</span>
      </div>

      <div className="gauge" aria-label={`Current LED state ${ledLabel}`}>
        <span>{ledLabel}</span>
      </div>

      <div className="led-controls">
        <button
          type="button"
          className={!isEnabled ? 'led-button active' : 'led-button'}
          onClick={() => handleToggle(false)}
          disabled={isSending}
        >
          False
        </button>
        <button
          type="button"
          className={isEnabled ? 'led-button active' : 'led-button'}
          onClick={() => handleToggle(true)}
          disabled={isSending}
        >
          True
        </button>
      </div>

      <p className="command-status">{commandStatus}</p>

      <dl className="reading-meta">
        <div>
          <dt>GPIO Pin</dt>
          <dd>{ledState?.pin ?? '--'}</dd>
        </div>
        <div>
          <dt>State</dt>
          <dd>{ledLabel}</dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>{ledState?.source ?? 'MQTT command'}</dd>
        </div>
        <div>
          <dt>Updated</dt>
          <dd>{formatTime(ledState?.recordedAtUtc)}</dd>
        </div>
      </dl>
    </article>
  );
}

export default LedControlCard;

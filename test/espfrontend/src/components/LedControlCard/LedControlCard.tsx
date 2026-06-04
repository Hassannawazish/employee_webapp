import { useEffect, useState } from 'react';
import { LedState, publishLedCommand, subscribeToLedState } from '../../api';
import '../TemperatureCard/TemperatureCard.css';

type LedControlCardProps = {
  roomName: string;
  commandTopic?: string;
  stateTopic?: string;
};

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

function LedControlCard({
  roomName,
  commandTopic,
  stateTopic
}: LedControlCardProps) {
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
      },
      stateTopic
    );

    return () => {
      subscription.close();
    };
  }, [stateTopic]);

  async function handleToggle(nextEnabled: boolean) {
    try {
      setIsSending(true);
      setCommandStatus(nextEnabled ? 'Sending lock command...' : 'Sending unlock command...');
      await publishLedCommand(nextEnabled, commandTopic);
      setCommandStatus(nextEnabled ? 'Door lock command sent.' : 'Door unlock command sent.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to publish LED command.';
      setCommandStatus(message);
    } finally {
      setIsSending(false);
    }
  }

  const isEnabled = ledState?.enabled ?? false;
  const doorLabel = ledState ? (ledState.enabled ? 'Locked' : 'Unlocked') : '--';

  return (
    <article className="temperature-card led-card">
      <div className="card-heading">
        <p className="card-room">{roomName}</p>
        <h3 className="card-title">Door Control</h3>
      </div>
      <div className="card-topline">
        <span className={status === 'Live' ? 'status-dot live' : 'status-dot'} />
        <span>{status}</span>
      </div>

      <div className="gauge" aria-label={`Current door control state ${doorLabel}`}>
        <span>{doorLabel}</span>
      </div>

      <div className="led-controls">
        <button
          type="button"
          className={!isEnabled ? 'led-button active' : 'led-button'}
          onClick={() => handleToggle(false)}
          disabled={isSending}
        >
          Unlock
        </button>
        <button
          type="button"
          className={isEnabled ? 'led-button active' : 'led-button'}
          onClick={() => handleToggle(true)}
          disabled={isSending}
        >
          Lock
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
          <dd>{doorLabel}</dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>{ledState?.source ?? 'MQTT door command'}</dd>
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

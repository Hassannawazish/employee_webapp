import { useEffect, useState } from 'react';
import './App.css';
import roomDoor from './assets/room-one-door.svg';
import scaiLogo from './assets/scailogo.png';
import GasCard from './components/GasCard/GasCard';
import LightCard from './components/LightCard/LightCard';
import LedControlCard from './components/LedControlCard/LedControlCard';
import RainCard from './components/RainCard/RainCard';
import TemperatureCard from './components/TemperatureCard/TemperatureCard';

type RoomDefinition = {
  description: string;
  doorAlt: string;
  doorCaption: string;
  id: string;
  name: string;
  pagePath: string;
  summaryNote: string;
  temperatureTopic?: string;
  lightTopic?: string;
  rainTopic?: string;
  gasTopic?: string;
  ledCommandTopic?: string;
  ledStateTopic?: string;
};

const ROOMS: RoomDefinition[] = [
  {
    id: 'room-1',
    name: 'Room 1',
    pagePath: '/rooms/room-1',
    description:
      'Monitor the five live controls and sensors installed in Room 1 in a single view. Track temperature, light level, door lock status, smoke activity, and door control updates from the room hardware.',
    doorAlt: 'Room 1 door',
    doorCaption: 'Room 1 entrance view linked to the four live sensor feeds.',
    summaryNote: 'All five cards on this page report data for Room 1.',
    temperatureTopic: process.env.REACT_APP_ROOM_1_TEMPERATURE_TOPIC,
    lightTopic: process.env.REACT_APP_ROOM_1_LIGHT_TOPIC,
    rainTopic: process.env.REACT_APP_ROOM_1_RAIN_TOPIC,
    gasTopic: process.env.REACT_APP_ROOM_1_GAS_TOPIC,
    ledCommandTopic: process.env.REACT_APP_ROOM_1_LED_COMMAND_TOPIC,
    ledStateTopic: process.env.REACT_APP_ROOM_1_LED_STATE_TOPIC
  },
  {
    id: 'room-2',
    name: 'Room 2',
    pagePath: '/rooms/room-2',
    description:
      'Keep Room 2 on its own dedicated page so the temperature, light, door lock, smoke, and door control cards stay focused on one area at a time.',
    doorAlt: 'Room 2 door',
    doorCaption: 'Room 2 entrance view linked to the four live sensor feeds.',
    summaryNote: 'All five cards on this page report data for Room 2.',
    temperatureTopic: process.env.REACT_APP_ROOM_2_TEMPERATURE_TOPIC,
    lightTopic: process.env.REACT_APP_ROOM_2_LIGHT_TOPIC,
    rainTopic: process.env.REACT_APP_ROOM_2_RAIN_TOPIC,
    gasTopic: process.env.REACT_APP_ROOM_2_GAS_TOPIC,
    ledCommandTopic: process.env.REACT_APP_ROOM_2_LED_COMMAND_TOPIC,
    ledStateTopic: process.env.REACT_APP_ROOM_2_LED_STATE_TOPIC
  },
  {
    id: 'room-3',
    name: 'Room 3',
    pagePath: '/rooms/room-3',
    description:
      'Use the Room 3 page to watch temperature, light, door lock, smoke, and door control updates without mixing them with the other rooms.',
    doorAlt: 'Room 3 door',
    doorCaption: 'Room 3 entrance view linked to the four live sensor feeds.',
    summaryNote: 'All five cards on this page report data for Room 3.',
    temperatureTopic: process.env.REACT_APP_ROOM_3_TEMPERATURE_TOPIC,
    lightTopic: process.env.REACT_APP_ROOM_3_LIGHT_TOPIC,
    rainTopic: process.env.REACT_APP_ROOM_3_RAIN_TOPIC,
    gasTopic: process.env.REACT_APP_ROOM_3_GAS_TOPIC,
    ledCommandTopic: process.env.REACT_APP_ROOM_3_LED_COMMAND_TOPIC,
    ledStateTopic: process.env.REACT_APP_ROOM_3_LED_STATE_TOPIC
  },
  {
    id: 'room-4',
    name: 'Room 4',
    pagePath: '/rooms/room-4',
    description:
      'Open the Room 4 page to review the same five room systems on a dedicated webpage for that room.',
    doorAlt: 'Room 4 door',
    doorCaption: 'Room 4 entrance view linked to the four live sensor feeds.',
    summaryNote: 'All five cards on this page report data for Room 4.',
    temperatureTopic: process.env.REACT_APP_ROOM_4_TEMPERATURE_TOPIC,
    lightTopic: process.env.REACT_APP_ROOM_4_LIGHT_TOPIC,
    rainTopic: process.env.REACT_APP_ROOM_4_RAIN_TOPIC,
    gasTopic: process.env.REACT_APP_ROOM_4_GAS_TOPIC,
    ledCommandTopic: process.env.REACT_APP_ROOM_4_LED_COMMAND_TOPIC,
    ledStateTopic: process.env.REACT_APP_ROOM_4_LED_STATE_TOPIC
  }
];

const DEFAULT_ROOM = ROOMS[0];

function findRoomByPath(pathname: string) {
  return ROOMS.find((room) => room.pagePath === pathname) ?? DEFAULT_ROOM;
}

function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    if (pathname === DEFAULT_ROOM.pagePath) {
      return;
    }

    const matchingRoom = ROOMS.find((room) => room.pagePath === pathname);
    if (matchingRoom) {
      return;
    }

    window.history.replaceState({}, '', DEFAULT_ROOM.pagePath);
    setPathname(DEFAULT_ROOM.pagePath);
  }, [pathname]);

  const activeRoom = findRoomByPath(pathname);

  function navigateToRoom(nextRoom: RoomDefinition) {
    if (nextRoom.pagePath === pathname) {
      return;
    }

    window.history.pushState({}, '', nextRoom.pagePath);
    setPathname(nextRoom.pagePath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <main className="app-shell">
      <section className="monitor-layout" aria-label={`${activeRoom.name} sensor monitor`}>
        <div className="monitor-copy">
          <div className="brand-lockup">
            <div className="brand-logo-wrap">
              <img className="brand-logo" src={scaiLogo} alt="SCAI Systems logo" />
            </div>
            <div>
              <p className="eyebrow">SCAI Systems</p>
              <h1>{activeRoom.name} Sensor Command Center</h1>
            </div>
          </div>

          <div className="room-selector" aria-label="Room navigation">
            {ROOMS.map((room) => {
              const isActive = room.id === activeRoom.id;

              return (
                <button
                  key={room.id}
                  type="button"
                  className={isActive ? 'room-button active' : 'room-button'}
                  onClick={() => navigateToRoom(room)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {room.name}
                </button>
              );
            })}
          </div>

          <p className="route-label">Dedicated page: {activeRoom.pagePath}</p>

          <p className="lede">{activeRoom.description}</p>

          <div className="monitor-highlights" aria-label={`${activeRoom.name} summary`}>
            <div className="highlight-chip">
              <span className="highlight-label">Room</span>
              <strong>{activeRoom.name}</strong>
            </div>
            <div className="highlight-chip">
              <span className="highlight-label">Sensors</span>
              <strong>5 Room Systems</strong>
            </div>
            <div className="highlight-chip">
              <span className="highlight-label">Transport</span>
              <strong>MQTT + WebSocket</strong>
            </div>
          </div>

          <figure className="room-door-card">
            <img className="room-door-image" src={roomDoor} alt={activeRoom.doorAlt} />
            <figcaption>{activeRoom.doorCaption}</figcaption>
          </figure>

          <div className="monitor-note">
            <span className="note-pulse" aria-hidden="true" />
            {activeRoom.summaryNote}
          </div>
        </div>

        <div className="sensor-panel">
          <div className="sensor-panel-copy">
            <p className="sensor-panel-kicker">Live Room Feed</p>
            <h2>{activeRoom.name} Sensors</h2>
            <p>
              This dedicated webpage is reserved for the Temperature Sensor,
              Light Sensor, Door Lock Status, Smoke Sensor, and Door Control
              cards assigned to {activeRoom.name}.
            </p>
          </div>

          <div className="sensor-grid">
            <TemperatureCard roomName={activeRoom.name} topic={activeRoom.temperatureTopic} />
            <LightCard roomName={activeRoom.name} topic={activeRoom.lightTopic} />
            <RainCard roomName={activeRoom.name} topic={activeRoom.rainTopic} />
            <GasCard roomName={activeRoom.name} topic={activeRoom.gasTopic} />
            <LedControlCard
              roomName={activeRoom.name}
              commandTopic={activeRoom.ledCommandTopic}
              stateTopic={activeRoom.ledStateTopic}
            />
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;

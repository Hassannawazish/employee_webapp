import { ChangeEvent, useEffect, useState } from 'react';
import './App.css';
import scaiLogo from './assets/scailogo.png';
import roomDoor from './assets/room-one-door.svg';
import stockChimiqueDoor from './assets/stock-chimique-door.svg';
import stockMetalApportDoor from './assets/stock-metal-apport-door.svg';
import GasCard from './components/GasCard/GasCard';
import HumidityCard from './components/HumidityCard/HumidityCard';
import LightCard from './components/LightCard/LightCard';
import MaterialTestingCard from './components/MaterialTestingCard/MaterialTestingCard';
import LedControlCard from './components/LedControlCard/LedControlCard';
import RainCard from './components/RainCard/RainCard';
import TemperatureCard from './components/TemperatureCard/TemperatureCard';

type RoomDefinition = {
  hasMaterialTesting?: boolean;
  customDoorImage?: string;
  description: string;
  doorAlt: string;
  doorCaption: string;
  fixedDoorImageUrl?: string;
  doorVariant: 'generic' | 'chimique' | 'metal-apport';
  id: string;
  name: string;
  pagePath: string;
  summaryNote: string;
  temperatureTopic?: string;
  lightTopic?: string;
  humidityTopic?: string;
  rainTopic?: string;
  gasTopic?: string;
  ledCommandTopic?: string;
  ledStateTopic?: string;
};

const ROOM_STORAGE_KEY = 'scai-control-room-pages';
const ROOM_IMAGE_DB_NAME = 'scai-control-room-images';
const ROOM_IMAGE_STORE_NAME = 'roomImages';

const INITIAL_ROOMS: RoomDefinition[] = [
  {
    id: 'room-1',
    name: 'Stock chimique',
    pagePath: '/rooms/room-1',
    description:
      "Surveillez, dans une seule vue, les six capteurs, les commandes en direct et le contrôle des tests de matériaux du stock de produits chimiques. Suivez la température, le niveau de luminosité, l’humidité, l’état de verrouillage de la porte, l’activité du détecteur de fumée et le contrôle d’accès afin de protéger les produits sensibles.",
    hasMaterialTesting: true,
    doorAlt: 'Porte du stock chimique',
    doorCaption: "Vue de la porte du stock chimique reliée aux six flux de sécurité en direct.",
    fixedDoorImageUrl: `${process.env.PUBLIC_URL}/stock-chimique-room.jpg.jpeg`,
    doorVariant: 'chimique',
    summaryNote: 'Les sept cartes de cette page affichent les données du stock chimique.',
    temperatureTopic: process.env.REACT_APP_ROOM_1_TEMPERATURE_TOPIC,
    lightTopic: process.env.REACT_APP_ROOM_1_LIGHT_TOPIC,
    humidityTopic: process.env.REACT_APP_ROOM_1_HUMIDITY_TOPIC,
    rainTopic: process.env.REACT_APP_ROOM_1_RAIN_TOPIC,
    gasTopic: process.env.REACT_APP_ROOM_1_GAS_TOPIC,
    ledCommandTopic: process.env.REACT_APP_ROOM_1_LED_COMMAND_TOPIC,
    ledStateTopic: process.env.REACT_APP_ROOM_1_LED_STATE_TOPIC
  },
  {
    id: 'room-2',
    name: "Stock métal d'apport",
    pagePath: '/rooms/room-2',
    description:
      'Surveillez le stock de métal d’apport depuis sa propre page dédiée afin que les cartes Température, Lumière, Verrouillage, Fumée et Contrôle de porte restent centrées sur cette zone de stockage technique.',
    doorAlt: "Porte du stock métal d'apport",
    doorCaption: "Vue de la porte du stock métal d'apport reliée aux six flux de surveillance en direct.",
    fixedDoorImageUrl: `${process.env.PUBLIC_URL}/stock-metal-apport-door.jpeg`,
    doorVariant: 'metal-apport',
    summaryNote: "Les six cartes de cette page affichent les données du stock métal d'apport.",
    temperatureTopic: process.env.REACT_APP_ROOM_2_TEMPERATURE_TOPIC,
    lightTopic: process.env.REACT_APP_ROOM_2_LIGHT_TOPIC,
    humidityTopic: process.env.REACT_APP_ROOM_2_HUMIDITY_TOPIC,
    rainTopic: process.env.REACT_APP_ROOM_2_RAIN_TOPIC,
    gasTopic: process.env.REACT_APP_ROOM_2_GAS_TOPIC,
    ledCommandTopic: process.env.REACT_APP_ROOM_2_LED_COMMAND_TOPIC,
    ledStateTopic: process.env.REACT_APP_ROOM_2_LED_STATE_TOPIC
  },
  {
    id: 'room-3',
    name: 'Salle 3',
    pagePath: '/rooms/room-3',
    description:
      "Utilisez la page de la Salle 3 pour suivre la température, la lumière, l'humidité, le verrouillage de porte, la fumée et le contrôle de porte sans les mélanger avec les autres salles.",
    doorAlt: 'Porte de la Salle 3',
    doorCaption: "Vue de l'entrée de la Salle 3 liée aux six flux en direct.",
    doorVariant: 'generic',
    summaryNote: 'Les six cartes de cette page affichent les données de la Salle 3.',
    temperatureTopic: process.env.REACT_APP_ROOM_3_TEMPERATURE_TOPIC,
    lightTopic: process.env.REACT_APP_ROOM_3_LIGHT_TOPIC,
    humidityTopic: process.env.REACT_APP_ROOM_3_HUMIDITY_TOPIC,
    rainTopic: process.env.REACT_APP_ROOM_3_RAIN_TOPIC,
    gasTopic: process.env.REACT_APP_ROOM_3_GAS_TOPIC,
    ledCommandTopic: process.env.REACT_APP_ROOM_3_LED_COMMAND_TOPIC,
    ledStateTopic: process.env.REACT_APP_ROOM_3_LED_STATE_TOPIC
  },
  {
    id: 'room-4',
    name: 'Salle 4',
    pagePath: '/rooms/room-4',
    description:
      'Ouvrez la page de la Salle 4 pour consulter les six mêmes systèmes de salle sur une page web dédiée à cette salle.',
    doorAlt: 'Porte de la Salle 4',
    doorCaption: "Vue de l'entrée de la Salle 4 liée aux six flux en direct.",
    doorVariant: 'generic',
    summaryNote: 'Les six cartes de cette page affichent les données de la Salle 4.',
    temperatureTopic: process.env.REACT_APP_ROOM_4_TEMPERATURE_TOPIC,
    lightTopic: process.env.REACT_APP_ROOM_4_LIGHT_TOPIC,
    humidityTopic: process.env.REACT_APP_ROOM_4_HUMIDITY_TOPIC,
    rainTopic: process.env.REACT_APP_ROOM_4_RAIN_TOPIC,
    gasTopic: process.env.REACT_APP_ROOM_4_GAS_TOPIC,
    ledCommandTopic: process.env.REACT_APP_ROOM_4_LED_COMMAND_TOPIC,
    ledStateTopic: process.env.REACT_APP_ROOM_4_LED_STATE_TOPIC
  }
];

const DEFAULT_ROOM = INITIAL_ROOMS[0];
const MIN_ROOM_COUNT = INITIAL_ROOMS.length;
const LIVE_SENSOR_ROOM_ID = 'room-1';

function getDoorImage(doorVariant: RoomDefinition['doorVariant']) {
  if (doorVariant === 'chimique') {
    return stockChimiqueDoor;
  }

  if (doorVariant === 'metal-apport') {
    return stockMetalApportDoor;
  }

  return roomDoor;
}

function getActiveDoorImage(room: RoomDefinition) {
  return room.customDoorImage ?? room.fixedDoorImageUrl ?? getDoorImage(room.doorVariant);
}

function openRoomImageDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(ROOM_IMAGE_DB_NAME, 1);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(ROOM_IMAGE_STORE_NAME)) {
        database.createObjectStore(ROOM_IMAGE_STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

function getStoredRoomImage(roomId: string): Promise<string | undefined> {
  return new Promise((resolve, reject) => {
    openRoomImageDatabase()
      .then((database) => {
        const transaction = database.transaction(ROOM_IMAGE_STORE_NAME, 'readonly');
        const store = transaction.objectStore(ROOM_IMAGE_STORE_NAME);
        const request = store.get(roomId);

        request.onsuccess = () => {
          resolve(typeof request.result === 'string' ? request.result : undefined);
          database.close();
        };

        request.onerror = () => {
          reject(request.error);
          database.close();
        };
      })
      .catch(reject);
  });
}

function setStoredRoomImage(roomId: string, imageData: string): Promise<void> {
  return new Promise((resolve, reject) => {
    openRoomImageDatabase()
      .then((database) => {
        const transaction = database.transaction(ROOM_IMAGE_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(ROOM_IMAGE_STORE_NAME);
        store.put(imageData, roomId);

        transaction.oncomplete = () => {
          resolve();
          database.close();
        };

        transaction.onerror = () => {
          reject(transaction.error);
          database.close();
        };
      })
      .catch(reject);
  });
}

function deleteStoredRoomImage(roomId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    openRoomImageDatabase()
      .then((database) => {
        const transaction = database.transaction(ROOM_IMAGE_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(ROOM_IMAGE_STORE_NAME);
        store.delete(roomId);

        transaction.oncomplete = () => {
          resolve();
          database.close();
        };

        transaction.onerror = () => {
          reject(transaction.error);
          database.close();
        };
      })
      .catch(reject);
  });
}

function loadRooms() {
  try {
    const storedRooms = window.localStorage.getItem(ROOM_STORAGE_KEY);
    if (!storedRooms) {
      return INITIAL_ROOMS;
    }

    const parsedRooms = JSON.parse(storedRooms) as RoomDefinition[];
    if (!Array.isArray(parsedRooms) || parsedRooms.length === 0) {
      return INITIAL_ROOMS;
    }

    const initialRoomById = new Map(INITIAL_ROOMS.map((room) => [room.id, room]));

    return parsedRooms.map((room) => {
      const initialRoom = initialRoomById.get(room.id);
      return initialRoom ? { ...room, ...initialRoom } : room;
    });
  } catch {
    return INITIAL_ROOMS;
  }
}

function serializeRoomsForStorage(rooms: RoomDefinition[]) {
  return rooms.map(({ customDoorImage: _customDoorImage, ...room }) => room);
}

function findRoomByPath(pathname: string, rooms: RoomDefinition[]) {
  return rooms.find((room) => room.pagePath === pathname) ?? rooms[0] ?? DEFAULT_ROOM;
}

function App() {
  const [rooms, setRooms] = useState<RoomDefinition[]>(() => loadRooms());
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
    window.localStorage.setItem(ROOM_STORAGE_KEY, JSON.stringify(serializeRoomsForStorage(rooms)));
  }, [rooms]);

  useEffect(() => {
    let isCancelled = false;

    Promise.all(
      rooms.map(async (room) => ({
        roomId: room.id,
        image: await getStoredRoomImage(room.id)
      }))
    )
      .then((storedImages) => {
        if (isCancelled) {
          return;
        }

        setRooms((currentRooms) =>
          currentRooms.map((room) => {
            const storedImage = storedImages.find((entry) => entry.roomId === room.id)?.image;
            return storedImage ? { ...room, customDoorImage: storedImage } : room;
          })
        );
      })
      .catch(() => {
        // Ignore image-cache failures and fall back to default room visuals.
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    const currentDefaultRoom = rooms[0] ?? DEFAULT_ROOM;

    if (pathname === currentDefaultRoom.pagePath) {
      return;
    }

    const matchingRoom = rooms.find((room) => room.pagePath === pathname);
    if (matchingRoom) {
      return;
    }

    window.history.replaceState({}, '', currentDefaultRoom.pagePath);
    setPathname(currentDefaultRoom.pagePath);
  }, [pathname, rooms]);

  const activeRoom = findRoomByPath(pathname, rooms);
  const hasLiveSensorTopics = activeRoom.id === LIVE_SENSOR_ROOM_ID;

  function navigateToRoom(nextRoom: RoomDefinition) {
    if (nextRoom.pagePath === pathname) {
      return;
    }

    window.history.pushState({}, '', nextRoom.pagePath);
    setPathname(nextRoom.pagePath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleAddRoom() {
    const nextIndex = rooms.length + 1;
    const nextRoom: RoomDefinition = {
      id: `room-${nextIndex}`,
      name: `Salle ${nextIndex}`,
      pagePath: `/rooms/room-${nextIndex}`,
      description:
        `Surveillez les six capteurs et commandes en direct de la Salle ${nextIndex} sur une page dédiée. Suivez la température, la lumière, l'humidité, le verrouillage de la porte, la fumée et le contrôle de porte pour cette salle.`,
      doorAlt: `Porte de la Salle ${nextIndex}`,
      doorCaption: `Vue de l'entrée de la Salle ${nextIndex} liée aux six flux en direct.`,
      doorVariant: 'generic',
      summaryNote: `Les six cartes de cette page affichent les données de la Salle ${nextIndex}.`
    };

    setRooms((currentRooms) => [...currentRooms, nextRoom]);
    window.history.pushState({}, '', nextRoom.pagePath);
    setPathname(nextRoom.pagePath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleRemoveRoom() {
    if (rooms.length <= MIN_ROOM_COUNT) {
      return;
    }

    const activeRoomIndex = rooms.findIndex((room) => room.id === activeRoom.id);
    if (activeRoomIndex < MIN_ROOM_COUNT) {
      return;
    }

    const nextRooms = rooms.filter((room) => room.id !== activeRoom.id);
    const fallbackRoom = nextRooms[Math.max(0, activeRoomIndex - 1)] ?? nextRooms[0] ?? DEFAULT_ROOM;

    deleteStoredRoomImage(activeRoom.id).catch(() => {
      // Ignore cleanup failures; the room entry has already been removed.
    });
    setRooms(nextRooms);
    window.history.pushState({}, '', fallbackRoom.pagePath);
    setPathname(fallbackRoom.pagePath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const canRemoveRoom = rooms.length > MIN_ROOM_COUNT && !INITIAL_ROOMS.some((room) => room.id === activeRoom.id);

  function handleDoorImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        return;
      }

      setStoredRoomImage(activeRoom.id, result).catch(() => {
        // Ignore persistence failures and still show the uploaded preview in memory.
      });
      setRooms((currentRooms) =>
        currentRooms.map((room) =>
          room.id === activeRoom.id
            ? {
                ...room,
                customDoorImage: result
              }
            : room
        )
      );
    };

    reader.readAsDataURL(file);
    event.target.value = '';
  }

  return (
    <main className="app-shell">
      <section className="monitor-layout" aria-label={`Moniteur des capteurs de ${activeRoom.name}`}>
        <div className="monitor-copy">
          <div className="brand-lockup">
            <div className="brand-logo-wrap">
              <img className="brand-logo" src={scaiLogo} alt="SCAI Systems logo" />
            </div>
            <div>
              <p className="eyebrow">SCAI Systems</p>
              <h1>Surveillance des zones 'Produits chimiques' et 'Métaux d'apport'</h1>
            </div>
          </div>

          <div className="room-selector" aria-label="Navigation des salles">
            {rooms.map((room) => {
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
            <button
              type="button"
              className={canRemoveRoom ? 'room-button room-button-remove' : 'room-button room-button-remove disabled'}
              onClick={handleRemoveRoom}
              aria-label="Supprimer la salle active"
              disabled={!canRemoveRoom}
            >
              -
            </button>
            <button
              type="button"
              className="room-button room-button-add"
              onClick={handleAddRoom}
              aria-label="Ajouter une salle"
            >
              +
            </button>
          </div>

          <p className="lede">{activeRoom.description}</p>

          <div className="monitor-highlights" aria-label={`Résumé de ${activeRoom.name}`}>
            <div className="highlight-chip">
              <span className="highlight-label">Salle</span>
              <strong>{activeRoom.name}</strong>
            </div>
            <div className="highlight-chip">
              <span className="highlight-label">Systèmes</span>
              <strong>{activeRoom.hasMaterialTesting ? '7 systèmes de salle' : '6 systèmes de salle'}</strong>
            </div>
            <div className="highlight-chip">
              <span className="highlight-label">Transport</span>
              <strong>MQTT + WebSocket</strong>
            </div>
          </div>

          <figure className="room-door-card">
            <img className="room-door-image" src={getActiveDoorImage(activeRoom)} alt={activeRoom.doorAlt} />
            <figcaption>{activeRoom.doorCaption}</figcaption>
            <div className="door-upload-actions">
              <label className="door-upload-button" htmlFor={`door-upload-${activeRoom.id}`}>
                Téléverser une image
              </label>
              <input
                id={`door-upload-${activeRoom.id}`}
                className="door-upload-input"
                type="file"
                accept="image/*"
                onChange={handleDoorImageUpload}
              />
            </div>
          </figure>

          <div className="monitor-note">
            <span className="note-pulse" aria-hidden="true" />
            {activeRoom.summaryNote}
          </div>
        </div>

        <div className="sensor-panel">
          <div className="sensor-panel-copy">
            <p className="sensor-panel-kicker">Flux en direct</p>
            <h2>Capteurs de {activeRoom.name}</h2>
            <p>
              {activeRoom.id === LIVE_SENSOR_ROOM_ID
                ? "Cette page dédiée regroupe les cartes température, capteur de lumière, capteur d’humidité, état du verrouillage de la porte, détecteur de fumée et contrôle de porte associées au stock de produits chimiques, ainsi que le module de test des matériaux."
                : activeRoom.id === 'room-2'
                  ? "Cette page dédiée est réservée aux cartes température, capteur de lumière, capteur d'humidité, état du verrouillage de la porte, détecteur de fumée et contrôle de porte attribuées au stock métal d'apport."
                  : `Cette page dédiée est réservée aux cartes Température, Capteur de lumière, Capteur d'humidité, État du verrouillage de la porte, Détecteur de fumée et Contrôle de porte attribuées à ${activeRoom.name}.`}
            </p>
          </div>

          <div className="sensor-grid">
            <TemperatureCard roomName={activeRoom.name} topic={hasLiveSensorTopics ? activeRoom.temperatureTopic : null} />
            <LightCard roomName={activeRoom.name} topic={hasLiveSensorTopics ? activeRoom.lightTopic : null} />
            <HumidityCard roomName={activeRoom.name} topic={hasLiveSensorTopics ? activeRoom.humidityTopic : null} />
            <RainCard roomName={activeRoom.name} topic={hasLiveSensorTopics ? activeRoom.rainTopic : null} />
            <GasCard roomName={activeRoom.name} topic={hasLiveSensorTopics ? activeRoom.gasTopic : null} />
            <LedControlCard
              roomName={activeRoom.name}
              commandTopic={hasLiveSensorTopics ? activeRoom.ledCommandTopic : null}
              stateTopic={hasLiveSensorTopics ? activeRoom.ledStateTopic : null}
            />
          </div>
          {activeRoom.hasMaterialTesting ? (
            <div className="material-testing-section">
              <MaterialTestingCard roomName={activeRoom.name} />
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

export default App;

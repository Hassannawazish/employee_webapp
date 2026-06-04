import { ChangeEvent, useEffect, useState } from 'react';
import './App.css';
import scaiLogo from './assets/scailogo.png';
import roomDoor from './assets/room-one-door.svg';
import stockChimiqueDoor from './assets/stock-chimique-door.svg';
import stockMetalApportDoor from './assets/stock-metal-apport-door.svg';
import GasCard from './components/GasCard/GasCard';
import LightCard from './components/LightCard/LightCard';
import LedControlCard from './components/LedControlCard/LedControlCard';
import RainCard from './components/RainCard/RainCard';
import TemperatureCard from './components/TemperatureCard/TemperatureCard';

type RoomDefinition = {
  customDoorImage?: string;
  description: string;
  doorAlt: string;
  doorCaption: string;
  doorVariant: 'generic' | 'chimique' | 'metal-apport';
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

const ROOM_STORAGE_KEY = 'scai-control-room-pages';
const ROOM_IMAGE_DB_NAME = 'scai-control-room-images';
const ROOM_IMAGE_STORE_NAME = 'roomImages';

const INITIAL_ROOMS: RoomDefinition[] = [
  {
    id: 'room-1',
    name: 'Stock chimique',
    pagePath: '/rooms/room-1',
    description:
      "Surveillez les cinq capteurs et commandes en direct du stock chimique sur une seule vue. Suivez la temperature, le niveau de lumiere, l'etat de verrouillage de la porte, l'activite du detecteur de fumee et le controle d'acces pour proteger les produits sensibles.",
    doorAlt: 'Porte du stock chimique',
    doorCaption: "Vue de la porte du stock chimique reliee aux cinq flux de securite en direct.",
    doorVariant: 'chimique',
    summaryNote: 'Les cinq cartes de cette page affichent les donnees du stock chimique.',
    temperatureTopic: process.env.REACT_APP_ROOM_1_TEMPERATURE_TOPIC,
    lightTopic: process.env.REACT_APP_ROOM_1_LIGHT_TOPIC,
    rainTopic: process.env.REACT_APP_ROOM_1_RAIN_TOPIC,
    gasTopic: process.env.REACT_APP_ROOM_1_GAS_TOPIC,
    ledCommandTopic: process.env.REACT_APP_ROOM_1_LED_COMMAND_TOPIC,
    ledStateTopic: process.env.REACT_APP_ROOM_1_LED_STATE_TOPIC
  },
  {
    id: 'room-2',
    name: "Stock metal d'apport",
    pagePath: '/rooms/room-2',
    description:
      "Gardez le stock metal d'apport sur sa propre page dediee afin que les cartes de temperature, lumiere, verrouillage, fumee et controle de porte restent concentrees sur cette zone de stockage technique.",
    doorAlt: "Porte du stock metal d'apport",
    doorCaption: "Vue de la porte du stock metal d'apport reliee aux cinq flux de surveillance en direct.",
    doorVariant: 'metal-apport',
    summaryNote: "Les cinq cartes de cette page affichent les donnees du stock metal d'apport.",
    temperatureTopic: process.env.REACT_APP_ROOM_2_TEMPERATURE_TOPIC,
    lightTopic: process.env.REACT_APP_ROOM_2_LIGHT_TOPIC,
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
      'Utilisez la page de la Salle 3 pour suivre la temperature, la lumiere, le verrouillage de porte, la fumee et le controle de porte sans les melanger avec les autres salles.',
    doorAlt: 'Porte de la Salle 3',
    doorCaption: "Vue de l'entree de la Salle 3 liee aux cinq flux en direct.",
    doorVariant: 'generic',
    summaryNote: 'Les cinq cartes de cette page affichent les donnees de la Salle 3.',
    temperatureTopic: process.env.REACT_APP_ROOM_3_TEMPERATURE_TOPIC,
    lightTopic: process.env.REACT_APP_ROOM_3_LIGHT_TOPIC,
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
      'Ouvrez la page de la Salle 4 pour consulter les cinq memes systemes de salle sur une page web dediee a cette salle.',
    doorAlt: 'Porte de la Salle 4',
    doorCaption: "Vue de l'entree de la Salle 4 liee aux cinq flux en direct.",
    doorVariant: 'generic',
    summaryNote: 'Les cinq cartes de cette page affichent les donnees de la Salle 4.',
    temperatureTopic: process.env.REACT_APP_ROOM_4_TEMPERATURE_TOPIC,
    lightTopic: process.env.REACT_APP_ROOM_4_LIGHT_TOPIC,
    rainTopic: process.env.REACT_APP_ROOM_4_RAIN_TOPIC,
    gasTopic: process.env.REACT_APP_ROOM_4_GAS_TOPIC,
    ledCommandTopic: process.env.REACT_APP_ROOM_4_LED_COMMAND_TOPIC,
    ledStateTopic: process.env.REACT_APP_ROOM_4_LED_STATE_TOPIC
  }
];

const DEFAULT_ROOM = INITIAL_ROOMS[0];
const MIN_ROOM_COUNT = INITIAL_ROOMS.length;

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
  return room.customDoorImage ?? getDoorImage(room.doorVariant);
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

    return parsedRooms;
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
        `Surveillez les cinq capteurs et commandes en direct de la Salle ${nextIndex} sur une page dediee. Suivez la temperature, la lumiere, le verrouillage de la porte, la fumee et le controle de porte pour cette salle.`,
      doorAlt: `Porte de la Salle ${nextIndex}`,
      doorCaption: `Vue de l'entree de la Salle ${nextIndex} liee aux cinq flux en direct.`,
      doorVariant: 'generic',
      summaryNote: `Les cinq cartes de cette page affichent les donnees de la Salle ${nextIndex}.`
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
              <h1>Centre de Commande des Capteurs de {activeRoom.name}</h1>
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

          <div className="monitor-highlights" aria-label={`Resume de ${activeRoom.name}`}>
            <div className="highlight-chip">
              <span className="highlight-label">Salle</span>
              <strong>{activeRoom.name}</strong>
            </div>
            <div className="highlight-chip">
              <span className="highlight-label">Systemes</span>
              <strong>5 systemes de salle</strong>
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
                Televerser une image
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
              Cette page dediee est reservee aux cartes Temperature, Capteur de
              lumiere, Etat du verrouillage de la porte, Detecteur de fumee et
              Controle de porte attribuees a {activeRoom.name}.
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

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

beforeAll(() => {
  Object.defineProperty(window, 'scrollTo', {
    value: jest.fn(),
    writable: true
  });
});

beforeEach(() => {
  window.localStorage.clear();
});

test('refreshes built-in room copy and image paths from current defaults', () => {
  window.history.pushState({}, '', '/');
  window.localStorage.setItem(
    'scai-control-room-pages',
    JSON.stringify([
      {
        id: 'room-1',
        name: 'Stock chimique',
        pagePath: '/rooms/room-1',
        description:
          'Surveillez les six capteurs, les commandes en direct et le controle de test des materiaux du stock chimique sur une seule vue.',
        doorAlt: 'Porte du stock chimique',
        doorCaption: 'Ancienne legende',
        fixedDoorImageUrl: '/stock-chimique-door.jpeg',
        doorVariant: 'chimique',
        summaryNote: 'Ancienne note'
      }
    ])
  );

  render(<App />);

  expect(screen.getByText(/Surveillez, dans une seule vue/i)).toBeInTheDocument();
  expect(screen.queryByText(/controle de test des materiaux/i)).not.toBeInTheDocument();
  expect(screen.getByAltText(/porte du stock chimique/i)).toHaveAttribute(
    'src',
    '/stock-chimique-room.jpg.jpeg'
  );
});

test('renders the default room dashboard', () => {
  window.history.pushState({}, '', '/');

  render(<App />);

  expect(window.location.pathname).toBe('/rooms/room-1');
  expect(screen.getByText(/surveillance des zones 'produits chimiques' et 'métaux d'apport'/i)).toBeInTheDocument();
  expect(screen.getByText(/capteurs de stock chimique/i)).toBeInTheDocument();
  expect(screen.getByAltText(/porte du stock chimique/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /^stock chimique$/i })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('heading', { name: /capteur de température/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /capteur de lumière/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /capteur d'humidité/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /état du verrouillage de la porte/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /détecteur de fumée/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /contrôle de porte/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /contrôle des étiquettes des produits chimiques/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /ouvrir la caméra/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /prendre une image/i })).toBeInTheDocument();
  expect(screen.getByText(/téléverser une image/i)).toBeInTheDocument();
  expect(screen.getAllByText(/connexion à mqtt/i)).toHaveLength(6);
});

test('switches to a dedicated page for another room', async () => {
  window.history.pushState({}, '', '/');

  render(<App />);

  await userEvent.click(screen.getByRole('button', { name: /^salle 4$/i }));

  expect(window.location.pathname).toBe('/rooms/room-4');
  expect(screen.getByText(/surveillance des zones 'produits chimiques' et 'métaux d'apport'/i)).toBeInTheDocument();
  expect(screen.getByText(/capteurs de salle 4/i)).toBeInTheDocument();
  expect(screen.getByAltText(/porte de la salle 4/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /^salle 4$/i })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByText(/téléverser une image/i)).toBeInTheDocument();
  expect(screen.queryByText(/contrôle des étiquettes des produits chimiques/i)).not.toBeInTheDocument();
  expect(screen.getAllByText(/^salle 4$/i)).toHaveLength(8);
});

test('adds a new room page with the same sensor layout', async () => {
  window.history.pushState({}, '', '/');

  render(<App />);

  await userEvent.click(screen.getByRole('button', { name: /ajouter une salle/i }));

  expect(window.location.pathname).toBe('/rooms/room-5');
  expect(screen.getByText(/surveillance des zones 'produits chimiques' et 'métaux d'apport'/i)).toBeInTheDocument();
  expect(screen.getByText(/capteurs de salle 5/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /^salle 5$/i })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('heading', { name: /capteur de température/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /capteur de lumière/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /capteur d'humidité/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /état du verrouillage de la porte/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /détecteur de fumée/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /contrôle de porte/i })).toBeInTheDocument();
});

test('removes the active extra room page', async () => {
  window.history.pushState({}, '', '/');

  render(<App />);

  await userEvent.click(screen.getByRole('button', { name: /ajouter une salle/i }));
  expect(window.location.pathname).toBe('/rooms/room-5');

  await userEvent.click(screen.getByRole('button', { name: /supprimer la salle active/i }));

  expect(window.location.pathname).toBe('/rooms/room-4');
  expect(screen.getByText(/surveillance des zones 'produits chimiques' et 'métaux d'apport'/i)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /^salle 5$/i })).not.toBeInTheDocument();
});

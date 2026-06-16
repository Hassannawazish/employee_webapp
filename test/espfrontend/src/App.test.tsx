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

test('renders the default room dashboard', () => {
  window.history.pushState({}, '', '/');

  render(<App />);

  expect(window.location.pathname).toBe('/rooms/room-1');
  expect(screen.getByText(/surveillance de la protection des travailleurs/i)).toBeInTheDocument();
  expect(screen.getByText(/capteurs de stock chimique/i)).toBeInTheDocument();
  expect(screen.getByAltText(/porte du stock chimique/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /^stock chimique$/i })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('heading', { name: /capteur de temperature/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /capteur de lumiere/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /capteur d'humidite/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /etat du verrouillage de la porte/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /detecteur de fumee/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /controle de porte/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /test des materiaux/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /ouvrir la camera/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /prendre une image/i })).toBeInTheDocument();
  expect(screen.getByText(/televerser une image/i)).toBeInTheDocument();
  expect(screen.getAllByText(/connexion a mqtt/i)).toHaveLength(6);
});

test('switches to a dedicated page for another room', async () => {
  window.history.pushState({}, '', '/');

  render(<App />);

  await userEvent.click(screen.getByRole('button', { name: /^salle 4$/i }));

  expect(window.location.pathname).toBe('/rooms/room-4');
  expect(screen.getByText(/surveillance de la protection des travailleurs/i)).toBeInTheDocument();
  expect(screen.getByText(/capteurs de salle 4/i)).toBeInTheDocument();
  expect(screen.getByAltText(/porte de la salle 4/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /^salle 4$/i })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByText(/televerser une image/i)).toBeInTheDocument();
  expect(screen.queryByText(/test des materiaux/i)).not.toBeInTheDocument();
  expect(screen.getAllByText(/^salle 4$/i)).toHaveLength(8);
});

test('adds a new room page with the same sensor layout', async () => {
  window.history.pushState({}, '', '/');

  render(<App />);

  await userEvent.click(screen.getByRole('button', { name: /ajouter une salle/i }));

  expect(window.location.pathname).toBe('/rooms/room-5');
  expect(screen.getByText(/surveillance de la protection des travailleurs/i)).toBeInTheDocument();
  expect(screen.getByText(/capteurs de salle 5/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /^salle 5$/i })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('heading', { name: /capteur de temperature/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /capteur de lumiere/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /capteur d'humidite/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /etat du verrouillage de la porte/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /detecteur de fumee/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /controle de porte/i })).toBeInTheDocument();
});

test('removes the active extra room page', async () => {
  window.history.pushState({}, '', '/');

  render(<App />);

  await userEvent.click(screen.getByRole('button', { name: /ajouter une salle/i }));
  expect(window.location.pathname).toBe('/rooms/room-5');

  await userEvent.click(screen.getByRole('button', { name: /supprimer la salle active/i }));

  expect(window.location.pathname).toBe('/rooms/room-4');
  expect(screen.getByText(/surveillance de la protection des travailleurs/i)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /^salle 5$/i })).not.toBeInTheDocument();
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('affiche le moniteur des capteurs ESP32', () => {
  render(<App />);
  expect(screen.getByText(/centre de commande des capteurs scai/i)).toBeInTheDocument();
  expect(screen.getByAltText(/logo scai systems/i)).toBeInTheDocument();
  expect(screen.getAllByText(/connexion a mqtt/i)).toHaveLength(4);
  expect(screen.getByRole('button', { name: /^Active$/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /^Desactive$/i })).toBeInTheDocument();
});

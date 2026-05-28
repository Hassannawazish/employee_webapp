import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders ESP32 sensor monitor', () => {
  render(<App />);
  expect(screen.getByText(/scai sensor command center/i)).toBeInTheDocument();
  expect(screen.getByAltText(/scai systems logo/i)).toBeInTheDocument();
  expect(screen.getAllByText(/connecting to mqtt/i)).toHaveLength(4);
  expect(screen.getByRole('button', { name: /true/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /false/i })).toBeInTheDocument();
});

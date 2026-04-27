import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders ESP32 sensor monitor', () => {
  render(<App />);
  expect(screen.getByText(/esp32 sensor monitor/i)).toBeInTheDocument();
  expect(screen.getAllByText(/connecting to mqtt/i)).toHaveLength(3);
  expect(screen.getByRole('button', { name: /true/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /false/i })).toBeInTheDocument();
});

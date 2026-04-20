import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders ESP32 temperature monitor', () => {
  render(<App />);
  expect(screen.getByText(/internal temperature monitor/i)).toBeInTheDocument();
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
});

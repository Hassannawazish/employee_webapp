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

test('renders the default room dashboard', () => {
  window.history.pushState({}, '', '/');

  render(<App />);

  expect(window.location.pathname).toBe('/rooms/room-1');
  expect(screen.getByText(/room 1 sensor command center/i)).toBeInTheDocument();
  expect(screen.getByText(/room 1 sensors/i)).toBeInTheDocument();
  expect(screen.getByAltText(/room 1 door/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /^room 1$/i })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByText(/dedicated page: \/rooms\/room-1/i)).toBeInTheDocument();
  expect(screen.getByText(/temperature sensor/i)).toBeInTheDocument();
  expect(screen.getByText(/light sensor/i)).toBeInTheDocument();
  expect(screen.getByText(/door lock status/i)).toBeInTheDocument();
  expect(screen.getByText(/smoke sensor/i)).toBeInTheDocument();
  expect(screen.getByText(/door control/i)).toBeInTheDocument();
  expect(screen.getAllByText(/connecting to mqtt/i)).toHaveLength(5);
});

test('switches to a dedicated page for another room', async () => {
  window.history.pushState({}, '', '/');

  render(<App />);

  await userEvent.click(screen.getByRole('button', { name: /^room 4$/i }));

  expect(window.location.pathname).toBe('/rooms/room-4');
  expect(screen.getByText(/room 4 sensor command center/i)).toBeInTheDocument();
  expect(screen.getByText(/room 4 sensors/i)).toBeInTheDocument();
  expect(screen.getByAltText(/room 4 door/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /^room 4$/i })).toHaveAttribute('aria-current', 'page');
  expect(screen.getAllByText(/^room 4$/i)).toHaveLength(7);
});

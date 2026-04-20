export type TemperatureReading = {
  temperatureC: number;
  deviceId: string;
  recordedAtUtc: string;
};

const apiBaseUrl = process.env.REACT_APP_ESP_API_URL ?? 'http://localhost:5094';

export async function getLatestTemperature(): Promise<TemperatureReading> {
  const response = await fetch(`${apiBaseUrl}/api/temperature/latest`);

  if (!response.ok) {
    throw new Error('Temperature value is not available yet.');
  }

  return response.json();
}

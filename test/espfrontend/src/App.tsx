import './App.css';
import LedControlCard from './components/LedControlCard/LedControlCard';
import RainCard from './components/RainCard/RainCard';
import TemperatureCard from './components/TemperatureCard/TemperatureCard';

function App() {
  return (
    <main className="app-shell">
      <section className="monitor-layout" aria-label="ESP32 sensor monitor">
        <div className="monitor-copy">
          <p className="eyebrow">ESP32 live sensor</p>
          <h1>ESP32 Sensor Monitor</h1>
          <p className="lede">
            The cards subscribe to MQTT topics and display the latest internal
            temperature and rain sensor readings published by the ESP32 while
            letting you send `true` and `false` LED commands back to the
            board.
          </p>
        </div>

        <div className="sensor-grid">
          <TemperatureCard />
          <RainCard />
          <LedControlCard />
        </div>
      </section>
    </main>
  );
}

export default App;

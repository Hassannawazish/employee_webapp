import './App.css';
import scaiLogo from './assets/scailogo.png';
import GasCard from './components/GasCard/GasCard';
import LedControlCard from './components/LedControlCard/LedControlCard';
import RainCard from './components/RainCard/RainCard';
import TemperatureCard from './components/TemperatureCard/TemperatureCard';

function App() {
  return (
    <main className="app-shell">
      <section className="monitor-layout" aria-label="ESP32 sensor monitor">
        <div className="monitor-copy">
          <div className="brand-lockup">
            <div className="brand-logo-wrap">
              <img className="brand-logo" src={scaiLogo} alt="SCAI Systems logo" />
            </div>
            <div>
              <p className="eyebrow">SCAI Systems</p>
              <h1>SCAI Sensor Command Center</h1>
            </div>
          </div>
          <p className="lede">
            A cleaner live operations view for your company environment. Track
            temperature, rain, gas, and LED activity in one place with
            real-time MQTT updates from your field hardware.
          </p>
          <div className="monitor-highlights" aria-label="Dashboard summary">
            <div className="highlight-chip">
              <span className="highlight-label">Brand</span>
              <strong>SCAI Systems</strong>
            </div>
            <div className="highlight-chip">
              <span className="highlight-label">Feeds</span>
              <strong>4 Live Cards</strong>
            </div>
            <div className="highlight-chip">
              <span className="highlight-label">Transport</span>
              <strong>MQTT + WebSocket</strong>
            </div>
          </div>
          <div className="monitor-note">
            <span className="note-pulse" aria-hidden="true" />
            Built for branded monitoring instead of a generic ESP32 demo page.
          </div>
        </div>

        <div className="sensor-grid">
          <TemperatureCard />
          <RainCard />
          <GasCard />
          <LedControlCard />
        </div>
      </section>
    </main>
  );
}

export default App;

import './App.css';
import TemperatureCard from './components/TemperatureCard/TemperatureCard';

function App() {
  return (
    <main className="app-shell">
      <section className="monitor-layout" aria-label="ESP32 temperature monitor">
        <div className="monitor-copy">
          <p className="eyebrow">ESP32 live sensor</p>
          <h1>Internal Temperature Monitor</h1>
          <p className="lede">
            The card refreshes automatically from your ASP.NET Core API and displays
            the latest chip temperature sent by the ESP32.
          </p>
        </div>

        <TemperatureCard />
      </section>
    </main>
  );
}

export default App;

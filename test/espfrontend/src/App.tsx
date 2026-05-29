import './App.css';
import scaiLogo from './assets/scailogo.png';
import GasCard from './components/GasCard/GasCard';
import LedControlCard from './components/LedControlCard/LedControlCard';
import RainCard from './components/RainCard/RainCard';
import TemperatureCard from './components/TemperatureCard/TemperatureCard';

function App() {
  return (
    <main className="app-shell">
      <section className="monitor-layout" aria-label="Moniteur de capteurs ESP32">
        <div className="monitor-copy">
          <div className="brand-lockup">
            <div className="brand-logo-wrap">
              <img className="brand-logo" src={scaiLogo} alt="Logo SCAI Systems" />
            </div>
            <div>
              <p className="eyebrow">SCAI Systems</p>
              <h1>Centre de Commande des Capteurs SCAI</h1>
            </div>
          </div>
          <p className="lede">
            Une vue en direct plus claire pour l'environnement de votre
            entreprise. Suivez la temperature, la pluie, le gaz et l'activite
            LED au meme endroit grace aux mises a jour MQTT en temps reel de
            votre materiel sur le terrain.
          </p>
          <div className="monitor-highlights" aria-label="Resume du tableau de bord">
            <div className="highlight-chip">
              <span className="highlight-label">Marque</span>
              <strong>SCAI Systems</strong>
            </div>
            <div className="highlight-chip">
              <span className="highlight-label">Flux</span>
              <strong>4 cartes en direct</strong>
            </div>
            <div className="highlight-chip">
              <span className="highlight-label">Transport</span>
              <strong>MQTT + WebSocket</strong>
            </div>
          </div>
          <div className="monitor-note">
            <span className="note-pulse" aria-hidden="true" />
            Concu pour une supervision de marque plutot qu'une page de demo ESP32 generique.
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

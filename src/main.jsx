import React from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

function App() {
  return (
    <main className="app">
      <header>
        <div className="logo">P<span>▶</span></div>
        <div>
          <h1>PORAN LIVE</h1>
          <p>YOUR SCREEN. YOUR LIVE. YOUR WORLD.</p>
        </div>
      </header>

      <section className="hero">
        <div className="reactor">P<span>▶</span></div>
        <h2>Broadcast Your World</h2>
        <p>Share your screen and gallery videos with the world.</p>
        <div className="status">● SYSTEM READY</div>
      </section>

      <section className="modes">
        <button>▣ Gallery Live</button>
        <button>▦ Full Screen Live</button>
      </section>

      <section className="facebook">
        <h3>Facebook Connection</h3>
        <p>Connect your Facebook account to prepare your live broadcast.</p>
        <button className="connect">Connect Facebook</button>
      </section>

      <footer>PORAN LIVE • VERSION 1.0</footer>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);

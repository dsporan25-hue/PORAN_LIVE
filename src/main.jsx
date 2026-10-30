import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

function App() {
  const picker = useRef(null);
  const [video, setVideo] = useState('');
  const [message, setMessage] = useState('SYSTEM READY');

  const chooseVideo = () => {
    picker.current?.click();
  };

  const handleVideo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setMessage('PLEASE SELECT A VIDEO FILE');
      return;
    }

    if (video) URL.revokeObjectURL(video);
    setVideo(URL.createObjectURL(file));
    setMessage('VIDEO SELECTED — READY');
  };

  const startScreenLive = () => {
    setMessage('SCREEN LIVE FEATURE IS UNDER DEVELOPMENT');
  };

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
        <div className="status">● {message}</div>
      </section>

      <section className="modes">
        <button onClick={chooseVideo}>▣ Gallery Live</button>
        <button onClick={startScreenLive}>▦ Full Screen Live</button>
        <input
          ref={picker}
          type="file"
          accept="video/*"
          hidden
          onChange={handleVideo}
        />
      </section>

      {video && (
        <section className="facebook">
          <h3>Selected Video</h3>
          <video
            src={video}
            controls
            playsInline
            style={{ width: '100%', borderRadius: '12px' }}
          />
          <p>Your video is ready for preview.</p>
        </section>
      )}

      <section className="facebook">
        <h3>Facebook Connection</h3>
        <p>Facebook Live connection is not configured yet.</p>
        <button
          className="connect"
          onClick={() => setMessage('FACEBOOK STREAMING SETUP REQUIRED')}
        >
          Connect Facebook
        </button>
      </section>

      <footer>PORAN LIVE • VERSION 1.0</footer>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);

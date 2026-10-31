import React, { useRef, useState } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { createRoot } from 'react-dom/client';
import { Share } from '@capacitor/share';
import './style.css';

const PoranStreaming = registerPlugin("PoranStreaming");

function App() {
  const picker = useRef(null);
  const [video, setVideo] = useState('');
  const [message, setMessage] = useState('SYSTEM READY');

  const [liked, setLiked] = useState(
    () => localStorage.getItem('poran_liked') === 'true'
  );

  const [likeCount, setLikeCount] = useState(
    () => Number(localStorage.getItem('poran_like_count') || 0)
  );

  const chooseVideo = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const result = await PoranStreaming.pickVideo();
        if (result.cancelled || !result.videoUri) return;
        setVideo(Capacitor.convertFileSrc(result.videoUri));
        setMessage("VIDEO SELECTED — READY");
      } catch (error) {
        setMessage("VIDEO PICKER FAILED");
      }
    } else {
      picker.current?.click();
    }
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

  const toggleLike = () => {
    const nextLiked = !liked;
    const nextCount = Math.max(0, likeCount + (nextLiked ? 1 : -1));

    setLiked(nextLiked);
    setLikeCount(nextCount);

    localStorage.setItem('poran_liked', String(nextLiked));
    localStorage.setItem('poran_like_count', String(nextCount));

    setMessage(nextLiked ? 'YOU LIKED PORAN LIVE' : 'LIKE REMOVED');
  };

  const shareFacebook = async () => {
    try {
      await Share.share({
        title: 'PORAN LIVE',
        text: 'Check out PORAN LIVE — Your Screen. Your Live. Your World!',
        dialogTitle: 'Share PORAN LIVE'
      });
      setMessage('SHARE MENU OPENED');
    } catch (error) {
      setMessage('SHARING CANCELLED OR UNAVAILABLE');
    }
  };

  const startScreenLive = () => {
    setMessage('SCREEN BROADCAST SETUP IS NEXT');
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
        <h3>Like PORAN LIVE</h3>
        <p>Support the app with a Like.</p>
        <button className="connect" onClick={toggleLike}>
          {liked ? '♥ Liked' : '♡ Like'} · {likeCount}
        </button>
        <p style={{ fontSize: '11px' }}>
          This Like count is saved on this device.
        </p>
      </section>

      <section className="facebook">
        <h3>Share PORAN LIVE</h3>
        <p>Open Android's share menu to share the app with others.</p>
        <button className="connect" onClick={shareFacebook}>
          Share with Facebook
        </button>
        <p style={{ fontSize: '11px' }}>
          This shares app information, not the selected video file.
        </p>
      </section>

      <footer>PORAN LIVE • VERSION 1.0</footer>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);

import React, { useEffect, useState } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { createRoot } from 'react-dom/client';
import './style.css';

const PoranStreaming = registerPlugin('PoranStreaming');
const SecureStore = registerPlugin('PoranSecureStore');

function App() {
  const [serverUrl, setServerUrl] = useState('');
  const [streamKey, setStreamKey] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [message, setMessage] = useState('SYSTEM READY');
  const [busy, setBusy] = useState(false);
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let listenerHandle;
    PoranStreaming.addListener('streamStatus', event => {
      const status = event.status;
      if (status === "SERVICE_STARTED") {
        setMessage("SCREEN SERVICE STARTED...");
      } else if (status === "VIDEO_PREPARED") {
        setMessage("SCREEN VIDEO READY...");
      } else if (status === "STREAM_START_REQUESTED") {
        setMessage("CONNECTING TO FACEBOOK RTMP...");
      } else
      if (status === 'CONNECTING') {
        setIsLive(false);
        setMessage('CONNECTING TO FACEBOOK...');
      } else if (status === 'CONNECTED') {
        setIsLive(true);
        setMessage('FACEBOOK RTMP CONNECTED');
      } else if (status === 'FAILED' || status === 'AUTH_FAILED') {
        setIsLive(false);
        setMessage((status === 'AUTH_FAILED' ? 'FACEBOOK AUTH FAILED: ' : 'STREAM FAILED: ') + (event.reason || 'CONNECTION ERROR'));
      } else if (status === 'DISCONNECTED') {
        setIsLive(false);
        setMessage('STREAM DISCONNECTED');
      }
    }).then(handle => {
      listenerHandle = handle;
    }).catch(() => setMessage('STATUS LISTENER FAILED'));

    return () => {
      if (listenerHandle) listenerHandle.remove();
    };
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    SecureStore.getConfig()
      .then(result => {
        if (result.configured) {
          setServerUrl(result.serverUrl);
          setStreamKey(result.streamKey);
          setConfigured(true);
        }
      })
      .catch(() => setMessage('SECURE SETTINGS NOT AVAILABLE'));
  }, []);

  const saveSettings = async () => {
    if (!serverUrl.trim().match(/^rtmps?:\/\//) || !streamKey.trim()) {
      setMessage('ENTER VALID SERVER URL AND STREAM KEY');
      return;
    }
    if (!Capacitor.isNativePlatform()) {
      setMessage('SAVE SETTINGS IN ANDROID APP');
      return;
    }
    try {
      const result = await SecureStore.saveConfig({
        serverUrl: serverUrl.trim().replace(/\/+$/, ''),
        streamKey: streamKey.trim()
      });
      if (result.saved) {
        setConfigured(true);
        setMessage('FACEBOOK SETTINGS SAVED SECURELY');
        setShowSettings(false);
      }
    } catch (error) {
      setMessage('SECURE SAVE FAILED: ' + (error.message || 'UNKNOWN ERROR'));
    }
  };

  const toggleLive = async () => {
    if (busy) return;

    if (isLive) {
      setBusy(true);
      try {
        await PoranStreaming.stopScreenLive();
        setIsLive(false);
        setMessage('SCREEN BROADCAST STOP REQUESTED');
      } catch (error) {
        setMessage('LIVE STOP FAILED');
      } finally {
        setBusy(false);
      }
      return;
    }

    if (!configured || !serverUrl || !streamKey) {
      setShowSettings(true);
      setMessage('ADD FACEBOOK STREAMING DETAILS');
      return;
    }

    if (!Capacitor.isNativePlatform()) {
      setMessage('SCREEN LIVE REQUIRES ANDROID APP');
      return;
    }

    setBusy(true);
    try {
      setMessage('REQUESTING SCREEN CAPTURE PERMISSION');
      const result = await PoranStreaming.startScreenLive({
        streamUrl: serverUrl.trim().replace(/\/+$/, '') + '/' + streamKey.trim()
      });
      if (result.cancelled) {
        setMessage('SCREEN CAPTURE CANCELLED');
        return;
      }
      setMessage('WAITING FOR FACEBOOK CONNECTION...');
    } catch (error) {
      setMessage('LIVE START FAILED: ' + (error.message || 'UNKNOWN ERROR'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="app">
      <header>
        <div
          className="logo"
          onClick={() => setShowSettings(value => !value)}
          title="Open streaming settings"
        >
          P<span>▶</span>
        </div>
        <div>
          <h1>PORAN LIVE</h1>
          <p>YOUR SCREEN. YOUR LIVE. YOUR WORLD.</p>
        </div>
      </header>

      <section className="hero">
        <div className={`reactor ${isLive ? 'reactor-live' : ''}`}>
          P<span>▶</span>
        </div>
        <h2>Broadcast Your World</h2>
        <p>Share your phone screen with the world.</p>
        <div className="status">● {message}</div>
      </section>

      <section className="main-control">
        <button
          className={isLive ? 'main-live-button stop-mode' : 'main-live-button'}
          onClick={toggleLive}
          disabled={busy}
        >
          {busy ? 'PLEASE WAIT...' : isLive ? 'STOP LIVE' : 'START SCREEN LIVE'}
        </button>
        <p>One button. Your screen. Your live.</p>
      </section>

      {showSettings && (
        <section className="facebook">
          <h3>Facebook Streaming Settings</h3>
          <p>One Facebook account for now. Your Stream Key is encrypted on this device.</p>

          <label>Facebook Server URL</label>
          <input
            className="live-input"
            type="url"
            placeholder="rtmps://..."
            value={serverUrl}
            onChange={event => setServerUrl(event.target.value)}
          />

          <label>Facebook Stream Key</label>
          <input
            className="live-input"
            type="password"
            placeholder="Enter your private Stream Key"
            value={streamKey}
            onChange={event => setStreamKey(event.target.value)}
            autoComplete="off"
          />

          <button className="connect" onClick={saveSettings}>
            SAVE FACEBOOK SETTINGS
          </button>
          <p>{configured ? 'Saved configuration can be updated here.' : 'No Facebook account saved yet.'}</p>
          <p>Tap the PORAN LIVE logo to hide these settings.</p>
        </section>
      )}

      <footer>PORAN LIVE • VERSION 1.0</footer>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);

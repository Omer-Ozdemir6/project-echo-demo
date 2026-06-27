// MusicController.jsx
// src/components/MusicController.jsx
//
// Bu component'i GameEngine veya App'in içine bir kez koy.
// Props olarak currentEpisodeId ve currentNodeId geçir.
//
// Kullanım örneği (GameEngine.jsx içinde):
//
//   import MusicController from './MusicController';
//
//   <MusicController
//     episodeId={currentEpisodeId}
//     nodeId={currentNodeId}
//     enabled={musicEnabled}
//   />

import { useEffect, useRef, useState } from 'react';
import { useMusicManager } from '../hooks/useMusicManager';
import { MUSIC_LAYERS } from '../config/musicConfig';

export default function MusicController({
  episodeId,  // örn. 'episode_07'
  nodeId,     // örn. 'ep07_n05_karar'
  enabled = true,
}) {
  const music    = useMusicManager();
  const prevEp   = useRef(null);
  const prevNode = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(1.0);

  // ─── Episode değişince müzik geçişi ──────────────────────────────────────
  useEffect(() => {
    if (!enabled) { music.stop(); return; }
    if (!episodeId || episodeId === prevEp.current) return;
    prevEp.current = episodeId;
    music.playForEpisode(episodeId);
  }, [episodeId, enabled]);

  // ─── Node değişince override kontrolü ────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;
    if (!nodeId || nodeId === prevNode.current) return;
    prevNode.current = nodeId;
    music.playForNode(nodeId);
  }, [nodeId, enabled]);

  // ─── Enabled değişince ───────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) music.stop();
    else if (episodeId) music.playForEpisode(episodeId);
  }, [enabled]);

  // ─── Volume ──────────────────────────────────────────────────────────────
  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolumeState(val);
    music.setVolume(val);
  };

  const handleMute = () => {
    const muted = music.toggleMute();
    setIsMuted(muted);
  };

  // ─── UI — köşede küçük müzik kontrolü ────────────────────────────────────
  return (
    <div
      style={{
        position:   'fixed',
        bottom:     '16px',
        right:      '16px',
        zIndex:     1000,
        display:    'flex',
        alignItems: 'center',
        gap:        '8px',
        background: 'rgba(0,0,0,0.7)',
        border:     '1px solid rgba(255,255,255,0.1)',
        borderRadius:'8px',
        padding:    '8px 12px',
        backdropFilter:'blur(4px)',
      }}
    >
      {/* Mute butonu */}
      <button
        onClick={handleMute}
        style={{
          background: 'none',
          border:     'none',
          color:      isMuted ? '#666' : '#aaa',
          cursor:     'pointer',
          fontSize:   '16px',
          padding:    0,
          lineHeight: 1,
        }}
        title={isMuted ? 'Sesi aç' : 'Sesi kapat'}
      >
        {isMuted ? '🔇' : '🔊'}
      </button>

      {/* Volume slider */}
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={isMuted ? 0 : volume}
        onChange={handleVolumeChange}
        style={{
          width:      '70px',
          accentColor:'#4a9eff',
          cursor:     'pointer',
        }}
        title="Ses seviyesi"
      />

      {/* Şu an çalan track etiketi */}
      <span
        style={{
          fontSize:  '10px',
          color:     '#555',
          minWidth:  '80px',
          textAlign: 'right',
          fontFamily:'monospace',
        }}
      >
        {music.isPlaying()
          ? MUSIC_LAYERS[music.getCurrentTrack()]?.label || '...'
          : '—'}
      </span>
    </div>
  );
}


// ─── Sadece hook kullanmak istersen (UI olmadan) ──────────────────────────────
//
// GameEngine.jsx içinde:
//
//   import { useMusicManager } from '../hooks/useMusicManager';
//
//   const music = useMusicManager();
//
//   // Episode geçişlerinde:
//   useEffect(() => {
//     music.playForEpisode(currentEpisodeId);
//   }, [currentEpisodeId]);
//
//   // Node geçişlerinde:
//   useEffect(() => {
//     music.playForNode(currentNodeId);
//   }, [currentNodeId]);
//
//   // Ölüm anında:
//   music.playForNode('ep04_death_node');
//
//   // Checkpoint'te:
//   music.playForNode('ep04_cp01');

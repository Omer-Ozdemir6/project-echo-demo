import { useEffect, useState } from 'react';
import { useMusicManager } from '../hooks/useMusicManager';
import { MUSIC_LAYERS } from '../config/musicConfig';

export default function MusicController({
  episodeId,  // örn. 'episode_07'
  nodeId,     // örn. 'ep07_n05_karar'
  enabled = true,
}) {
  const music = useMusicManager();
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(1.0);

  // ─── Tek Bir Efekt ile Tüm Ses Durumunu Yönetme ───────────────────────────
  useEffect(() => {
    // 1. Eğer müzik kapatıldıysa sistemi durdur
    if (!enabled) {
      music.stop();
      return;
    }

    // 2. Eğer hem node hem episode varsa, öncelik spesifik node müziğindedir (Örn: Tehdit anı)
    if (nodeId) {
      music.playForNode(nodeId);
    } 
    // 3. Eğer node spesifik bir şey istemiyorsa genel episode müziğini çal
    else if (episodeId) {
      music.playForEpisode(episodeId);
    }

  }, [episodeId, nodeId, enabled]); // Sadece bu girdiler değiştiğinde tetiklenir

  // ─── Volume & Mute İşlemleri ─────────────────────────────────────────────
  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolumeState(val);
    music.setVolume(val);
  };

  const handleMute = () => {
    const muted = music.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div
      style={{
        position:    'fixed',
        bottom:      '16px',
        right:       '16px',
        zIndex:      1000,
        display:     'flex',
        alignItems:  'center',
        gap:         '8px',
        background:  'rgba(0,0,0,0.8)',
        border:      '1px solid rgba(255,255,255,0.1)',
        borderRadius:'4px',
        padding:     '8px 12px',
        backdropFilter:'blur(4px)',
      }}
    >
      <button
        onClick={handleMute}
        style={{
          background: 'none',
          border:     'none',
          color:      isMuted ? '#666' : '#aaa',
          cursor:     'pointer',
          fontSize:   '14px',
          padding:    0,
        }}
        title={isMuted ? 'Sesi aç' : 'Sesi kapat'}
      >
        {isMuted ? '🔇' : '🔊'}
      </button>

      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={isMuted ? 0 : volume}
        onChange={handleVolumeChange}
        style={{
          width:      '60px',
          accentColor:'#f59e0b',
          cursor:     'pointer',
        }}
      />

      <span
        style={{
          fontSize:  '9px',
          color:     '#78716c',
          minWidth:  '70px',
          textAlign: 'right',
          fontFamily:'monospace',
          letterSpacing: '1px'
        }}
      >
        {music.isPlaying()
          ? MUSIC_LAYERS[music.getCurrentTrack()]?.label || 'TRACK_ACTIVE'
          : 'SESSIZ'}
      </span>
    </div>
  );
}
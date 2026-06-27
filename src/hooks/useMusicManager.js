// useMusicManager.js
// src/hooks/useMusicManager.js
//
// Kullanım:
//   const music = useMusicManager();
//   music.playForEpisode('episode_07');
//   music.playForNode('ep08_n10_mekanizma');
//   music.playTrack('death');
//   music.setVolume(0.5);
//   music.stop();

import { useRef, useCallback, useEffect } from 'react';
import {
  MUSIC_LAYERS,
  EPISODE_MUSIC_MAP,
  NODE_MUSIC_OVERRIDES,
} from '../config/musicConfig';

const FADE_DURATION_MS  = 1500;  // geçiş süresi (ms)
const CHECKPOINT_RETURN = 2000;  // checkpoint sonrası episode müziğine dönüş (ms)

export function useMusicManager() {
  const audioRef       = useRef(null);   // aktif Audio nesnesi
  const fadeTimerRef   = useRef(null);   // fade interval
  const returnTimerRef = useRef(null);   // checkpoint sonrası dönüş
  const currentTrackRef= useRef(null);   // şu an çalan track key
  const currentEpRef   = useRef(null);   // şu anki episode
  const masterVolRef   = useRef(1.0);    // master volume (0-1)
  const mutedRef       = useRef(false);  // mute durumu

  // ─── Fade yardımcısı ──────────────────────────────────────────────────────
  const clearFade = () => {
    if (fadeTimerRef.current) {
      clearInterval(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  };

  const fadeOut = (audioEl, durationMs, onComplete) => {
    if (!audioEl) { onComplete?.(); return; }
    clearFade();
    const startVol = audioEl.volume;
    const steps    = 20;
    const interval = durationMs / steps;
    const decrement= startVol / steps;
    let   step     = 0;

    fadeTimerRef.current = setInterval(() => {
      step++;
      audioEl.volume = Math.max(0, startVol - decrement * step);
      if (step >= steps) {
        clearFade();
        audioEl.pause();
        audioEl.volume = startVol;
        onComplete?.();
      }
    }, interval);
  };

  const fadeIn = (audioEl, targetVol, durationMs) => {
    if (!audioEl) return;
    clearFade();
    audioEl.volume = 0;
    const steps    = 20;
    const interval = durationMs / steps;
    const increment= targetVol / steps;
    let   step     = 0;

    fadeTimerRef.current = setInterval(() => {
      step++;
      audioEl.volume = Math.min(targetVol, increment * step);
      if (step >= steps) {
        clearFade();
        audioEl.volume = targetVol;
      }
    }, interval);
  };

  // ─── Temel çalma fonksiyonu ───────────────────────────────────────────────
  const playTrack = useCallback((trackKey, options = {}) => {
    const {
      fade      = true,
      onEnd     = null,
      forceRestart = false,
    } = options;

    const layer = MUSIC_LAYERS[trackKey];
    if (!layer || !layer.src) {
      // Sessizlik
      if (audioRef.current) {
        fadeOut(audioRef.current, FADE_DURATION_MS, () => {
          audioRef.current = null;
          currentTrackRef.current = null;
        });
      }
      return;
    }

    // Aynı track çalıyorsa restart istenmedikçe devam et
    if (
      currentTrackRef.current === trackKey &&
      audioRef.current &&
      !audioRef.current.paused &&
      !forceRestart
    ) return;

    const targetVol = (mutedRef.current ? 0 : layer.volume) * masterVolRef.current;

    const startNew = () => {
      // Eski audio'yu temizle
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }

      const audio       = new Audio(layer.src);
      audio.loop        = layer.loop;
      audio.volume      = fade ? 0 : targetVol;
      audioRef.current  = audio;
      currentTrackRef.current = trackKey;

      audio.addEventListener('ended', () => {
        if (!layer.loop) {
          currentTrackRef.current = null;
          onEnd?.();
        }
      });

      audio.addEventListener('error', (e) => {
        console.warn(`[MusicManager] Dosya yüklenemedi: ${layer.src}`, e);
      });

      audio.play().catch(err => {
        // Autoplay policy — kullanıcı etkileşimi bekleniyor
        console.warn('[MusicManager] Autoplay engellendi:', err.message);
      });

      if (fade) fadeIn(audio, targetVol, FADE_DURATION_MS);
    };

    // Varsa eski track'i fade out yap, sonra yeni başlat
    if (audioRef.current && !audioRef.current.paused && fade) {
      fadeOut(audioRef.current, FADE_DURATION_MS / 2, startNew);
    } else {
      startNew();
    }
  }, []);

  // ─── Episode'a göre müzik ─────────────────────────────────────────────────
  const playForEpisode = useCallback((episodeId) => {
    currentEpRef.current = episodeId;
    const trackKey = EPISODE_MUSIC_MAP[episodeId];
    if (!trackKey) return;
    playTrack(trackKey);
  }, [playTrack]);

  // ─── Node'a göre müzik (override varsa) ──────────────────────────────────
  const playForNode = useCallback((nodeId) => {
    if (returnTimerRef.current) {
      clearTimeout(returnTimerRef.current);
      returnTimerRef.current = null;
    }

    const override = NODE_MUSIC_OVERRIDES[nodeId];
    if (!override) return; // Override yoksa mevcut müzik devam eder

    const layer = MUSIC_LAYERS[override];

    // Checkpoint sesi → episode müziğine kısa sürede geri dön
    if (override === 'checkpoint') {
      playTrack('checkpoint', {
        fade: true,
        onEnd: () => {
          if (currentEpRef.current) {
            const epTrack = EPISODE_MUSIC_MAP[currentEpRef.current];
            if (epTrack) playTrack(epTrack);
          }
        },
      });
      return;
    }

    // Ölüm → ölüm sting çal, sonra episode müziğine dön
    if (override === 'death') {
      playTrack('death', {
        fade: false,
        onEnd: () => {
          returnTimerRef.current = setTimeout(() => {
            if (currentEpRef.current) {
              const epTrack = EPISODE_MUSIC_MAP[currentEpRef.current];
              if (epTrack) playTrack(epTrack);
            }
          }, 1000);
        },
      });
      return;
    }

    // Entity veya özel override
    if (!layer.loop) {
      playTrack(override, {
        onEnd: () => {
          if (currentEpRef.current) {
            const epTrack = EPISODE_MUSIC_MAP[currentEpRef.current];
            if (epTrack) playTrack(epTrack);
          }
        },
      });
    } else {
      playTrack(override);
    }
  }, [playTrack]);

  // ─── Durdur ───────────────────────────────────────────────────────────────
  const stop = useCallback((fade = true) => {
    if (!audioRef.current) return;
    if (fade) {
      fadeOut(audioRef.current, FADE_DURATION_MS, () => {
        audioRef.current = null;
        currentTrackRef.current = null;
      });
    } else {
      audioRef.current.pause();
      audioRef.current = null;
      currentTrackRef.current = null;
    }
  }, []);

  // ─── Master Volume ─────────────────────────────────────────────────────────
  const setVolume = useCallback((vol) => {
    masterVolRef.current = Math.max(0, Math.min(1, vol));
    if (audioRef.current && currentTrackRef.current) {
      const layer = MUSIC_LAYERS[currentTrackRef.current];
      if (layer) {
        audioRef.current.volume = layer.volume * masterVolRef.current;
      }
    }
  }, []);

  // ─── Mute ─────────────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    mutedRef.current = !mutedRef.current;
    if (audioRef.current) {
      if (mutedRef.current) {
        audioRef.current.volume = 0;
      } else if (currentTrackRef.current) {
        const layer = MUSIC_LAYERS[currentTrackRef.current];
        if (layer) audioRef.current.volume = layer.volume * masterVolRef.current;
      }
    }
    return mutedRef.current;
  }, []);

  // ─── Temizlik ─────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearFade();
      if (returnTimerRef.current) clearTimeout(returnTimerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return {
    playTrack,
    playForEpisode,
    playForNode,
    stop,
    setVolume,
    toggleMute,
    getCurrentTrack: () => currentTrackRef.current,
    isPlaying: () => audioRef.current && !audioRef.current.paused,
  };
}
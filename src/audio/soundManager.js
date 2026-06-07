const SOUND_PATHS = {
  uiClick: "/audio/ui-click.mp3",
  messageIn: "/audio/message-in.mp3",
  choiceSelect: "/audio/choice-select.mp3",
  puzzleSubmit: "/audio/puzzle-submit.mp3",
  accessGranted: "/audio/access-granted.mp3",
  accessDenied: "/audio/access-denied.mp3",
  signalLost: "/audio/signal-lost.mp3",
  signalRestored: "/audio/signal-restored.mp3",
  fileArchived: "/audio/file-archived.mp3",
  bootError: "/audio/boot-error.mp3",
  bootSuccess: "/audio/boot-success.mp3",
  glitch: "/audio/glitch.mp3"
};

const audioCache = new Map();

function getVolume(settings = {}, type = "sound") {
  if (type === "ambient") {
    return settings.ambientVolume ?? 0.35;
  }

  return settings.soundVolume ?? 0.7;
}

function canPlaySound(settings = {}) {
  return settings.soundEnabled !== false;
}

function getAudio(name) {
  const src = SOUND_PATHS[name];

  if (!src) return null;

  if (!audioCache.has(name)) {
    const audio = new Audio(src);
    audio.preload = "auto";
    audioCache.set(name, audio);
  }

  return audioCache.get(name);
}

export function playSound(name, settings = {}, options = {}) {
  if (!canPlaySound(settings)) return;

  const audio = getAudio(name);

  if (!audio) return;

  const volume = options.volume ?? getVolume(settings, options.type);

  try {
    audio.pause();
    audio.currentTime = 0;
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.play().catch(() => {});
  } catch {
    // Browser autoplay/security restrictions can block audio.
  }
}

export function preloadSounds() {
  Object.keys(SOUND_PATHS).forEach((name) => {
    getAudio(name);
  });
}

export function stopSound(name) {
  const audio = audioCache.get(name);

  if (!audio) return;

  try {
    audio.pause();
    audio.currentTime = 0;
  } catch {
    // Ignore audio stop failures.
  }
}

export function stopAllSounds() {
  audioCache.forEach((audio) => {
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch {
      // Ignore audio stop failures.
    }
  });
}
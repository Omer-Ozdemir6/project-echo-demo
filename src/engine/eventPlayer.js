function createFilePayload(event, fallbackType = "file") {
  const fileType = event.fileType || event.type || fallbackType;

  return {
    id:
      event.fileId ||
      event.id ||
      `${fileType}_${event.title || event.src || Date.now()}`,
    type: fileType,
    title: event.title || "[INCOMING FILE]",
    caption: event.caption || event.description || "",
    src: event.src || "",
    content: event.content || "",
    source: event.source || "",
    tags: Array.isArray(event.tags) ? event.tags : [],
    isNew: event.isNew ?? true
  };
}

function playSingleEvent({
  event,
  delay = 0,
  timers,
  onTypingStart,
  onTypingStop,
  onMessage,
  onGlitchStart,
  onGlitchStop,
  onSignalLost,
  onSignalRestored,
  onStatChange,
  onCollectFile,
  onPuzzleStart
}) {
  if (event.type === "pause") {
    return event.duration || 1000;
  }

  if (event.type === "typing") {
    const startTimer = setTimeout(() => {
      onTypingStart?.();
    }, delay);

    const stopTimer = setTimeout(() => {
      onTypingStop?.();
    }, delay + event.duration);

    timers.push(startTimer, stopTimer);

    return event.duration + (event.pauseAfterMs ?? 300);
  }

  if (event.type === "message") {
    const messageTimer = setTimeout(() => {
      onTypingStop?.();
      onMessage?.({
        type: "message",
        speaker: event.speaker,
        sender: event.sender,
        text: event.text,
        tone: event.tone || event.mood || "calm"
      });
    }, delay);

    timers.push(messageTimer);

    return event.pauseAfterMs ?? 700;
  }

  if (event.type === "corruptMessage") {
    const corruptTimer = setTimeout(() => {
      onTypingStop?.();
      onMessage?.({
        type: "corruptMessage",
        speaker: event.speaker,
        sender: event.sender,
        text: event.text,
        tone: "corrupt"
      });
    }, delay);

    timers.push(corruptTimer);

    return event.pauseAfterMs ?? 1200;
  }

  if (event.type === "systemAlert") {
    const alertTimer = setTimeout(() => {
      onTypingStop?.();
      onMessage?.({
        type: "systemAlert",
        speaker: event.speaker || "SYSTEM",
        sender: "system",
        text: event.text,
        tone: "system"
      });
    }, delay);

    timers.push(alertTimer);

    return event.pauseAfterMs ?? 1200;
  }

  if (event.type === "image") {
    const imageTimer = setTimeout(() => {
      const file = createFilePayload(event, "image");

      onTypingStop?.();

      onMessage?.({
        type: "image",
        speaker: event.speaker,
        sender: event.sender || "system",
        tone: "system",
        id: file.id,
        fileId: file.id,
        title: file.title || "[INCOMING IMAGE]",
        caption: file.caption,
        src: file.src,
        source: file.source,
        tags: file.tags
      });

      onCollectFile?.({
        ...file,
        type: "image"
      });
    }, delay);

    timers.push(imageTimer);

    return event.pauseAfterMs ?? 1200;
  }

  if (
    event.type === "file" ||
    event.type === "log" ||
    event.type === "map" ||
    event.type === "crew"
  ) {
    const fileTimer = setTimeout(() => {
      const file = createFilePayload(event, event.type);

      onTypingStop?.();

      onMessage?.({
        type: "systemAlert",
        speaker: event.speaker || "SYSTEM",
        sender: "system",
        text: event.message || `[${file.title} ARCHIVED TO DATA BANK]`,
        tone: "system"
      });

      onCollectFile?.(file);
    }, delay);

    timers.push(fileTimer);

    return event.pauseAfterMs ?? 1000;
  }

  if (event.type === "puzzle") {
    const puzzleTimer = setTimeout(() => {
      onTypingStop?.();
      onPuzzleStart?.(event.puzzleId);
    }, delay);

    timers.push(puzzleTimer);

    return event.pauseAfterMs ?? 500;
  }

  if (event.type === "glitch") {
    const startTimer = setTimeout(() => {
      onTypingStop?.();
      onGlitchStart?.();
    }, delay);

    const stopTimer = setTimeout(() => {
      onGlitchStop?.();
    }, delay + (event.duration || 900));

    timers.push(startTimer, stopTimer);

    return (event.duration || 900) + (event.pauseAfterMs ?? 400);
  }

  if (event.type === "signalLost") {
    const lostTimer = setTimeout(() => {
      onTypingStop?.();
      onGlitchStop?.();
      onSignalLost?.(event.message || "[SIGNAL LOST]");
    }, delay);

    const restoredTimer = setTimeout(() => {
      onSignalRestored?.(event.restoreMessage || "[SIGNAL RESTORED]");
    }, delay + (event.duration || 3000));

    timers.push(lostTimer, restoredTimer);

    return (event.duration || 3000) + (event.pauseAfterMs ?? 800);
  }

  if (event.type === "statChange") {
    const statTimer = setTimeout(() => {
      onStatChange?.(event.changes || {});
    }, delay);

    timers.push(statTimer);

    return event.pauseAfterMs ?? 200;
  }

  return 0;
}

export function playNodeEvents({
  events = [],
  onTypingStart,
  onTypingStop,
  onMessage,
  onGlitchStart,
  onGlitchStop,
  onSignalLost,
  onSignalRestored,
  onStatChange,
  onCollectFile,
  onPuzzleStart
}) {
  const timers = [];
  let accumulatedDelay = 0;

  const handlers = {
    timers,
    onTypingStart,
    onTypingStop,
    onMessage,
    onGlitchStart,
    onGlitchStop,
    onSignalLost,
    onSignalRestored,
    onStatChange,
    onCollectFile,
    onPuzzleStart
  };

  events.forEach((event) => {
    if (event.type === "backgroundEvent") {
      const backgroundDelay = event.delay || event.delayMs || 0;
      const nestedEvent = event.event;

      if (!nestedEvent || typeof nestedEvent !== "object") {
        return;
      }

      playSingleEvent({
        ...handlers,
        event: nestedEvent,
        delay: backgroundDelay
      });

      return;
    }

    const consumedDelay = playSingleEvent({
      ...handlers,
      event,
      delay: accumulatedDelay
    });

    accumulatedDelay += consumedDelay;
  });

  return () => {
    timers.forEach(clearTimeout);
  };
}
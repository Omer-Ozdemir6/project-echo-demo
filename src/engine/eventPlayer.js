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
  onCollectFile
}) {
  const timers = [];
  let accumulatedDelay = 0;

  events.forEach((event) => {
    if (event.type === "pause") {
      accumulatedDelay += event.duration || 1000;
      return;
    }

    if (event.type === "typing") {
      const startTimer = setTimeout(() => {
        onTypingStart?.();
      }, accumulatedDelay);

      const stopTimer = setTimeout(() => {
        onTypingStop?.();
      }, accumulatedDelay + event.duration);

      accumulatedDelay += event.duration + (event.pauseAfterMs ?? 300);

      timers.push(startTimer, stopTimer);
      return;
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
      }, accumulatedDelay);

      accumulatedDelay += event.pauseAfterMs ?? 700;

      timers.push(messageTimer);
      return;
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
      }, accumulatedDelay);

      accumulatedDelay += event.pauseAfterMs ?? 1200;

      timers.push(corruptTimer);
      return;
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
      }, accumulatedDelay);

      accumulatedDelay += event.pauseAfterMs ?? 1200;

      timers.push(alertTimer);
      return;
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
      }, accumulatedDelay);

      accumulatedDelay += event.pauseAfterMs ?? 1200;

      timers.push(imageTimer);
      return;
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
      }, accumulatedDelay);

      accumulatedDelay += event.pauseAfterMs ?? 1000;

      timers.push(fileTimer);
      return;
    }

    if (event.type === "glitch") {
      const startTimer = setTimeout(() => {
        onTypingStop?.();
        onGlitchStart?.();
      }, accumulatedDelay);

      const stopTimer = setTimeout(() => {
        onGlitchStop?.();
      }, accumulatedDelay + (event.duration || 900));

      accumulatedDelay += (event.duration || 900) + (event.pauseAfterMs ?? 400);

      timers.push(startTimer, stopTimer);
      return;
    }

    if (event.type === "signalLost") {
      const lostTimer = setTimeout(() => {
        onTypingStop?.();
        onGlitchStop?.();
        onSignalLost?.(event.message || "[SIGNAL LOST]");
      }, accumulatedDelay);

      accumulatedDelay += event.duration || 3000;

      const restoredTimer = setTimeout(() => {
        onSignalRestored?.(event.restoreMessage || "[SIGNAL RESTORED]");
      }, accumulatedDelay);

      accumulatedDelay += event.pauseAfterMs ?? 800;

      timers.push(lostTimer, restoredTimer);
      return;
    }

    if (event.type === "statChange") {
      const statTimer = setTimeout(() => {
        onStatChange?.(event.changes || {});
      }, accumulatedDelay);

      accumulatedDelay += event.pauseAfterMs ?? 200;

      timers.push(statTimer);
    }
  });

  return () => {
    timers.forEach(clearTimeout);
  };
}
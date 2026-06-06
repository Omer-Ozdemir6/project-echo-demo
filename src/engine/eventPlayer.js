function resolveText(source, keyName, fallbackName, translate) {
  const key = source?.[keyName];
  const fallback = source?.[fallbackName] || "";

  if (key && typeof translate === "function") {
    return translate(key, fallback);
  }

  return fallback;
}

function createFilePayload(event, fallbackType = "file", translate) {
  const fileType = event.fileType || event.type || fallbackType;

  return {
    id:
      event.fileId ||
      event.id ||
      `${fileType}_${event.title || event.src || Date.now()}`,
    type: fileType,
    title:
      resolveText(event, "titleKey", "title", translate) || "[INCOMING FILE]",
    caption:
      resolveText(event, "captionKey", "caption", translate) ||
      resolveText(event, "descriptionKey", "description", translate),
    src: event.src || "",
    content: resolveText(event, "contentKey", "content", translate),
    source: event.source || "",
    tags: Array.isArray(event.tags) ? event.tags : [],
    correlationTags: Array.isArray(event.correlationTags)
      ? event.correlationTags
      : [],
    isNew: event.isNew ?? true
  };
}

function playSingleEvent({
  event,
  delay = 0,
  timers,
  translate,
  onTypingStart,
  onTypingStop,
  onMessage,
  onGlitchStart,
  onGlitchStop,
  onSignalLost,
  onSignalRestored,
  onStatChange,
  onCollectFile,
  onPuzzleStart,
  onProgressTaskStart,
  onProgressTaskEnd
}) {
  if (!event || typeof event !== "object") return 0;

  if (event.type === "pause") {
    return event.duration || 1000;
  }

  if (event.type === "typing") {
    const duration = event.duration || 1000;

    const startTimer = setTimeout(() => {
      onTypingStart?.();
    }, delay);

    const stopTimer = setTimeout(() => {
      onTypingStop?.();
    }, delay + duration);

    timers.push(startTimer, stopTimer);
    return duration + (event.pauseAfterMs ?? 300);
  }

  if (event.type === "message") {
    const messageTimer = setTimeout(() => {
      onTypingStop?.();

      onMessage?.({
        type: "message",
        speaker: event.speaker,
        sender: event.sender,
        text: resolveText(event, "textKey", "text", translate),
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
        text: resolveText(event, "textKey", "text", translate),
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
        text: resolveText(event, "textKey", "text", translate),
        tone: "system"
      });
    }, delay);

    timers.push(alertTimer);
    return event.pauseAfterMs ?? 1200;
  }

  if (event.type === "image") {
    const imageTimer = setTimeout(() => {
      const file = createFilePayload(event, "image", translate);

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
      const file = createFilePayload(event, event.type, translate);

      onTypingStop?.();

      onMessage?.({
        type: "systemAlert",
        speaker: event.speaker || "SYSTEM",
        sender: "system",
        text:
          resolveText(event, "messageKey", "message", translate) ||
          `[${file.title} ARCHIVED TO DATA BANK]`,
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
    const duration = event.duration || 900;

    const startTimer = setTimeout(() => {
      onTypingStop?.();
      onGlitchStart?.();
    }, delay);

    const stopTimer = setTimeout(() => {
      onGlitchStop?.();
    }, delay + duration);

    timers.push(startTimer, stopTimer);
    return duration + (event.pauseAfterMs ?? 400);
  }

  if (event.type === "signalLost") {
    const duration = event.duration || 3000;

    const lostTimer = setTimeout(() => {
      onTypingStop?.();
      onGlitchStop?.();
      onSignalLost?.(
        resolveText(event, "messageKey", "message", translate) ||
          "[SIGNAL LOST]"
      );
    }, delay);

    const restoredTimer = setTimeout(() => {
      onSignalRestored?.(
        resolveText(event, "restoreMessageKey", "restoreMessage", translate) ||
          "[SIGNAL RESTORED]"
      );
    }, delay + duration);

    timers.push(lostTimer, restoredTimer);
    return duration + (event.pauseAfterMs ?? 800);
  }

  if (event.type === "progressTask") {
    const duration = event.duration || 6000;

    const startTimer = setTimeout(() => {
      onTypingStop?.();
      onGlitchStop?.();

      onProgressTaskStart?.({
        id: event.id || `progress_${Date.now()}`,
        title:
          resolveText(event, "titleKey", "title", translate) ||
          "SYSTEM PROCESS",
        subtitle: resolveText(event, "subtitleKey", "subtitle", translate),
        duration,
        completeText: resolveText(
          event,
          "completeTextKey",
          "completeText",
          translate
        ),
        tone: event.tone || "system"
      });
    }, delay);

    const endTimer = setTimeout(() => {
      onProgressTaskEnd?.();

      const completeText = resolveText(
        event,
        "completeTextKey",
        "completeText",
        translate
      );

      if (completeText) {
        onMessage?.({
          type: "systemAlert",
          speaker: event.speaker || "SYSTEM",
          sender: "system",
          text: completeText,
          tone: "system"
        });
      }
    }, delay + duration);

    timers.push(startTimer, endTimer);
    return duration + (event.pauseAfterMs ?? 900);
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
  translate,
  onTypingStart,
  onTypingStop,
  onMessage,
  onGlitchStart,
  onGlitchStop,
  onSignalLost,
  onSignalRestored,
  onStatChange,
  onCollectFile,
  onPuzzleStart,
  onProgressTaskStart,
  onProgressTaskEnd,
  onComplete
}) {
  const timers = [];
  let accumulatedDelay = 0;
  let maxBackgroundDelay = 0;

  const handlers = {
    timers,
    translate,
    onTypingStart,
    onTypingStop,
    onMessage,
    onGlitchStart,
    onGlitchStop,
    onSignalLost,
    onSignalRestored,
    onStatChange,
    onCollectFile,
    onPuzzleStart,
    onProgressTaskStart,
    onProgressTaskEnd
  };

  events.forEach((event) => {
    if (event.type === "backgroundEvent") {
      const backgroundDelay = event.delay || event.delayMs || 0;
      const nestedEvent = event.event;

      if (!nestedEvent || typeof nestedEvent !== "object") return;

      const consumedDelay = playSingleEvent({
        ...handlers,
        event: nestedEvent,
        delay: backgroundDelay
      });

      maxBackgroundDelay = Math.max(
        maxBackgroundDelay,
        backgroundDelay + consumedDelay
      );

      return;
    }

    const consumedDelay = playSingleEvent({
      ...handlers,
      event,
      delay: accumulatedDelay
    });

    accumulatedDelay += consumedDelay;
  });

  const finalDelay = Math.max(accumulatedDelay, maxBackgroundDelay);

  const completeTimer = setTimeout(() => {
    onTypingStop?.();
    onGlitchStop?.();
    onComplete?.();
  }, finalDelay);

  timers.push(completeTimer);

  return () => {
    timers.forEach(clearTimeout);
  };
}
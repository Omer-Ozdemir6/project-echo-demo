import { resolveDialogue } from "./dialogueEngine";

function resolveText(source, keyName, fallbackName, translate) {
  const key = source?.[keyName];
  const fallback = source?.[fallbackName] || "";

  if (key && typeof translate === "function") {
    return translate(key, fallback);
  }

  return fallback;
}

function clampSignal(value) {
  const number = Number(value);

  if (Number.isNaN(number)) return 96;

  return Math.max(5, Math.min(100, number));
}

function corruptTextBySignal(text = "", signalStrength = 100) {
  const signal = clampSignal(signalStrength);

  if (!text || signal >= 80) return text;

  let corruptionRate = 0;

  if (signal >= 50) {
    corruptionRate = 0.08;
  } else if (signal >= 20) {
    corruptionRate = 0.18;
  } else {
    corruptionRate = 0.32;
  }

  return text
    .split("")
    .map((char) => {
      if (char === " " || char === "\n") return char;
      if (Math.random() > corruptionRate) return char;

      return Math.random() > 0.5 ? "-" : "█";
    })
    .join("");
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
    save,
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
  onProgressTaskEnd,
  onCharacterBusyStart,
  signalStrength = 100
}) {
  if (!event || typeof event !== "object") return 0;

  if (event.type === "pause") {
    return event.duration || 1000;
  }

  if (event.type === "realTimeWait") {
  const seconds = event.seconds || 10;
  const ms = seconds * 1000;

  const waitTimer = setTimeout(() => {
    onTypingStop?.();
  }, delay + ms);

  timers.push(waitTimer);
  return ms + (event.pauseAfterMs ?? 500);
}

  if (event.type === "typing") {
    const duration = event.duration || 1000;

    const startTimer = setTimeout(() => {
      onTypingStart?.({
  speaker: event.speaker,
  duration
});
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
      textKey: event.textKey,
      fallbackText: event.text,
      text: corruptTextBySignal(
  resolveText(event, "textKey", "text", translate),
  signalStrength
),
      tone: event.tone || event.mood || "calm"
    });
  }, delay);

  timers.push(messageTimer);
  const text =
  resolveText(
    event,
    "textKey",
    "text",
    translate
  ) || "";

const readingTime =
  Math.max(
    1200,
    text.length * 45
  );

return (
  event.pauseAfterMs ??
  readingTime
);
}

if (event.type === "relationshipDialogue") {

  const relationshipTimer =
    setTimeout(() => {

      onTypingStop?.();

      const text =
        resolveDialogue(
          save,
          event.variants
        );

      onMessage?.({
        type: "message",
        speaker: event.speaker,
        sender: event.sender,
        text,
        tone:
          event.tone ||
          event.mood ||
          "calm"
      });

    }, delay);

  timers.push(
    relationshipTimer
  );

const text =
  resolveDialogue(
    save,
    event.variants
  ) || "";

const readingTime =
  Math.max(
    1200,
    text.length * 45
  );

return (
  event.pauseAfterMs ??
  readingTime
);
}

if (event.type === "corruptMessage") {
  const corruptTimer = setTimeout(() => {
    onTypingStop?.();

    onMessage?.({
      type: "corruptMessage",
      speaker: event.speaker,
      sender: event.sender,
      textKey: event.textKey,
      fallbackText: event.text,
      text: resolveText(event, "textKey", "text", translate),
      tone: "corrupt"
    });
  }, delay);

  timers.push(corruptTimer);
  const text =
  resolveText(
    event,
    "textKey",
    "text",
    translate
  ) || "";

const readingTime =
  Math.max(
    1500,
    text.length * 50
  );

return (
  event.pauseAfterMs ??
  readingTime
);
}

if (event.type === "systemAlert") {
  const alertTimer = setTimeout(() => {
    onTypingStop?.();

    onMessage?.({
      type: "systemAlert",
      speaker: event.speaker || "SYSTEM",
      sender: "system",
      textKey: event.textKey,
      fallbackText: event.text,
      text: resolveText(event, "textKey", "text", translate),
      tone: "system"
    });
  }, delay);

  timers.push(alertTimer);
  const text =
  resolveText(
    event,
    "textKey",
    "text",
    translate
  ) || "";

const readingTime =
  Math.max(
    1500,
    text.length * 50
  );

return (
  event.pauseAfterMs ??
  readingTime
);
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
    const text =
  resolveText(
    event,
    "textKey",
    "text",
    translate
  ) || "";

const readingTime =
  Math.max(
    1500,
    text.length * 50
  );

return (
  event.pauseAfterMs ??
  readingTime
);
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

  if (event.type === "characterBusy") {

  const busyTimer = setTimeout(() => {
    onTypingStop?.();
    onGlitchStop?.();

    onMessage?.({
      type: "systemAlert",
      speaker: "SYSTEM",
      sender: "system",
      text:
        event.message ||
        `[${event.character || "CHARACTER"} ${event.status || "UNAVAILABLE"}]`,
      tone: event.tone || "danger"
    });

    onCharacterBusyStart?.({
      id: event.id || `busy_${Date.now()}`,
      character: event.character || "UNKNOWN",
      status: event.status || "UNAVAILABLE",
      durationMs: event.durationMs || 60000,
      returnNodeId: event.returnNodeId,
      returnEpisodeId: event.returnEpisodeId || null,
      notificationTitle:
        event.notificationTitle ||
        "Incoming Transmission",
      notificationBody:
        event.notificationBody ||
        `${event.character || "Someone"} has returned.`
    });
  }, delay);

  timers.push(busyTimer);

  return event.pauseAfterMs ?? 500;
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
  onCharacterBusyStart,
  onComplete,
  save,
  signalStrength
}) {
  const timers = [];
  let accumulatedDelay = 0;
  let maxBackgroundDelay = 0;

  const hasCharacterBusy =
  events.some(
    event => event.type === "characterBusy"
  );

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
  onCharacterBusyStart,
  onStatChange,
  onCollectFile,
  onPuzzleStart,
  onProgressTaskStart,
  onProgressTaskEnd,
  save,
  signalStrength
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

if (!hasCharacterBusy) {

  const completeTimer =
    setTimeout(() => {

      onTypingStop?.();
      onGlitchStop?.();
      onComplete?.();

    }, finalDelay + 1200);

  timers.push(completeTimer);

}

  return () => {
    timers.forEach(clearTimeout);
  };
}
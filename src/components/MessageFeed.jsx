import { useEffect, useRef } from "react";
import { getGameText } from "../i18n/gameText";
import { playSound } from "../audio/soundManager";
import CorruptMessageBubble from "./CorruptMessageBubble";

function resolveText(key, fallback = "", language = "en") {
  return getGameText(key, fallback, language);
}

export default function MessageFeed({
  speaker,
  messages = [],
  isTyping,
  onOpenFile,
  language = "en",
  hasBottomPanel = false,
  settings
}) {
  const feedScrollRef = useRef(null);
  const previousMessageCountRef = useRef(messages.length);

  useEffect(() => {
    if (feedScrollRef.current) {
      feedScrollRef.current.scrollTo({
        top: feedScrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages.length, isTyping, hasBottomPanel]);

  useEffect(() => {
    if (messages.length > previousMessageCountRef.current) {
      const lastMessage = messages[messages.length - 1];

      if (lastMessage?.sender === "system" || lastMessage?.type === "systemAlert") {
        playSound("fileArchived", settings);
      } else {
        playSound("messageIn", settings);
      }
    }

    previousMessageCountRef.current = messages.length;
  }, [messages, settings]);

  function getSpeakerLabel(message) {
    if (message.sender === "player") {
      return resolveText("speaker.you", "OPERATÖR", language);
    }

    if (message.sender === "system") {
      return resolveText("speaker.system", "SİSTEM", language);
    }

    return message.speaker || speaker;
  }

  function getSpeakerColor(speakerName, isPlayer = false, isSystemAlert = false) {
    if (isPlayer) {
      return "text-amber-500 font-bold"; // Operatörün rezonans rengi
    }

    if (isSystemAlert || speakerName === "SİSTEM") {
      return "text-rose-600 font-bold";
    }

    switch ((speakerName || "").toUpperCase()) {
      case "JONES":
      case "JONES AYDIN":
        return "text-stone-200 font-bold"; // Ana kaşif rengi

      case "EMRE":
      case "EMRE KOÇ":
        return "text-stone-400 font-bold";

      case "SELİN":
      case "DR. SELİN":
        return "text-amber-600/80";

      case "THE ECHO":
      case "KARALTI":
        return "text-rose-600 animate-pulse font-black"; // Doğrudan tehdit

      default:
        return "text-stone-300";
    }
  }

  function getMessageText(message) {
    return getGameText(
      message.textKey,
      message.fallbackText || message.text || "",
      language
    );
  }

  function getMessageTitle(message) {
    return resolveText(
      message.titleKey,
      message.title ||
        resolveText("messageFeed.incomingFile", "[GELEN BULGU / DOSYA]", language),
      language
    );
  }

  function getMessageCaption(message) {
    return resolveText(message.captionKey, message.caption || "", language);
  }

  function isFileMessage(message) {
    return (
      message.type === "image" ||
      message.type === "file" ||
      message.type === "log" ||
      message.type === "map" ||
      Boolean(message.fileId)
    );
  }

  return (
    <div
      ref={feedScrollRef}
      className={[
        "terminal-scrollbar flex h-full min-h-0 flex-col gap-5 overflow-y-auto overscroll-contain touch-pan-y border border-stone-900 bg-black/40 p-3 sm:p-4",
        hasBottomPanel ? "pb-28 sm:pb-32" : ""
      ].join(" ")}
    >
      {messages.map((message, index) => {
        const messageSpeaker = getSpeakerLabel(message);
        const isPlayer = message.sender === "player";
        const isSystemAlert = message.type === "systemAlert";
        const isCorrupt = message.type === "corruptMessage";
        const messageText = getMessageText(message);
        const messageTitle = getMessageTitle(message);
        const messageCaption = getMessageCaption(message);

        if (isFileMessage(message)) {
          return (
            <div
              key={`${message.fileId || message.id || messageTitle}-${index}`}
              className="max-w-[92%] animate-[messageIn_0.35s_ease-out_both] sm:max-w-[78%]"
            >
              <span className={["mb-2 block text-[10px] tracking-widest uppercase", getSpeakerColor(messageSpeaker, isPlayer, isSystemAlert)].join(" ")}>
                {messageSpeaker}
              </span>

              <div className="border border-stone-900 bg-neutral-950/90 p-3 rounded-xs shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                <div className="mb-3 flex justify-between gap-3 border-b border-stone-900 pb-2 text-[10px] tracking-widest text-stone-500 font-bold uppercase">
                  <span className="truncate">{messageTitle}</span>
                  <span className="shrink-0 text-amber-600">
                    {resolveText(
                      "messageFeed.fileReceived",
                      "AKTAYLA ALINDI",
                      language
                    )}
                  </span>
                </div>

                {message.type === "image" && message.src && (
                  <div className="overflow-hidden border border-stone-900 bg-black p-1 rounded-xs">
                    <img
                      src={message.src}
                      alt={messageCaption || messageTitle}
                      className="block max-h-64 w-full object-cover contrast-115 saturate-50 brightness-75"
                      draggable={false}
                    />
                  </div>
                )}

                {messageCaption && (
                  <p className="mt-3 text-[11px] leading-relaxed tracking-wide text-stone-400 font-mono">
                    {messageCaption}
                  </p>
                )}

                <button
                  type="button"
                  className="mt-3 w-full border border-stone-800 bg-stone-900/30 px-3 py-2 text-[10px] tracking-widest text-stone-300 font-bold transition hover:bg-amber-950/10 hover:text-amber-500 hover:border-amber-900 uppercase rounded-xs"
                  onClick={() => onOpenFile?.(message)}
                >
                  {resolveText("messageFeed.openFile", "BULGUYU İNCELE", language)}
                </button>
              </div>
            </div>
          );
        }

        if (isCorrupt) {
          return (
            <div
              key={`${messageText}-${index}`}
              className="max-w-[92%] animate-[messageIn_0.35s_ease-out_both] sm:max-w-[78%]"
            >
              <span className={["mb-2 block text-[10px] tracking-widest uppercase", getSpeakerColor(messageSpeaker, isPlayer, isSystemAlert)].join(" ")}>
                {messageSpeaker}
              </span>
              <CorruptMessageBubble
                text={messageText}
                level={message.corruption || "medium"}
              />
            </div>
          );
        }

        return (
          <div
            key={`${messageText || message.type}-${index}`}
            className={[
              "max-w-[92%] animate-[messageIn_0.35s_ease-out_both]",
              isPlayer ? "ml-auto text-right sm:max-w-[72%]" : "sm:max-w-[78%]",
              isSystemAlert ? "border-l border-rose-900 pl-3" : ""
            ].join(" ")}
          >
            <span
              className={[
                "mb-1.5 block text-[10px] tracking-widest uppercase",
                getSpeakerColor(
                  messageSpeaker,
                  isPlayer,
                  isSystemAlert
                )
              ].join(" ")}
            >
              {messageSpeaker}
            </span>

            <p
              className={[
                "inline-block px-3.5 py-2.5 text-left text-xs leading-relaxed tracking-wide rounded-xs",
                isPlayer
                  ? "border border-amber-900/30 bg-amber-950/5 text-stone-200"
                  : isSystemAlert
                    ? "border border-rose-900/40 bg-rose-950/10 text-rose-500 font-bold"
                    : "border border-stone-900 bg-stone-950/50 text-stone-300"
              ].join(" ")}
            >
              {messageText}
            </p>
          </div>
        );
      })}

      {isTyping && (
        <div className="max-w-[92%] animate-[messageIn_0.35s_ease-out_both] sm:max-w-[78%]">
          <span className={["mb-1.5 block text-[10px] tracking-widest uppercase", getSpeakerColor(speaker)].join(" ")}>
            {speaker}
          </span>

          <div className="flex h-6 items-center gap-1.5 pl-1.5">
            <span className="h-1 w-1 animate-[typingDotPulse_0.9s_infinite_ease-in-out] rounded-full bg-amber-600" />
            <span className="h-1 w-1 animate-[typingDotPulse_0.9s_infinite_ease-in-out] rounded-full bg-amber-600 [animation-delay:150ms]" />
            <span className="h-1 w-1 animate-[typingDotPulse_0.9s_infinite_ease-in-out] rounded-full bg-amber-600 [animation-delay:300ms]" />
          </div>
        </div>
      )}
    </div>
  );
}
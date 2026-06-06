import { useEffect, useRef } from "react";
import { getGameText } from "../i18n/gameText";

function resolveText(key, fallback = "", language = "en") {
  return getGameText(key, fallback, language);
}

export default function MessageFeed({
  speaker,
  messages,
  isTyping,
  onOpenFile,
  language = "en",
  hasBottomPanel = false
}) {
  const feedScrollRef = useRef(null);

  useEffect(() => {
    if (feedScrollRef.current) {
      feedScrollRef.current.scrollTo({
        top: feedScrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages, isTyping, hasBottomPanel]);

  function getSpeakerLabel(message) {
    if (message.sender === "player") {
      return resolveText("speaker.you", "YOU", language);
    }

    if (message.sender === "system") {
      return resolveText("speaker.system", "SYSTEM", language);
    }

    return message.speaker || speaker;
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
        resolveText("messageFeed.incomingImage", "[INCOMING IMAGE]", language),
      language
    );
  }

  function getMessageCaption(message) {
    return resolveText(message.captionKey, message.caption || "", language);
  }

  return (
    <div
      ref={feedScrollRef}
      className={[
        "terminal-scrollbar flex h-full min-h-0 flex-col gap-5 overflow-y-auto border border-cyan-300/15 bg-slate-900/35 p-3 sm:p-4",
        hasBottomPanel ? "pb-28 sm:pb-32" : ""
      ].join(" ")}
    >
      {messages.map((message, index) => {
        const messageSpeaker = getSpeakerLabel(message);
        const isPlayer = message.sender === "player";
        const isSystemAlert = message.type === "systemAlert";
        const messageText = getMessageText(message);

        if (message.type === "image") {
          const imageTitle = getMessageTitle(message);
          const imageCaption = getMessageCaption(message);

          return (
            <div
              key={`${imageTitle || message.src}-${index}`}
              className="max-w-[92%] animate-[messageIn_0.35s_ease-out_both] sm:max-w-[78%]"
            >
              <span className="mb-2 block text-[11px] tracking-[0.14em] text-cyan-300/80">
                {messageSpeaker}
              </span>

              <div className="border border-cyan-300/25 bg-slate-950/75 p-3 shadow-[0_0_24px_rgba(34,211,238,0.08),inset_0_0_20px_rgba(34,211,238,0.04)]">
                <div className="mb-3 flex justify-between gap-3 border-b border-cyan-300/15 pb-2 text-[11px] tracking-[0.12em] text-blue-300">
                  <span className="truncate">{imageTitle}</span>

                  <span className="shrink-0">
                    {resolveText(
                      "messageFeed.fileReceived",
                      "FILE RECEIVED",
                      language
                    )}
                  </span>
                </div>

                <div className="overflow-hidden border border-cyan-300/20 bg-slate-900 p-1">
                  <img
                    src={message.src}
                    alt={
                      imageCaption ||
                      imageTitle ||
                      resolveText(
                        "messageFeed.recoveredImage",
                        "Recovered image",
                        language
                      )
                    }
                    className="block max-h-72 w-full object-cover contrast-125 saturate-75 brightness-90"
                  />
                </div>

                {imageCaption && (
                  <p className="mt-3 text-xs leading-5 text-cyan-50/65">
                    {imageCaption}
                  </p>
                )}

                <button
                  type="button"
                  className="mt-3 w-full border border-cyan-300/35 bg-cyan-950/40 px-3 py-2 text-[11px] tracking-[0.2em] text-cyan-50 transition hover:bg-cyan-400/10"
                  onClick={() => onOpenFile?.(message)}
                >
                  {resolveText("messageFeed.viewImage", "VIEW IMAGE", language)}
                </button>
              </div>
            </div>
          );
        }

        if (message.type === "corruptMessage") {
          return (
            <div
              key={`${messageText}-${index}`}
              className="max-w-[92%] animate-[messageIn_0.35s_ease-out_both] sm:max-w-[78%]"
            >
              <span className="mb-2 block text-[11px] tracking-[0.14em] text-cyan-300/80">
                {messageSpeaker}
              </span>

              <p className="inline-block animate-[corruptTextPulse_0.55s_infinite] border border-rose-400/30 bg-rose-950/25 px-4 py-3 text-sm leading-6 text-rose-400 drop-shadow-[0_0_10px_rgba(251,113,133,0.75)] sm:text-base">
                {messageText}
              </p>
            </div>
          );
        }

        return (
          <div
            key={`${messageText || message.type}-${index}`}
            className={[
              "max-w-[92%] animate-[messageIn_0.35s_ease-out_both]",
              isPlayer ? "ml-auto text-right sm:max-w-[72%]" : "sm:max-w-[78%]",
              isSystemAlert ? "border-l-2 border-rose-400/75 pl-3" : ""
            ].join(" ")}
          >
            <span
              className={[
                "mb-2 block text-[11px] tracking-[0.14em]",
                isPlayer ? "text-emerald-300" : "text-cyan-300/80"
              ].join(" ")}
            >
              {messageSpeaker}
            </span>

            <p
              className={[
                "inline-block px-4 py-3 text-left text-sm leading-6 sm:text-base",
                isPlayer
                  ? "border border-emerald-300/25 bg-emerald-950/25 text-cyan-50"
                  : isSystemAlert
                    ? "border border-rose-400/30 bg-rose-950/20 text-rose-400 drop-shadow-[0_0_10px_rgba(251,113,133,0.65)]"
                    : "border border-cyan-300/15 bg-slate-900/60 text-cyan-50"
              ].join(" ")}
            >
              {messageText}
            </p>
          </div>
        );
      })}

      {isTyping && (
        <div className="max-w-[92%] animate-[messageIn_0.35s_ease-out_both] sm:max-w-[78%]">
          <span className="mb-2 block text-[11px] tracking-[0.14em] text-cyan-300/80">
            {speaker}
          </span>

          <div className="flex h-8 items-center gap-2">
            <span className="h-1.5 w-1.5 animate-[typingDotPulse_0.9s_infinite_ease-in-out] rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.7)]" />
            <span className="h-1.5 w-1.5 animate-[typingDotPulse_0.9s_infinite_ease-in-out] rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.7)] [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 animate-[typingDotPulse_0.9s_infinite_ease-in-out] rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.7)] [animation-delay:300ms]" />
          </div>
        </div>
      )}
    </div>
  );
}
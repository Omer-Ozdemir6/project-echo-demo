import { useEffect, useState } from "react";
import SettingsModal from "./SettingsModal";
import { getGameText } from "../i18n/gameText";

export default function StartScreen({
  gameTitle,
  subtitle,
  onStart,
  settings,
  onChangeSettings,
  onReset
}) {
  const [introStep, setIntroStep] = useState("producerLogo");
  const [isLeaving, setIsLeaving] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const language = settings?.language || "en";

  useEffect(() => {
    let leaveTimer;
    let nextTimer;

    if (introStep === "producerLogo") {
      leaveTimer = setTimeout(() => {
        setIsLeaving(true);
      }, 2200);

      nextTimer = setTimeout(() => {
        setIntroStep("disclaimer");
        setIsLeaving(false);
      }, 3200);
    }

    if (introStep === "disclaimer") {
      leaveTimer = setTimeout(() => {
        setIsLeaving(true);
      }, 3600);

      nextTimer = setTimeout(() => {
        setIntroStep("start");
        setIsLeaving(false);
      }, 4800);
    }

    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(nextTimer);
    };
  }, [introStep]);

  if (introStep === "producerLogo") {
    return (
      <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-black">
        <div
          className={[
            "flex flex-col items-center justify-center",
            isLeaving
              ? "animate-[producerLogoFadeOut_1s_ease-in_forwards]"
              : "animate-[producerLogoFadeIn_1.2s_ease-out_forwards]"
          ].join(" ")}
        >
          <img
            src="/red-door-logo.jpg"
            alt="Red Door"
            className="w-56 max-w-[70vw] object-contain sm:w-72"
            draggable={false}
          />
        </div>
      </main>
    );
  }

  if (introStep === "disclaimer") {
    return (
      <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-black px-6">
        <div
          className={[
            "max-w-5xl text-center",
            isLeaving
              ? "animate-[producerLogoFadeOut_1s_ease-in_forwards]"
              : "animate-[producerLogoFadeIn_1.2s_ease-out_forwards]"
          ].join(" ")}
        >
          <p className="text-2xl leading-relaxed tracking-[0.04em] text-white/90 sm:text-4xl">
            {getGameText(
              "start.disclaimer.line1",
              "All characters and locations in this game are fictional.",
              language
            )}
          </p>

          <p className="mt-6 text-2xl leading-relaxed tracking-[0.04em] text-white/90 sm:text-4xl">
            {getGameText(
              "start.disclaimer.line2",
              "Any resemblance to real people or places is purely coincidental.",
              language
            )}
          </p>
        </div>
      </main>
    );
  }

 return (
  <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-6 py-10 text-cyan-50 animate-[startScreenFadeIn_0.9s_ease-out_both]">
    <img
      src="/echo-menu-bg.jpg"
      alt=""
      className="absolute inset-0 h-full w-full object-cover"
      draggable={false}
    />

    <div className="absolute inset-0 bg-black/35" />

    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent,rgba(0,0,0,0.48))]" />

    <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.018),rgba(255,255,255,0.018)_1px,transparent_1px,transparent_5px)] opacity-35" />

    <button
      type="button"
      onClick={() => setIsSettingsOpen(true)}
      className={[
        "absolute right-5 top-5 z-20",
        "grid h-10 w-10 place-items-center",
        "border border-cyan-300/25 bg-slate-950/45",
        "text-cyan-100 backdrop-blur-sm",
        "transition hover:border-cyan-300/50 hover:bg-cyan-400/10"
      ].join(" ")}
      aria-label={getGameText("common.openSettings", "Open settings", language)}
    >
      ⚙
    </button>

    <section className="relative z-10 flex w-full max-w-xl flex-col items-center text-center">
      <div className="mb-10 text-center">
        <h1 className="text-5xl font-light tracking-[0.32em] text-cyan-100 drop-shadow-[0_0_26px_rgba(34,211,238,0.65)] sm:text-7xl">
          {gameTitle}
        </h1>

        <div className="mx-auto mt-5 h-px w-64 bg-cyan-300/40 shadow-[0_0_20px_rgba(34,211,238,0.65)]" />
      </div>

      <button
        type="button"
        onClick={onStart}
        className={[
          "w-full max-w-xs border border-cyan-300/50 bg-slate-950/40 px-8 py-4",
          "text-sm tracking-[0.28em] text-cyan-100 backdrop-blur-sm",
          "transition-all duration-300",
          "hover:border-cyan-300/85 hover:bg-cyan-400/10",
          "hover:shadow-[0_0_30px_rgba(34,211,238,0.24)]",
          "active:scale-[0.98]"
        ].join(" ")}
      >
        {getGameText("start.establishLink", "ESTABLISH LINK", language)}
      </button>
    </section>

    {isSettingsOpen && (
      <SettingsModal
        settings={settings}
        onChangeSettings={onChangeSettings}
        onReset={onReset}
        onClose={() => setIsSettingsOpen(false)}
      />
    )}
  </main>
);
}
import { useEffect, useState } from "react";
import SettingsModal from "./SettingsModal";

export default function StartScreen({
  gameTitle,
  subtitle,
  onStart,
  settings,
  onChangeSettings,
  onReset
}) {
  const [showProducerLogo, setShowProducerLogo] = useState(true);
  const [isLogoLeaving, setIsLogoLeaving] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const leaveTimer = setTimeout(() => {
      setIsLogoLeaving(true);
    }, 2200);

    const hideTimer = setTimeout(() => {
      setShowProducerLogo(false);
    }, 3200);

    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (showProducerLogo) {
    return (
      <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-black">
        <div
          className={[
            "flex flex-col items-center justify-center",
            isLogoLeaving
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

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-black px-6 py-10 text-cyan-50 animate-[startScreenFadeIn_0.9s_ease-out_both]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.08),transparent_70%)]" />

      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.02),rgba(255,255,255,0.02)_1px,transparent_1px,transparent_5px)] opacity-40" />

      <button
        type="button"
        onClick={() => setIsSettingsOpen(true)}
        className={[
          "absolute right-5 top-5 z-20",
          "grid h-10 w-10 place-items-center",
          "border border-cyan-300/25 bg-slate-900/60",
          "text-cyan-100",
          "transition hover:border-cyan-300/50 hover:bg-cyan-400/10"
        ].join(" ")}
        aria-label="Open settings"
      >
        ⚙
      </button>

      <section className="relative z-10 flex w-full max-w-xl flex-col items-center text-center">
        <div className="mb-8 grid h-40 w-40 place-items-center rounded-full border border-cyan-300/40 text-sm tracking-[0.45em] text-cyan-300 shadow-[0_0_40px_rgba(34,211,238,0.35)] sm:h-52 sm:w-52 sm:text-base">
          {gameTitle}
        </div>

        <p className="mb-3 text-[10px] tracking-[0.35em] text-cyan-300/55">
          REMOTE SIGNAL DETECTED
        </p>

        <p className="mb-10 max-w-md text-sm leading-7 text-cyan-50/65 sm:text-base">
          {subtitle}
        </p>

        <button
          type="button"
          onClick={onStart}
          className={[
            "w-full max-w-xs border border-cyan-300/40 bg-cyan-950/25 px-8 py-4",
            "text-sm tracking-[0.28em] text-cyan-100",
            "transition-all duration-300",
            "hover:border-cyan-300/70 hover:bg-cyan-400/10",
            "hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]",
            "active:scale-[0.98]"
          ].join(" ")}
        >
          ESTABLISH LINK
        </button>

        <div className="mt-8 text-[10px] tracking-[0.35em] text-cyan-50/30">
          STATUS: UNSTABLE
        </div>
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
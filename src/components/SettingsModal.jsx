import { useState } from "react";

const SUPPORTED_LANGUAGES = [
  { code: "en", label: "ENGLISH" },
  { code: "tr", label: "TÜRKÇE" },
  { code: "de", label: "DEUTSCH" },
  { code: "fr", label: "FRANÇAIS" },
  { code: "es", label: "ESPAÑOL" },
  { code: "ja", label: "日本語" }
];

export default function SettingsModal({
  settings,
  onChangeSettings,
  onReset,
  onClose
}) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const textSpeed = settings?.textSpeed || "normal";
  const language = settings?.language || "en";
  const soundEnabled = settings?.soundEnabled ?? true;
  const vibrationEnabled = settings?.vibrationEnabled ?? true;

  function updateSetting(key, value) {
    onChangeSettings?.({
      ...settings,
      [key]: value
    });
  }

  return (
    <div className="fixed inset-0 z-[65] grid place-items-center bg-black/75 p-3 text-cyan-50 backdrop-blur-sm sm:p-6">
      <section className="relative z-10 w-full max-w-xl overflow-hidden border border-cyan-300/35 bg-slate-950/95 shadow-[0_0_60px_rgba(34,211,238,0.14),inset_0_0_36px_rgba(34,211,238,0.05)] animate-[modalScaleIn_0.25s_ease-out_both]">
        <header className="flex items-start justify-between gap-4 border-b border-cyan-300/20 p-4">
          <div>
            <p className="m-0 text-[11px] tracking-[0.3em] text-cyan-50/55">
              SYSTEM
            </p>

            <h2 className="mt-1 text-lg tracking-[0.2em] text-cyan-300">
              SETTINGS
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="border border-rose-400/50 px-3 py-2 text-[11px] tracking-[0.2em] text-rose-300 transition hover:bg-rose-400/10"
          >
            CLOSE
          </button>
        </header>

        <div className="terminal-scrollbar max-h-[70dvh] space-y-4 overflow-y-auto p-4">
          <div className="border border-cyan-300/15 bg-slate-900/50 p-3">
            <p className="mb-3 text-[11px] tracking-[0.22em] text-cyan-300/70">
              LANGUAGE
            </p>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => updateSetting("language", lang.code)}
                  className={[
                    "border px-3 py-2 text-[11px] tracking-[0.14em] transition",
                    language === lang.code
                      ? "border-emerald-300/50 bg-emerald-950/35 text-emerald-200"
                      : "border-cyan-300/15 text-cyan-50/55 hover:bg-cyan-400/10"
                  ].join(" ")}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border border-cyan-300/15 bg-slate-900/50 p-3">
            <p className="mb-3 text-[11px] tracking-[0.22em] text-cyan-300/70">
              TEXT SPEED
            </p>

            <div className="grid grid-cols-3 gap-2">
              {["slow", "normal", "fast"].map((speed) => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => updateSetting("textSpeed", speed)}
                  className={[
                    "border px-3 py-2 text-[11px] tracking-[0.16em] uppercase transition",
                    textSpeed === speed
                      ? "border-emerald-300/50 bg-emerald-950/35 text-emerald-200"
                      : "border-cyan-300/15 text-cyan-50/55 hover:bg-cyan-400/10"
                  ].join(" ")}
                >
                  {speed}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => updateSetting("soundEnabled", !soundEnabled)}
              className="border border-cyan-300/15 bg-slate-900/50 p-3 text-left transition hover:bg-cyan-400/10"
            >
              <span className="block text-[11px] tracking-[0.22em] text-cyan-300/70">
                SOUND
              </span>

              <strong className="mt-2 block text-sm text-cyan-50">
                {soundEnabled ? "ENABLED" : "DISABLED"}
              </strong>
            </button>

            <button
              type="button"
              onClick={() =>
                updateSetting("vibrationEnabled", !vibrationEnabled)
              }
              className="border border-cyan-300/15 bg-slate-900/50 p-3 text-left transition hover:bg-cyan-400/10"
            >
              <span className="block text-[11px] tracking-[0.22em] text-cyan-300/70">
                VIBRATION
              </span>

              <strong className="mt-2 block text-sm text-cyan-50">
                {vibrationEnabled ? "ENABLED" : "DISABLED"}
              </strong>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="w-full border border-rose-400/45 bg-rose-950/20 px-4 py-3 text-[11px] tracking-[0.22em] text-rose-300 transition hover:bg-rose-400/10"
          >
            RESET PROGRESS
          </button>

          {showResetConfirm && (
            <div className="border border-rose-400/35 bg-rose-950/20 p-4">
              <p className="mb-2 text-[11px] tracking-[0.22em] text-rose-300">
                CONFIRM RESET
              </p>

              <p className="mb-4 text-sm leading-6 text-cyan-50/65">
                This will permanently delete your current progress.
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="border border-cyan-300/25 px-4 py-3 text-[11px] tracking-[0.18em] text-cyan-200 transition hover:bg-cyan-400/10"
                >
                  CANCEL
                </button>

                <button
                  type="button"
                  onClick={onReset}
                  className="border border-rose-400/60 bg-rose-950/30 px-4 py-3 text-[11px] tracking-[0.18em] text-rose-200 transition hover:bg-rose-400/10"
                >
                  DELETE SAVE
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
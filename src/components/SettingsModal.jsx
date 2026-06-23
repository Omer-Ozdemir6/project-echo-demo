import { useState, useMemo } from "react";

const SUPPORTED_LANGUAGES = [
  { code: "en", label: "ENGLISH" },
  { code: "tr", label: "TÜRKÇE" },
  { code: "de", label: "DEUTSCH" },
  { code: "fr", label: "FRANÇAIS" },
  { code: "es", label: "ESPAÑOL" },
  { code: "ja", label: "日本語" }
];

const ScanlineOverlay = () => (
  <div className="pointer-events-none absolute inset-0 z-50 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.012),rgba(255,255,255,0.012)_2px,transparent_2px,transparent_5px)] opacity-30 shadow-[inset_0_0_60px_rgba(0,0,0,0.85)]" />
);

export default function SettingsModal({
  settings,
  onChangeSettings,
  onReset,
  onClose,
  onReturnToMenu // 🚀 YENİ: Ana menüye güvenli dönüşü tetikleyen callback fonksiyonu
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

  const currentTheme = useMemo(() => {
    if (showResetConfirm) {
      return {
        border: "border-rose-600 shadow-[0_0_50px_rgba(225,29,72,0.15)] animate-[screenGlitch_0.15s_infinite]",
        headerText: "text-rose-500",
        panelBg: "bg-rose-950/5 border-rose-950/40",
        accentText: "text-rose-400/70"
      };
    }
    return {
      border: "border-cyan-500/40 shadow-[0_0_40px_rgba(34,211,238,0.08),inset_0_0_30px_rgba(34,211,238,0.03)]",
      headerText: "text-cyan-300",
      panelBg: "bg-slate-900/40 border-cyan-300/10",
      accentText: "text-cyan-400/60"
    };
  }, [showResetConfirm]);

  return (
    <div className="fixed inset-0 z-[65] grid place-items-center bg-black/85 p-4 text-cyan-50 backdrop-blur-xs select-none font-mono">
      <section 
        className={[
          "relative z-10 w-full max-w-xl overflow-hidden border-2 bg-black/95 p-5 sm:p-6 transition-all duration-300 rounded-sm border-b-4",
          currentTheme.border
        ].join(" ")}
      >
        <ScanlineOverlay />

        {/* MODAL HEADER */}
        <header className="flex items-start justify-between gap-4 border-b border-neutral-900 pb-4 mb-4">
          <div>
            <p className={`m-0 text-[10px] tracking-[0.35em] font-bold ${currentTheme.accentText}`}>
              {showResetConfirm ? "SYSTEM OVERRIDE" : "CORE INTERFACE"}
            </p>
            <h2 className={`mt-1 text-base tracking-[0.25em] font-black uppercase transition-colors duration-300 ${currentTheme.headerText}`}>
              {showResetConfirm ? "CRITICAL WARN" : "SETTINGS_PANEL"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="border border-neutral-800 bg-neutral-900/30 px-4 py-2 text-[10px] tracking-[0.2em] font-bold text-neutral-400 transition hover:bg-rose-600/20 hover:text-rose-400 hover:border-rose-900"
          >
            [CLOSE]
          </button>
        </header>

        {/* SETTINGS CONTENT CORES */}
        <div className="terminal-scrollbar max-h-[65dvh] space-y-4 overflow-y-auto pr-1">
          
          {/* 1. LANGUAGE SELECTOR */}
          <div className={`border p-3 rounded-xs bg-black/50 ${currentTheme.panelBg}`}>
            <p className={`mb-3 text-[10px] tracking-[0.25em] font-bold ${currentTheme.accentText}`}>
              &gt; SELECT_COMM_LANGUAGE
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => updateSetting("language", lang.code)}
                  className={[
                    "border px-3 py-2 text-[10px] tracking-[0.15em] font-mono transition relative overflow-hidden",
                    language === lang.code
                      ? "border-emerald-500/60 bg-emerald-950/20 text-emerald-400 font-bold shadow-[0_0_10px_rgba(52,211,153,0.1)]"
                      : "border-neutral-900 text-neutral-500 hover:bg-cyan-500/5 hover:text-cyan-300 hover:border-cyan-900/50"
                  ].join(" ")}
                >
                  {language === lang.code && (
                    <span className="absolute top-1 left-1.5 w-1 h-1 bg-emerald-400 rounded-full animate-ping" />
                  )}
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. TEXT SPEED CONTROLLER */}
          <div className={`border p-3 rounded-xs bg-black/50 ${currentTheme.panelBg}`}>
            <p className={`mb-3 text-[10px] tracking-[0.25em] font-bold ${currentTheme.accentText}`}>
              &gt; DATA_STREAM_OUTPUT_SPEED
            </p>
            <div className="grid grid-cols-3 gap-2">
              {["slow", "normal", "fast"].map((speed) => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => updateSetting("textSpeed", speed)}
                  className={[
                    "border px-3 py-2 text-[10px] tracking-[0.18em] uppercase transition font-bold",
                    textSpeed === speed
                      ? "border-emerald-500/60 bg-emerald-950/20 text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.1)]"
                      : "border-neutral-900 text-neutral-500 hover:bg-cyan-500/5 hover:text-cyan-300 hover:border-cyan-900/50"
                  ].join(" ")}
                >
                  {speed}
                </button>
              ))}
            </div>
          </div>

          {/* 3. HARDWARE TOGGLES */}
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => updateSetting("soundEnabled", !soundEnabled)}
              className={`border p-3.5 text-left transition rounded-xs bg-black/50 flex flex-col justify-between h-20 ${currentTheme.panelBg} hover:border-cyan-900/60`}
            >
              <span className={`block text-[10px] tracking-[0.25em] font-bold ${currentTheme.accentText}`}>AUDIO_FEED_INTEGRATION</span>
              <div className="w-full flex items-center justify-between mt-2 border-t border-neutral-900/40 pt-1.5">
                <span className={`text-xs font-black tracking-widest ${soundEnabled ? "text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.3)]" : "text-rose-600"}`}>
                  {soundEnabled ? "[ ON_FEED ]" : "[ MUTED ]"}
                </span>
                <div className={`w-2 h-2 rounded-full ${soundEnabled ? "bg-emerald-400 shadow-[0_0_6px_#4ade80]" : "bg-neutral-800"}`} />
              </div>
            </button>

            <button
              type="button"
              onClick={() => updateSetting("vibrationEnabled", !vibrationEnabled)}
              className={`border p-3.5 text-left transition rounded-xs bg-black/50 flex flex-col justify-between h-20 ${currentTheme.panelBg} hover:border-cyan-900/60`}
            >
              <span className={`block text-[10px] tracking-[0.25em] font-bold ${currentTheme.accentText}`}>HAPTIC_SYNAPSE_RESPONSE</span>
              <div className="w-full flex items-center justify-between mt-2 border-t border-neutral-900/40 pt-1.5">
                <span className={`text-xs font-black tracking-widest ${vibrationEnabled ? "text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.3)]" : "text-rose-600"}`}>
                  {vibrationEnabled ? "[ ACTIVE ]" : "[ STABLE ]"}
                </span>
                <div className={`w-2 h-2 rounded-full ${vibrationEnabled ? "bg-emerald-400 shadow-[0_0_6px_#4ade80]" : "bg-neutral-800"}`} />
              </div>
            </button>
          </div>

          {/* 🚀 4. GÜNCELLEME: ANA MENÜYE GÜVENLİ DÖNÜŞ BUTONU */}
          {!showResetConfirm && (
            <button
              type="button"
              onClick={onReturnToMenu}
              className="w-full border border-amber-500/40 bg-amber-950/10 py-3.5 text-[10px] tracking-[0.25em] text-amber-400 font-bold transition hover:bg-amber-500/20 hover:text-white hover:border-amber-500 uppercase rounded-xs"
            >
              ⎋ RETURN TO MAIN MENU (SAVE SAFE)
            </button>
          )}

          {/* 5. PROGRESS PURGE MECHANISM */}
          {!showResetConfirm ? (
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="w-full border border-rose-950 bg-rose-950/5 py-3.5 text-[10px] tracking-[0.25em] text-rose-400 font-black transition hover:bg-rose-600/20 hover:border-rose-600 hover:text-white uppercase rounded-xs"
            >
              🚨 PURGE COGNITIVE CACHE [RESET]
            </button>
          ) : (
            <div className="border border-rose-900/60 bg-rose-950/10 p-4 rounded-xs space-y-4 animate-[bootLineIn_0.15s_ease-out_both]">
              <div>
                <p className="text-[10px] tracking-[0.3em] text-rose-500 font-black uppercase flex items-center gap-2">
                  <span className="animate-ping text-xs">🛑</span> AUTHORIZATION_REQUIRED
                </p>
                <p className="mt-2 text-xs leading-relaxed tracking-wide text-rose-300/70 text-justify font-mono">
                  CRITICAL: This protocol will enforce an immediate Deep Neural Erasure on subject Elias. All loop memories, status thresholds, and established chaser coordinates will be permanently zeroed. This cannot be undone.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-rose-950/50 pt-3">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="border border-neutral-800 bg-neutral-900/40 py-3 text-[10px] tracking-[0.2em] text-neutral-400 font-bold transition hover:bg-neutral-800 hover:text-white"
                >
                  ABORT_PURGE
                </button>

                <button
                  type="button"
                  onClick={onReset}
                  className="border-2 border-rose-600 bg-rose-950/40 py-3 text-[10px] tracking-[0.2em] text-rose-200 font-black transition hover:bg-rose-600 hover:text-white shadow-[0_0_15px_rgba(225,29,72,0.15)] animate-pulse"
                >
                  EXECUTE_ERASURE
                </button>
              </div>
            </div>
          )}
        </div>

        {/* PANEL FOOTER INFRASTRUCTURE */}
        <div className="mt-4 pt-3 border-t border-neutral-900 flex items-center justify-between text-[8px] text-neutral-600 tracking-widest font-mono">
          <div>OS_VERSION: v2.8_LOOP_28</div>
          <div className={showResetConfirm ? "text-rose-700 animate-pulse" : "text-cyan-700"}>
            {showResetConfirm ? "SECURE_OVERRIDE_ACTIVE" : "ALL_SYSTEMS_OPERATIONAL"}
          </div>
        </div>
      </section>
    </div>
  );
}
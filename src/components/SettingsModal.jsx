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
  <div className="pointer-events-none absolute inset-0 z-50 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.01),rgba(255,255,255,0.01)_2px,transparent_2px,transparent_5px)] opacity-25 shadow-[inset_0_0_60px_rgba(0,0,0,0.85)]" />
);

export default function SettingsModal({
  settings,
  onChangeSettings,
  onReset,
  onClose,
  onReturnToMenu 
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
        border: "border-rose-900 shadow-[0_0_50px_rgba(185,28,28,0.1)] animate-[screenGlitch_0.15s_infinite]",
        headerText: "text-rose-600",
        panelBg: "bg-rose-950/10 border-rose-950/40",
        accentText: "text-rose-500/70"
      };
    }
    return {
      border: "border-stone-800 shadow-[0_0_40px_rgba(245,158,11,0.03),inset_0_0_30px_rgba(245,158,11,0.01)]",
      headerText: "text-amber-500",
      panelBg: "bg-stone-900/40 border-stone-800/40",
      accentText: "text-stone-500"
    };
  }, [showResetConfirm]);

  return (
    <div className="fixed inset-0 z-[65] grid place-items-center bg-black/90 p-4 text-stone-200 backdrop-blur-xs select-none font-mono">
      <section 
        className={[
          "relative z-10 w-full max-w-xl overflow-hidden border bg-neutral-950 p-5 sm:p-6 transition-all duration-300 rounded-xs border-b-2",
          currentTheme.border
        ].join(" ")}
      >
        <ScanlineOverlay />

        {/* MODAL HEADER */}
        <header className="flex items-start justify-between gap-4 border-b border-stone-900 pb-4 mb-4">
          <div>
            <p className={`m-0 text-[9px] tracking-[0.35em] font-black uppercase ${currentTheme.accentText}`}>
              {showResetConfirm ? "SİSTEM_MÜDAHALESİ" : "FREKANS_ARAYÜZÜ"}
            </p>
            <h2 className={`mt-1 text-xs tracking-[0.25em] font-bold uppercase transition-colors duration-300 ${currentTheme.headerText}`}>
              {showResetConfirm ? "KRİTİK_UYARI" : "AYARLAR_PANELİ"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="border border-stone-900 bg-stone-950/40 px-4 py-2 text-[9px] tracking-[0.2em] font-bold text-stone-500 transition hover:bg-rose-950/20 hover:text-rose-500 hover:border-rose-900 rounded-xs"
          >
            [KAPAT]
          </button>
        </header>

        {/* SETTINGS CONTENT CORES */}
        <div className="terminal-scrollbar max-h-[65dvh] space-y-4 overflow-y-auto pr-1">
          
          {/* 1. LANGUAGE SELECTOR */}
          <div className={`border p-3 rounded-xs bg-black/30 ${currentTheme.panelBg}`}>
            <p className={`mb-3 text-[9px] tracking-[0.25em] font-bold uppercase ${currentTheme.accentText}`}>
              &gt; TELSİZ_DİL_SEÇİMİ
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => updateSetting("language", lang.code)}
                  className={[
                    "border px-3 py-2 text-[9px] tracking-[0.15em] font-mono transition relative overflow-hidden rounded-xs",
                    language === lang.code
                      ? "border-amber-600/50 bg-amber-950/10 text-amber-500 font-bold shadow-[0_0_10px_rgba(245,158,11,0.05)]"
                      : "border-stone-900 text-stone-600 hover:bg-amber-950/5 hover:text-amber-400 hover:border-stone-800"
                  ].join(" ")}
                >
                  {language === lang.code && (
                    <span className="absolute top-1 left-1 w-1 h-1 bg-amber-500 rounded-full animate-ping" />
                  )}
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. TEXT SPEED CONTROLLER */}
          <div className={`border p-3 rounded-xs bg-black/30 ${currentTheme.panelBg}`}>
            <p className={`mb-3 text-[9px] tracking-[0.25em] font-bold uppercase ${currentTheme.accentText}`}>
              &gt; METİN_AKIŞ_HIZI
            </p>
            <div className="grid grid-cols-3 gap-2">
              {["slow", "normal", "fast"].map((speed) => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => updateSetting("textSpeed", speed)}
                  className={[
                    "border px-3 py-2 text-[9px] tracking-[0.18em] uppercase transition font-bold rounded-xs",
                    textSpeed === speed
                      ? "border-amber-600/50 bg-amber-950/10 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.05)]"
                      : "border-stone-900 text-stone-600 hover:bg-amber-950/5 hover:text-amber-400 hover:border-stone-800"
                  ].join(" ")}
                >
                  {speed === "slow" ? "YAVAŞ" : speed === "normal" ? "NORMAL" : "HIZLI"}
                </button>
              ))}
            </div>
          </div>

          {/* 3. HARDWARE TOGGLES */}
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => updateSetting("soundEnabled", !soundEnabled)}
              className={`border p-3.5 text-left transition rounded-xs bg-black/30 flex flex-col justify-between h-20 border-stone-900/60 ${currentTheme.panelBg} hover:border-stone-800`}
            >
              <span className={`block text-[9px] tracking-[0.25em] font-bold uppercase ${currentTheme.accentText}`}>SES_KANAL_BAĞLANTI</span>
              <div className="w-full flex items-center justify-between mt-2 border-t border-stone-900/40 pt-1.5">
                <span className={`text-[10px] font-bold tracking-widest ${soundEnabled ? "text-amber-500 font-black" : "text-stone-600"}`}>
                  {soundEnabled ? "[ SES_AÇIK ]" : "[ SESSİZ ]"}
                </span>
                <div className={`w-1.5 h-1.5 rounded-full ${soundEnabled ? "bg-amber-500 shadow-[0_0_6px_#f59e0b]" : "bg-stone-900"}`} />
              </div>
            </button>

            <button
              type="button"
              onClick={() => updateSetting("vibrationEnabled", !vibrationEnabled)}
              className={`border p-3.5 text-left transition rounded-xs bg-black/30 flex flex-col justify-between h-20 border-stone-900/60 ${currentTheme.panelBg} hover:border-stone-800`}
            >
              <span className={`block text-[9px] tracking-[0.25em] font-bold uppercase ${currentTheme.accentText}`}>HAPTİK_TİTREŞİM_TEPKİSİ</span>
              <div className="w-full flex items-center justify-between mt-2 border-t border-stone-900/40 pt-1.5">
                <span className={`text-[10px] font-bold tracking-widest ${vibrationEnabled ? "text-amber-500 font-black" : "text-stone-600"}`}>
                  {vibrationEnabled ? "[ AKTİF ]" : "[ STABİL ]"}
                </span>
                <div className={`w-1.5 h-1.5 rounded-full ${vibrationEnabled ? "bg-amber-500 shadow-[0_0_6px_#f59e0b]" : "bg-stone-900"}`} />
              </div>
            </button>
          </div>

          {/* 4. ANA MENÜYE GÜVENLİ DÖNÜŞ BUTONU */}
          {!showResetConfirm && (
            <button
              type="button"
              onClick={onReturnToMenu}
              className="w-full border border-amber-950 bg-amber-950/5 py-3.5 text-[9px] tracking-[0.25em] text-amber-500/80 font-black transition hover:bg-amber-950/15 hover:text-white hover:border-amber-900 uppercase rounded-xs"
            >
              ⎋ ANA MENÜYE DÖN (GÜVENLİ KAYIT)
            </button>
          )}

          {/* 5. PROGRESS PURGE MECHANISM */}
          {!showResetConfirm ? (
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="w-full border border-rose-950 bg-rose-950/5 py-3.5 text-[9px] tracking-[0.25em] text-rose-500/80 font-black transition hover:bg-rose-900/20 hover:border-rose-900 hover:text-white uppercase rounded-xs"
            >
              🚨 BELLEK ARŞİVİNİ TEMİZLE [RESET]
            </button>
          ) : (
            <div className="border border-rose-900/40 bg-rose-950/5 p-4 rounded-xs space-y-4 animate-[bootLineIn_0.15s_ease-out_both]">
              <div>
                <p className="text-[9px] tracking-[0.3em] text-rose-600 font-black uppercase flex items-center gap-2">
                  <span className="animate-pulse text-xs">🛑</span> YETKİLENDİRME_GEREKLİ
                </p>
                <p className="mt-2 text-[11px] leading-relaxed tracking-wide text-rose-400/60 text-justify font-mono">
                  KRİTİK PROSEDÜR: Bu işlem Jones Aydın'ın yer altı sığınak ağındaki tüm ilerlemesini, toplanan bulguları, keşif koordinatlarını ve döngü hafızasını kalıcı olarak sıfırlayacaktır. Bu işlem geri alınamaz.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-rose-950/30 pt-3">
                <button
                  key="abort"
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="border border-stone-900 bg-stone-950 py-3 text-[9px] tracking-[0.2em] text-stone-500 font-bold transition hover:bg-stone-900 hover:text-stone-300 rounded-xs"
                >
                  TEMİZLİĞİ_İPTAL_ET
                </button>

                <button
                  key="execute"
                  type="button"
                  onClick={onReset}
                  className="border border-rose-700 bg-rose-950/20 py-3 text-[9px] tracking-[0.2em] text-rose-300 font-black transition hover:bg-rose-600 hover:text-white rounded-xs shadow-[0_0_15px_rgba(220,38,38,0.1)]"
                >
                  HAFIZAYI_SIFIRLA
                </button>
              </div>
            </div>
          )}
        </div>

        {/* PANEL FOOTER INFRASTRUCTURE */}
        <div className="mt-4 pt-3 border-t border-stone-900 flex items-center justify-between text-[8px] text-stone-600 tracking-widest font-mono uppercase font-black">
          <div>KATMAN_OS_SURUM: v2.8_DONGU_28</div>
          <div className={showResetConfirm ? "text-rose-800 animate-pulse" : "text-amber-700"}>
            {showResetConfirm ? "GUVENLI_VERI_EZME_AKTIF" : "SISTEM_STABIL"}
          </div>
        </div>
      </section>
    </div>
  );
}
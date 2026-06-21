import { useEffect, useState } from "react";
import { getGameText } from "../i18n/gameText";

function resolveConfigText(value, language = "en") {
  if (typeof value === "string") return value;

  if (value && typeof value === "object") {
    return getGameText(value.textKey, value.text || "", language);
  }

  return "";
}

export default function BootSequence({
  gameTitle,
  completedSteps,
  activeStep,
  bootProgress,
  showError,
  criticalError,
  language = "en"
}) {
  function getLineColor(status) {
    return status === "failed" || showError
      ? "text-rose-500 drop-shadow-[0_0_12px_rgba(244,63,94,0.65)] font-bold"
      : "text-cyan-400/90";
  }

  const crtOverlay = (
    <div className="pointer-events-none fixed inset-0 z-50 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.015),rgba(255,255,255,0.015)_1px,transparent_1px,transparent_5px)] opacity-35" />
  );

  return (
    <main 
      className={[
        "relative flex min-h-dvh items-center justify-center overflow-hidden bg-black p-4 font-mono select-none text-cyan-50 sm:p-6",
        showError ? "animate-[screenGlitch_0.12s_infinite]" : "animate-[flicker_4s_infinite]"
      ].join(" ")}
    >
      <div className={`pointer-events-none absolute inset-0 transition-colors duration-1000 ${showError ? 'bg-[radial-gradient(circle_at_center,rgba(159,18,57,0.18),transparent_65%)]' : 'bg-[radial-gradient(circle_at_center,rgba(8,145,178,0.05),transparent_55%)]'}`} />
      {crtOverlay}

      <section className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-8 sm:flex-row sm:justify-center">
        
        {/* SOL TARAF: Stabil Olmayan Tehditkar Nöral Dalga Çemberi */}
        <div 
          className={[
            "grid h-36 w-36 shrink-0 place-items-center rounded-full border text-center text-[10px] font-bold tracking-[0.35em] transition-all duration-500",
            showError 
              ? "border-rose-600 text-rose-500 shadow-[0_0_40px_rgba(225,29,72,0.3)] animate-bounce" 
              : "border-cyan-500/50 text-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.15)] animate-[spinPulse_6s_linear_infinite]"
          ].join(" ")}
        >
          <div className="px-2 uppercase animate-pulse">
            {showError ? "SIGNAL LOST" : gameTitle}
          </div>
        </div>

        {/* SAĞ TARAF: Klinik Terminal Akış Kutusu */}
        <div 
          className={[
            "min-h-[320px] w-full max-w-2xl border bg-neutral-950/90 p-5 shadow-2xl transition-all duration-500",
            showError 
              ? "border-rose-950 shadow-[0_0_40px_rgba(225,29,72,0.05)]" 
              : "border-cyan-950/40 shadow-[0_0_30px_rgba(34,211,238,0.04)]"
          ].join(" ")}
        >
          {/* Tamamlanan Adımlar */}
          {completedSteps.map((step, index) => {
            const label = resolveConfigText(
              {
                text: step.label,
                textKey: step.labelKey
              },
              language
            );

            return (
              <p
                key={`${label}-${index}`}
                className={[
                  "mb-2.5 text-xs tracking-[0.06em] last:mb-0 sm:text-sm",
                  step.status === "failed"
                    ? "animate-[bootLineIn_0.15s_ease-out_both,errorPulse_0.3s_infinite]"
                    : "animate-[bootLineIn_0.18s_ease-out_both]",
                  getLineColor(step.status)
                ].join(" ")}
              >
                <span className="text-neutral-700/60">&gt;</span>{" "}
                <span className="opacity-80">[{label}]</span>

                <span className="ml-3 inline-block min-w-12 text-neutral-500">
                  {step.currentProgress}%
                </span>

                <span
                  className={[
                    "ml-4 inline-block min-w-16 font-bold tracking-widest",
                    step.status === "failed" ? "text-rose-500" : "text-cyan-400"
                  ].join(" ")}
                >
                  {step.status === "failed" ? "!! FAILED !!" : "SUCCESS"}
                </span>
              </p>
            );
          })}

          {/* Aktif Yüklenen Adım */}
          {!showError && activeStep && (
            <p
              className={[
                "mb-2.5 text-xs tracking-[0.06em] sm:text-sm",
                getLineColor(activeStep.status),
                "animate-[bootLineIn_0.15s_ease-out_both]"
              ].join(" ")}
            >
              <span className="text-neutral-700/60">&gt;</span>{" "}
              <span className="opacity-90">
                [
                {resolveConfigText(
                  {
                    text: activeStep.label,
                    textKey: activeStep.labelKey
                  },
                  language
                )}
                ]
              </span>

              <span className="ml-3 inline-block min-w-12 text-neutral-400 font-bold">
                {bootProgress}%
              </span>

              <span className="ml-1.5 inline-block animate-[cursorBlink_0.5s_infinite] text-cyan-400 font-black">
                _
              </span>
            </p>
          )}

          {/* KRİTİK HATA PERDESİ (Çöküş Aşaması) */}
          {showError && (
            <div className="mt-4 border border-rose-950 bg-rose-950/10 p-4 text-rose-400 animate-[criticalErrorBlink_0.3s_infinite]">
              {criticalError.map((line, index) => {
                const text = resolveConfigText(line, language);

                return (
                  <p
                    key={`${text}-${index}`}
                    className="mb-2 text-xs font-bold tracking-[0.1em] text-rose-500 last:mb-0 sm:text-sm uppercase"
                  >
                    !! {text} !!
                  </p>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* SAĞ ALT: Klinik Chaser Spinner Grubu */}
      <div className="fixed bottom-8 right-8 flex items-center gap-5 opacity-40">
        <span className={`text-[10px] tracking-[0.3em] font-bold transition-colors duration-500 ${showError ? 'text-rose-600' : 'text-cyan-600'}`}>
          {showError ? "BRAINWAVE_CONTAINMENT_FAILURE_" : "INTRUSION_PROBING_"}
        </span>
        
        <div className="relative w-5 h-5">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-1 h-1 rounded-full transition-colors duration-500 ${showError ? 'bg-rose-500' : 'bg-white'}`}
              style={{
                top: `${50 + 40 * Math.sin((i * Math.PI) / 4)}%`,
                left: `${50 + 40 * Math.cos((i * Math.PI) / 4)}%`,
                transform: "translate(-50%, -50%)",
                animation: showError ? "screenGlitch 0.2s infinite" : "typingDotPulse 1.2s infinite",
                animationDelay: `${i * 0.15}s`
              }}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
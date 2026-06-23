import { useEffect, useState, useRef } from "react";
import { getGameText } from "../i18n/gameText";

function resolveConfigText(value, language = "en") {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    return getGameText(value.textKey, value.text || "", language);
  }
  return "";
}

export default function BootSequence({
  gameTitle = "PROJECT ECHO",
  completedSteps = [],
  activeStep = null,
  bootProgress = 0,
  showError = false,
  criticalError = [],
  language = "en"
}) {
  const canvasRef = useRef(null);
  const audioRef = useRef(null);

  // 1. Gelişmiş Dinamik Siber Yağmur Efekti (Canvas)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const columns = Math.floor(canvas.width / 20);
    const drops = Array(columns).fill(1);
    const chars = "0110100110X0X0X1_DONGU_27_E17_ECHO_";

    const draw = () => {
      ctx.fillStyle = showError ? "rgba(15, 0, 0, 0.08)" : "rgba(0, 0, 0, 0.06)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = "10px monospace";
      
      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        
        // Hata durumunda kırmızı parazit, normal durumda soluk siber cyan
        ctx.fillStyle = showError 
          ? `rgba(244, 63, 94, ${Math.random() * 0.4})` 
          : `rgba(34, 211, 238, ${Math.random() * 0.15})`;

        ctx.fillText(text, i * 20, drops[i] * 20);

        if (drops[i] * 20 > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [showError]);

  // 2. Ses Efektleri Entegrasyonu (Atmosferik Tetikleyiciler)
  useEffect(() => {
    if (showError && audioRef.current) {
      // Projenizdeki alarm/parazit ses dosyasının yolunu buraya ekleyebilirsiniz
      // audioRef.current.src = "/sounds/system_failure.mp3";
      // audioRef.current.play().catch(() => {});
    }
  }, [showError]);

  function getLineColor(status) {
    return status === "failed" || showError
      ? "text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.5)] font-bold animate-pulse"
      : "text-cyan-400/90 drop-shadow-[0_0_6px_rgba(34,211,238,0.2)]";
  }

  return (
    <main 
      className={[
        "relative flex min-h-dvh items-center justify-center overflow-hidden bg-black p-4 font-mono select-none text-cyan-50 sm:p-6",
        showError ? "animate-[screenGlitch_0.15s_infinite]" : "animate-[flicker_6s_infinite]"
      ].join(" ")}
    >
      {/* Gizli Audio Elementi */}
      <audio ref={audioRef} loop />

      {/* Siber Yağmur Katmanı */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-80" />

      {/* CRT Tarama Çizgileri & Vignette */}
      <div className="pointer-events-none fixed inset-0 z-50 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.012),rgba(255,255,255,0.012)_2px,transparent_2px,transparent_6px)] opacity-40 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]" />
      <div className={`pointer-events-none absolute inset-0 transition-all duration-1000 z-10 ${showError ? 'bg-[radial-gradient(circle_at_center,rgba(225,29,72,0.15),transparent_75%)]' : 'bg-[radial-gradient(circle_at_center,rgba(8,145,178,0.03),transparent_60%)]'}`} />

      <section className="relative z-20 flex w-full max-w-5xl flex-col items-center gap-10 lg:flex-row lg:justify-center">
        
        {/* SOL PANEL: Gelişmiş Nöral Dalga Göstergesi */}
        <div className="flex flex-col items-center gap-4 shrink-0">
          <div 
            className={[
              "grid h-40 w-40 place-items-center rounded-full border-2 text-center text-[10px] font-bold tracking-[0.4em] transition-all duration-700 relative",
              showError 
                ? "border-rose-600 text-rose-500 shadow-[0_0_50px_rgba(225,29,72,0.4)] animate-ping" 
                : "border-cyan-500 text-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.2)] animate-[spinPulse_8s_linear_infinite]"
            ].join(" ")}
          >
            {/* Dönen Çember Süslemesi */}
            <div className={`absolute inset-1 border border-dashed rounded-full opacity-30 ${showError ? 'border-rose-500 animate-spin' : 'border-cyan-400 animate-[spin_20s_linear_infinite]'}`} />
            
            <div className="px-2 uppercase font-black z-10 max-w-[120px] leading-relaxed">
              {showError ? "⚠️ CORE FAULT" : gameTitle}
            </div>
          </div>
          
          {/* Ekstra Donanım Log Verisi */}
          <div className={`text-[9px] tracking-widest text-center opacity-50 font-mono ${showError ? 'text-rose-600' : 'text-cyan-600'}`}>
            CORE_ADDR: <span className="text-white">0x00000F27</span>
          </div>
        </div>

        {/* SAĞ PANEL: Klinik Terminal Akış Kutusu */}
        <div 
          className={[
            "min-h-[360px] w-full max-w-3xl border bg-black/90 p-6 shadow-2xl transition-all duration-500 border-t-4 rounded-b backdrop-blur-sm",
            showError 
              ? "border-t-rose-600 border-x-rose-950 border-b-rose-950 shadow-[0_0_50px_rgba(225,29,72,0.08)]" 
              : "border-t-cyan-500 border-x-neutral-900 border-b-neutral-900 shadow-[0_0_40px_rgba(34,211,238,0.05)]"
          ].join(" ")}
        >
          {/* Üst Terminal Header */}
          <div className="flex items-center justify-between border-b border-neutral-900 pb-3 mb-4 text-[10px] text-neutral-500 tracking-wider">
            <span>A12-77 SECURE CONNECTION INTERFACE</span>
            <span className={showError ? "text-rose-500 animate-pulse" : "text-emerald-500"}>
              {showError ? "● COGNITIVE_DISRUPTION" : "● FREQ_STABLE"}
            </span>
          </div>

          {/* Tamamlanan Adımlar Listesi */}
          <div className="space-y-2.5 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
            {completedSteps.map((step, index) => {
              const label = resolveConfigText({ text: step.label, textKey: step.labelKey }, language);

              return (
                <div
                  key={`${label}-${index}`}
                  className={[
                    "flex flex-wrap items-center justify-between text-xs tracking-wide sm:text-sm border-b border-neutral-950 pb-1",
                    step.status === "failed" ? "animate-[errorPulse_0.4s_infinite]" : "animate-[bootLineIn_0.2s_ease-out_both]",
                    getLineColor(step.status)
                  ].join(" ")}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-700 font-bold">&gt;</span>
                    <span className="opacity-70 font-mono">[{label}]</span>
                  </div>

                  <div className="flex items-center gap-6 font-mono">
                    <span className="text-neutral-600 text-xs">{step.currentProgress || 100}%</span>
                    <span className={`w-24 text-right font-black tracking-widest text-xs ${step.status === "failed" ? "text-rose-500" : "text-emerald-400"}`}>
                      {step.status === "failed" ? "!! CRIT !!" : "SUCCESS"}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Aktif Yüklenen Adım */}
            {!showError && activeStep && (
              <div
                className={[
                  "flex items-center justify-between text-xs tracking-wide sm:text-sm pb-1",
                  getLineColor(activeStep.status),
                  "animate-[bootLineIn_0.15s_ease-out_both]"
                ].join(" ")}
              >
                <div className="flex items-center gap-2">
                  <span className="text-cyan-500 font-bold animate-pulse">&gt;</span>
                  <span className="opacity-95">
                    [{resolveConfigText({ text: activeStep.label, textKey: activeStep.labelKey }, language)}]
                  </span>
                </div>

                <div className="flex items-center gap-6">
                  <span className="text-white font-bold animate-pulse">{bootProgress}%</span>
                  <span className="w-24 text-right ml-1 inline-block animate-[cursorBlink_0.4s_infinite] text-cyan-400 font-black text-sm">
                    █
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* KRİTİK HATA PANİK PERDESİ (Kernel Panic Modu) */}
          {showError && (
            <div className="mt-4 border border-rose-900/50 bg-rose-950/10 p-4 rounded text-rose-400 animate-[criticalErrorBlink_0.4s_infinite]">
              <div className="text-[10px] border-b border-rose-900/40 pb-2 mb-2 tracking-widest opacity-60">
                FATAL EXCEPTION AT SUBSYSTEM_LOG_D27
              </div>
              <div className="space-y-1">
                {criticalError.map((line, index) => {
                  const text = resolveConfigText(line, language);
                  return (
                    <p
                      key={`${text}-${index}`}
                      className="text-xs font-bold tracking-[0.08em] text-rose-500 uppercase font-mono flex items-center gap-2"
                    >
                      <span className="animate-ping text-rose-600">🛑</span> TERMINAL_ERR: {text}
                    </p>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SAĞ ALT: Gelişmiş Tehdit Algılama Spinner Grubu */}
      <div className="fixed bottom-6 right-6 hidden sm:flex items-center gap-4 opacity-50 z-30">
        <span className={`text-[9px] tracking-[0.25em] font-mono transition-colors duration-500 ${showError ? 'text-rose-500 font-bold' : 'text-cyan-600'}`}>
          {showError ? "CORRUPTED_STREAM_FAILURE_DATA_LOSS" : "NEURAL_LINK_PROBING_ACTIVE"}
        </span>
        
        <div className="relative w-6 h-6 animate-spin" style={{ animationDuration: showError ? "0.5s" : "4s" }}>
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-1.5 h-1.5 rounded-full transition-colors duration-500 ${showError ? 'bg-rose-500' : 'bg-cyan-400'}`}
              style={{
                top: `${50 + 35 * Math.sin((i * Math.PI) / 4)}%`,
                left: `${50 + 35 * Math.cos((i * Math.PI) / 4)}%`,
                transform: "translate(-50%, -50%)",
                opacity: (i + 1) / 8
              }}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
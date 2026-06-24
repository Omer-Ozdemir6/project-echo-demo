import { useEffect, useMemo, useState, useRef } from "react";
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

  // 1. Dinamik Sismik Sinyal Paraziti Efekti (Canvas)
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
    const chars = "0110100110X0X0X1_DONGU_28_JONES_ARKEOLOJI_";

    const draw = () => {
      ctx.fillStyle = showError ? "rgba(15, 0, 0, 0.12)" : "rgba(5, 5, 5, 0.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = "9px monospace";
      
      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        
        // Hata durumunda pas kırmızısı parazit, normal durumda loş kehribar rezonansı
        ctx.fillStyle = showError 
          ? `rgba(220, 38, 38, ${Math.random() * 0.35})` 
          : `rgba(245, 158, 11, ${Math.random() * 0.12})`;

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

  // 2. Alarm ve Sinyal Kesinti Sesleri Kontrolü
  useEffect(() => {
    if (showError && audioRef.current) {
      // Sinyal çöküşü ses kodu tetikleyici alanı
    }
  }, [showError]);

  function getLineColor(status) {
    return status === "failed" || showError
      ? "text-rose-600 drop-shadow-[0_0_10px_rgba(220,38,38,0.4)] font-bold animate-pulse"
      : "text-amber-500/90 drop-shadow-[0_0_6px_rgba(245,158,11,0.15)]";
  }

  return (
    <main 
      className={[
        "relative flex min-h-dvh items-center justify-center overflow-hidden bg-black p-4 font-mono select-none text-stone-200 sm:p-6",
        showError ? "animate-[screenGlitch_0.15s_infinite]" : ""
      ].join(" ")}
    >
      <audio ref={audioRef} loop />

      {/* Sismik Sinyal Katmanı */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-80" />

      {/* CRT Tarama Çizgileri & Sığınak Gölgelendirmesi */}
      <div className="pointer-events-none fixed inset-0 z-50 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.01),rgba(255,255,255,0.01)_2px,transparent_2px,transparent_6px)] opacity-30 shadow-[inset_0_0_100px_rgba(0,0,0,0.95)]" />
      <div className={`pointer-events-none absolute inset-0 transition-all duration-1000 z-10 ${showError ? 'bg-[radial-gradient(circle_at_center,rgba(185,28,28,0.12),transparent_75%)]' : 'bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.02),transparent_60%)]'}`} />

      <section className="relative z-20 flex w-full max-w-5xl flex-col items-center gap-10 lg:flex-row lg:justify-center">
        
        {/* SOL PANEL: Telsiz İstasyonu Kadranı */}
        <div className="flex flex-col items-center gap-4 shrink-0">
          <div 
            className={[
              "grid h-36 w-36 place-items-center rounded-full border text-center text-[10px] font-bold tracking-[0.35em] transition-all duration-700 relative",
              showError 
                ? "border-rose-700 text-rose-600 shadow-[0_0_40px_rgba(220,38,38,0.3)]" 
                : "border-amber-600 text-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.15)] animate-pulse"
            ].join(" ")}
          >
            {/* Dönen Analog Kadran Halkası */}
            <div className={`absolute inset-1.5 border border-dashed rounded-full opacity-10 ${showError ? 'border-rose-600 animate-spin' : 'border-stone-700 animate-[spin_30s_linear_infinite]'}`} />
            
            <div className="px-3 uppercase font-bold z-10 max-w-[110px] leading-relaxed text-center">
              {showError ? "⚠️ HAT ARİZASI" : gameTitle}
            </div>
          </div>
          
          {/* Antik İstasyon Donanım Adresi */}
          <div className={`text-[8px] tracking-widest text-center opacity-40 font-mono font-black ${showError ? 'text-rose-700' : 'text-stone-600'}`}>
            SIĞINAK_BLOK_KODU: <span className="text-stone-300">0x00000F28</span>
          </div>
        </div>

        {/* SAĞ PANEL: Telsiz Akış Arayüzü */}
        <div 
          className={[
            "min-h-[350px] w-full max-w-2xl border bg-neutral-950 p-6 shadow-2xl transition-all duration-500 border-t-2 rounded-xs backdrop-blur-md",
            showError 
              ? "border-t-rose-700 border-x-rose-950 border-b-rose-950 shadow-[0_0_40px_rgba(220,38,38,0.05)]" 
              : "border-t-amber-600 border-x-stone-900 border-b-stone-900 shadow-[0_0_30px_rgba(0,0,0,0.5)]"
          ].join(" ")}
        >
          {/* Üst Terminal Başlığı */}
          <div className="flex items-center justify-between border-b border-stone-900 pb-3 mb-4 text-[9px] text-stone-600 tracking-widest font-black uppercase">
            <span>KATMAN_KÖPRÜSÜ_TELSİZ_ARAYÜZÜ</span>
            <span className={showError ? "text-rose-600 animate-pulse font-bold" : "text-amber-500 font-bold"}>
              {showError ? "● AKUSTİK_KAYIP" : "● REZONANS_SABİT"}
            </span>
          </div>

          {/* Tamamlanan Bağlantı Adımları Listesi */}
          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-2 terminal-scrollbar font-bold uppercase text-[11px]">
            {completedSteps.map((step, index) => {
              const label = resolveConfigText({ text: step.label, textKey: step.labelKey }, language);

              return (
                <div
                  key={`${label}-${index}`}
                  className={[
                    "flex flex-wrap items-center justify-between tracking-wide border-b border-stone-900/40 pb-1",
                    step.status === "failed" ? "animate-[errorPulse_0.4s_infinite]" : "animate-[bootLineIn_0.2s_ease-out_both]",
                    getLineColor(step.status)
                  ].join(" ")}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-stone-800 font-bold font-mono">&gt;</span>
                    <span className="opacity-60 font-mono">[{label}]</span>
                  </div>

                  <div className="flex items-center gap-6 font-mono">
                    <span className="text-stone-600 text-[10px]">{step.currentProgress || 100}%</span>
                    <span className={`w-20 text-right font-black tracking-widest text-[10px] ${step.status === "failed" ? "text-rose-600" : "text-amber-500"}`}>
                      {step.status === "failed" ? "!! KRİTİK !!" : "BAĞLANDI"}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Aktif Taranan Bağlantı Adımı */}
            {!showError && activeStep && (
              <div
                className={[
                  "flex items-center justify-between tracking-wide pb-1",
                  getLineColor(activeStep.status),
                  "animate-[bootLineIn_0.15s_ease-out_both]"
                ].join(" ")}
              >
                <div className="flex items-center gap-2">
                  <span className="text-amber-500 font-bold animate-pulse">&gt;</span>
                  <span className="opacity-90">
                    [{resolveConfigText({ text: activeStep.label, textKey: activeStep.labelKey }, language)}]
                  </span>
                </div>

                <div className="flex items-center gap-6">
                  <span className="text-stone-300 font-bold animate-pulse">%{bootProgress}</span>
                  <span className="w-20 text-right ml-1 inline-block animate-[cursorBlink_0.4s_infinite] text-amber-500 font-black text-xs">
                    █
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* SİSMİK KİLİTLENME VE FREKANS HATASI PERDESİ */}
          {showError && (
            <div className="mt-4 border border-rose-950 bg-rose-950/10 p-4 rounded-xs text-rose-500 font-bold">
              <div className="text-[8px] border-b border-rose-900/30 pb-2 mb-2 tracking-widest opacity-50 uppercase font-black">
                DERİN DEHLİZ AKUSTİK BAĞLANTI HATASI // BLOK_D28
              </div>
              <div className="space-y-1">
                {criticalError.map((line, index) => {
                  const text = resolveConfigText(line, language);
                  return (
                    <p
                      key={`${text}-${index}`}
                      className="text-[11px] font-bold tracking-wide text-rose-600 uppercase font-mono flex items-center gap-2 m-0"
                    >
                      <span className="animate-pulse text-xs">🛑</span> TELSİZ_HATA: {text}
                    </p>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SAĞ ALT: Sinyal Takip Modülü Süslemesi */}
      <div className="fixed bottom-6 right-6 hidden sm:flex items-center gap-4 opacity-30 z-30 font-black uppercase">
        <span className={`text-[8px] tracking-[0.25em] font-mono transition-colors duration-500 ${showError ? 'text-rose-700' : 'text-stone-600'}`}>
          {showError ? "SİNYAL_PARAZİT_KAYBI_VERİ_KÖPRÜSÜ_ÇÖKTÜ" : "TELSİZ_REZONANS_KİLİDİ_ARANIYOR_"}
        </span>
        
        <div className="relative w-5 h-5 animate-spin" style={{ animationDuration: showError ? "0.5s" : "4s" }}>
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-1 h-1 rounded-full transition-colors duration-500 ${showError ? 'bg-rose-600' : 'bg-amber-500'}`}
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
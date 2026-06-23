import { useEffect, useState, useRef } from "react";
import { getGameText } from "../i18n/gameText";

function resolveConfigText(value, language = "en", fallback = "") {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    return getGameText(value.textKey, value.text || fallback, language);
  }
  return fallback;
}

export default function RebootConfirmScreen({
  config,
  onRestart,
  language = "en"
}) {
  const [countdown, setCountdown] = useState(config?.countdownSeconds || 10);
  const [isRestarting, setIsRestarting] = useState(false);
  const [glitchTrigger, setGlitchTrigger] = useState(false);
  const [dynamicLogs, setDynamicLogs] = useState([]);

  const canvasRef = useRef(null);
  const audioRef = useRef(null);

  // Dil destekli text tanımlamaları
  const kicker = getGameText(config?.kickerKey, config?.kicker || "CRITICAL MEMORY CORRUPTION // AREA 4", language);
  const title = getGameText(config?.titleKey, config?.title || "COGNITIVE CONTAINMENT BREACHED", language);
  const restartingText = getGameText(config?.restartingTextKey, config?.restartingText || "FORCING NEURAL SYNAPSE RE-IGNITION...", language);
  const countdownLabel = getGameText(config?.countdownLabelKey, config?.countdownLabel || "SYSTEM RE-PURGE SEQUENCE IN", language);
  const buttonLoadingText = getGameText(config?.buttonLoadingTextKey, config?.buttonLoadingText || "RE-IGNITING...", language);
  const buttonText = getGameText(config?.buttonTextKey, config?.buttonText || "FORCE COGNITIVE OVERRIDE", language);

  // 1. Dinamik Nöral Bozulma Efekti (Canvas)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let frame = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      frame++;
      ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const midY = canvas.height / 2;
      // Geri sayım azaldıkça veya yeniden başlatma başladıkça dalga vahşileşir
      const severity = isRestarting ? 45 : (11 - countdown) * 4;

      ctx.beginPath();
      ctx.lineWidth = isRestarting ? 3 : 1.5;
      ctx.strokeStyle = `rgba(239, 68, 68, ${isRestarting ? 0.4 : 0.15})`;

      for (let x = 0; x < canvas.width; x += 5) {
        const noise = Math.sin(x * 0.01 + frame * 0.2) * Math.cos(x * 0.005 - frame * 0.05) * severity;
        const glitch = Math.random() > 0.98 ? (Math.random() - 0.5) * severity * 2 : 0;
        
        if (x === 0) ctx.moveTo(x, midY + noise + glitch);
        else ctx.lineTo(x, midY + noise + glitch);
      }
      ctx.stroke();

      animationFrameId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [countdown, isRestarting]);

  // 2. Rastgele Biyometrik Arıza Logları Akışı
  useEffect(() => {
    if (isRestarting) return;
    const extraLogs = [
      "SYS: Synaptic rejection at 44%",
      "EGO_FRACTURE: Elias core identity de-stabilizing.",
      "THE_ECHO: Resonance proximity anomaly detected.",
      "BIOMED: Adrenaline saturation critical."
    ];

    const logInterval = setInterval(() => {
      if (Math.random() > 0.4) {
        const randomLog = extraLogs[Math.floor(Math.random() * extraLogs.length)];
        setDynamicLogs((prev) => [randomLog, ...prev.slice(0, 2)]);
        setGlitchTrigger(true);
        setTimeout(() => setGlitchTrigger(false), 80);
      }
    }, 2000);

    return () => clearInterval(logInterval);
  }, [isRestarting]);

  // Geri sayım sarsıntısı (Süre azaldıkça sarsıntı artar)
  useEffect(() => {
    setGlitchTrigger(true);
    const duration = isRestarting ? 400 : Math.max(80, countdown * 30);
    const t = setTimeout(() => setGlitchTrigger(false), duration);
    return () => clearTimeout(t);
  }, [countdown, isRestarting]);

  // Geri sayım döngüsü
  useEffect(() => {
    if (isRestarting) return;

    if (countdown <= 0) {
      handleRestart();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, isRestarting]);

  function handleRestart() {
    if (isRestarting) return;
    setIsRestarting(true);
    setGlitchTrigger(true);

    if (audioRef.current) {
      // audioRef.current.src = "/sounds/neural_burst.mp3";
      // audioRef.current.play().catch(() => {});
    }

    setTimeout(() => {
      onRestart();
    }, config?.restartDelayMs || 1500);
  }

  const crtOverlay = (
    <div className="pointer-events-none fixed inset-0 z-50 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.015),rgba(255,255,255,0.015)_2px,transparent_2px,transparent_5px)] opacity-40 shadow-[inset_0_0_80px_rgba(0,0,0,0.9)]" />
  );

  return (
    <main 
      className={[
        "relative grid min-h-dvh place-items-center overflow-hidden bg-black p-4 font-mono select-none text-rose-100",
        isRestarting ? "animate-[screenGlitch_0.08s_infinite]" : glitchTrigger ? "animate-[screenGlitch_0.12s_infinite]" : "animate-[flicker_5s_infinite]"
      ].join(" ")}
    >
      <audio ref={audioRef} />
      
      {/* Canvas Arka Plan Dalgalanması */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-90" />
      {crtOverlay}

      <section 
        className={[
          "relative z-10 w-full max-w-3xl border-2 bg-black/95 p-6 shadow-2xl transition-all duration-500 border-b-4 rounded-t backdrop-blur-xs",
          isRestarting 
            ? "border-amber-600 shadow-[0_0_60px_rgba(245,158,11,0.15)]" 
            : "border-rose-950 shadow-[0_0_50px_rgba(225,29,72,0.06)]"
        ].join(" ")}
      >
        {/* Terminal Üst Bilgi Satırı */}
        <div className="flex items-center justify-between border-b border-rose-950/50 pb-3 mb-5">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
            <p className="text-[10px] tracking-[0.35em] text-rose-500 font-bold uppercase">
              {kicker}
            </p>
          </div>
          <span className="text-[9px] tracking-widest text-rose-700/60 font-bold font-mono">
            HOST_E17_SIGNAL_STABLE_FALSE
          </span>
        </div>

        {/* Ana Tehdit Başlığı */}
        <h1 className="mb-6 text-base tracking-[0.22em] text-rose-500 font-black uppercase sm:text-lg border-l-2 border-rose-600 pl-3">
          {title}
        </h1>

        {/* Klinik Uyarılar & Canlı Simüle Edilen Arıza Logları */}
        <div className="mb-6 border border-rose-950/70 bg-rose-950/5 p-4 space-y-2.5 max-h-[160px] overflow-hidden">
          {(config?.warnings || [
            "WARNING: Host consciousness is rejecting the neural link infrastructure.",
            "CRITICAL: Structural ego-death detected in subject Elias.",
            "PROCEED AT YOUR OWN RISK. LONG-TERM COGNITIVE DAMAGE WILL NOT BE COMPENSATED BY THE CORPORATION."
          ]).map((warning, index) => {
            const warningText = resolveConfigText(warning, language);
            return (
              <p key={`warn-${index}`} className="text-xs leading-relaxed tracking-wide text-rose-300/60 text-justify">
                <span className="text-rose-900 font-bold">&gt;</span> {warningText}
              </p>
            );
          })}

          {/* Canlı Akıcı Loglar */}
          {dynamicLogs.map((log, index) => (
            <p key={`dyn-${index}`} className="text-xs tracking-wide text-rose-500/80 font-bold animate-[bootLineIn_0.1s_ease-out_both]">
              <span className="text-rose-700 font-black">!!</span> {log}
            </p>
          ))}
        </div>

        {/* Geri Sayım / Şok Alanı */}
        <div className="mb-6 border border-rose-950/40 bg-neutral-900/40 p-4 text-xs tracking-[0.2em] text-rose-400/70 flex items-center justify-between rounded">
          {isRestarting ? (
            <span className="text-amber-500 font-black animate-pulse tracking-[0.18em] uppercase flex items-center gap-3">
              <span className="animate-spin text-sm">⚡</span> {restartingText}
            </span>
          ) : (
            <div className="w-full flex items-center justify-between font-mono">
              <span>{countdownLabel}</span>
              <strong className="text-2xl text-rose-500 font-black tracking-normal drop-shadow-[0_0_12px_rgba(244,63,94,0.6)] animate-[errorPulse_0.5s_infinite]">
                {countdown === 3 ? "☠" : countdown === 1 ? "ERR" : countdown}
              </strong>
            </div>
          )}
        </div>

        {/* Override / Re-ignition Butonu */}
        <button
          type="button"
          className={[
            "w-full border-2 py-4.5 text-xs tracking-[0.35em] font-black uppercase transition-all duration-300 rounded",
            isRestarting
              ? "border-amber-600 bg-amber-950/20 text-amber-500 cursor-not-allowed"
              : "border-rose-800/80 bg-rose-950/10 text-rose-400 hover:border-rose-400 hover:bg-rose-600/20 hover:text-white hover:shadow-[0_0_30px_rgba(244,63,94,0.2)] active:scale-[0.995]"
          ].join(" ")}
          onClick={handleRestart}
          disabled={isRestarting}
        >
          {isRestarting ? buttonLoadingText : buttonText}
        </button>
      </section>

      {/* Sağ Alttaki Agresif Spinner Grubu */}
      <div className="fixed bottom-6 right-6 flex items-center gap-4 opacity-40 z-30">
        <span className="text-[9px] tracking-[0.25em] text-rose-600 font-bold uppercase">
          {isRestarting ? "FORCE_SYNAPSE_OVERDRIVE_" : "COGNITIVE_CONTAINMENT_CRIT_"}
        </span>
        <div className="relative w-6 h-6 animate-spin" style={{ animationDuration: isRestarting ? "0.4s" : "3s" }}>
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 bg-rose-500 rounded-full"
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
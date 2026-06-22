import { useCallback, useEffect, useRef, useState } from "react";

// QRS Kalp Atışı Şeması
const BEAT_SHAPE = [
  [0.00, 0.00], [0.10, 0.00],
  [0.16, 0.07], [0.20, 0.11], [0.24, 0.07],
  [0.30, 0.00],
  [0.39, 0.00], [0.42, -0.14], [0.46, 1.00],        // QRS Zirvesi
  [0.50, -0.48], [0.54, 0.00],
  [0.60, 0.00], [0.64, 0.13], [0.68, 0.18], [0.73, 0.13],
  [0.80, 0.00], [1.00, 0.00],
];

const QRS_PEAK_T = 0.46;

function lerp(a, b, t) { return a + (b - a) * t; }

function getY(t) {
  for (let i = 0; i < BEAT_SHAPE.length - 1; i++) {
    const [t0, y0] = BEAT_SHAPE[i];
    const [t1, y1] = BEAT_SHAPE[i + 1];
    if (t >= t0 && t < t1) {
      return lerp(y0, y1, (t - t0) / (t1 - t0));
    }
  }
  return 0;
}

const DIFFICULTY = {
  1: { speedPx: 100, hitWindow: 60, beatSpacing: 500 },
  2: { speedPx: 160, hitWindow: 50, beatSpacing: 460 },
  3: { speedPx: 240, hitWindow: 40, beatSpacing: 420 },
};

function drawEkg(ctx, scroll, W, H, hitX, beatSpacing, hitWindow, inZone, flashCol, currentSide) {
  ctx.clearRect(0, 0, W, H);

  const midY = H * 0.55;
  const amp  = H * 0.38;

  // 1. Arka plan kırmızı gürültü dalgası
  ctx.beginPath();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(185, 28, 28, 0.25)";
  for (let px = 0; px <= W; px += 3) {
    const noise = (Math.sin(px * 0.05 + scroll * 0.02) * Math.cos(px * 0.1)) * (H * 0.12);
    if (px === 0) ctx.moveTo(px, midY + noise);
    else ctx.lineTo(px, midY + noise);
  }
  ctx.stroke();

  // 2. Hit Zone Parlaması (Yeşil)
  if (inZone) {
    const gw = hitWindow * 2.2;
    const grad = ctx.createLinearGradient(hitX - gw, 0, hitX + gw, 0);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(0.5, "rgba(34, 197, 94, 0.18)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(hitX - gw, 0, gw * 2, H);
  }

  if (flashCol) {
    ctx.fillStyle = flashCol;
    ctx.fillRect(0, 0, W, H);
  }

  // Grid çizgileri
  ctx.strokeStyle = "rgba(34,211,238,0.04)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 12; i++) {
    const x = (i / 11) * W;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }

  // 3. Temiz Beyaz Nabız Çizgisi
  ctx.beginPath();
  ctx.lineWidth = 3;
  ctx.strokeStyle = inZone ? "#4ade80" : "#ffffff";
  ctx.shadowColor = inZone ? "#4ade80" : "rgba(255,255,255,0.3)";
  ctx.shadowBlur = inZone ? 12 : 4;

  let started = false;
  for (let px = 0; px <= W; px += 1) {
    const absX = px + scroll;
    const beatPhase = ((absX % beatSpacing) + beatSpacing) % beatSpacing;
    const t = beatPhase / beatSpacing;
    const y = getY(t);
    const py = midY - y * amp;

    if (!started) { ctx.moveTo(px, py); started = true; }
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  // 4. Sabit Dikey Kılavuz Çizgi
  ctx.beginPath();
  ctx.strokeStyle = inZone ? "#4ade80" : "rgba(255, 255, 255, 0.4)";
  ctx.lineWidth = 2;
  ctx.moveTo(hitX, midY - amp * 1.3);
  ctx.lineTo(hitX, midY + amp * 0.8);
  ctx.stroke();

  // 5. 🚀 DİNAMİK YER DEĞİŞTİRME MEKANİZMASI (A ise altta, D ise üstte görünür)
  const sq = 26;
  const bgC = inZone ? "#4ade80" : "rgba(255, 255, 255, 0.9)";
  const txC = "#000000";
  
  // Yön kontrolüne göre dikey pozisyon (sy) hesabı
  const sy = currentSide === "SOL" 
    ? midY + amp * 0.8 + 6               // SOL (A) -> Kılavuz çizginin altı
    : midY - amp * 1.3 - sq - 6;         // SAĞ (D) -> Kılavuz çizginin üstü

  ctx.fillStyle = bgC;
  ctx.fillRect(hitX - sq / 2, sy, sq, sq);
  ctx.fillStyle = txC;
  ctx.font = "bold 13px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(currentSide === "SOL" ? "A" : "D", hitX, sy + sq / 2);
}

export default function BreathControlMinigame({
  difficulty   = 1, 
  hitsNeeded   = 6, // 🚀 İSTEDİĞİN GİBİ BAŞARI SAYISI 6'YA ÇIKARILDI
  echoLabel    = "ECHO YAKIN",
  onSuccess,
  onFail,
}) {
  const cfg = DIFFICULTY[Math.min(3, Math.max(1, difficulty))];

  const [phase, setPhase]         = useState("intro");
  const [hitsLeft, setHitsLeft]   = useState(hitsNeeded);
  const [flashCol, setFlashCol]   = useState(null);
  const [targetSide, setTargetSide] = useState("SOL");
  const [countdown, setCountdown] = useState(5);

  const canvasRef   = useRef(null);
  const phaseRef    = useRef("intro");
  const scrollRef   = useRef(0);
  const inZoneRef   = useRef(false);
  const pressedRef  = useRef(false);
  const hitsRef     = useRef(0);
  const flashRef    = useRef(null);
  const rafRef      = useRef(null);
  const hitX        = useRef(0);
  const sideRef     = useRef("SOL");
  const startTimeRef = useRef(0);

  // hitsNeeded değişirse state'i güncelle
  useEffect(() => {
    setHitsLeft(hitsNeeded);
  }, [hitsNeeded]);

  const stopLoop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const handleMiss = useCallback(() => {
    stopLoop();
    phaseRef.current = "fail";
    setPhase("fail");
    flashRef.current = "rgba(225,29,72,0.3)";
    setFlashCol("rgba(225,29,72,0.3)");
    setTimeout(() => { if (onFail) onFail(); }, 1800);
  }, [onFail, stopLoop]);

  const rollNextSide = useCallback(() => {
    const next = Math.random() < 0.5 ? "SOL" : "SAĞ";
    sideRef.current = next;
    setTargetSide(next);
  }, []);

  const startLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let lastTs = null;
    startTimeRef.current = performance.now();

    const loop = (ts) => {
      if (phaseRef.current !== "playing") return;
      if (!lastTs) lastTs = ts;
      const dt = Math.min((ts - lastTs) / 1000, 0.05);
      lastTs = ts;

      const W = canvas.width  = canvas.offsetWidth;
      const H = canvas.height = canvas.offsetHeight;
      hitX.current = W * 0.25;

      scrollRef.current += cfg.speedPx * dt;

      let inZone = false;
      const S = scrollRef.current;
      const BS = cfg.beatSpacing;
      
      const timeElapsed = ts - startTimeRef.current;
      const isGracePeriod = timeElapsed < 1500;

      for (let i = -2; i < Math.ceil(W / BS) + 2; i++) {
        const peakAbsX = i * BS + QRS_PEAK_T * BS;
        const peakCanvasX = peakAbsX - S;
        
        if (Math.abs(peakCanvasX - hitX.current) <= cfg.hitWindow) {
          inZone = true;

          if (!isGracePeriod && !pressedRef.current && peakCanvasX < hitX.current - cfg.hitWindow) {
            handleMiss();
            return;
          }
          break;
        }
        
        if (pressedRef.current && peakCanvasX < hitX.current - cfg.hitWindow - 40) {
          pressedRef.current = false;
        }

        if (!isGracePeriod && 
            !pressedRef.current &&
            peakCanvasX < hitX.current - cfg.hitWindow - 10 &&
            peakCanvasX > hitX.current - cfg.hitWindow - cfg.speedPx * 0.08) {
          handleMiss();
          return;
        }
      }

      inZoneRef.current = inZone;
      drawEkg(ctx, S, W, H, hitX.current, BS, cfg.hitWindow, inZone, flashRef.current, sideRef.current);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
  }, [cfg, handleMiss]);

  const handleHit = useCallback(() => {
    hitsRef.current += 1;
    pressedRef.current = true;

    const newLeft = hitsNeeded - hitsRef.current;
    setHitsLeft(newLeft);

    flashRef.current = "rgba(74, 222, 128, 0.15)";
    setTimeout(() => { flashRef.current = null; }, 200);

    if (newLeft <= 0) {
      stopLoop();
      phaseRef.current = "success";
      setPhase("success");
      setTimeout(() => { if (onSuccess) onSuccess(); }, 1200);
    } else {
      rollNextSide();
    }
  }, [hitsNeeded, onSuccess, stopLoop, rollNextSide]);

  const triggerGameStart = useCallback(() => {
    phaseRef.current = "playing";
    setPhase("playing");
    hitsRef.current = 0;
    pressedRef.current = false;
    scrollRef.current = -250; 
    rollNextSide();
    startLoop();
  }, [startLoop, rollNextSide]);

  const executeAction = useCallback((side) => {
    if (phaseRef.current === "intro") return; 
    if (phaseRef.current !== "playing" || pressedRef.current) return;

    if (inZoneRef.current && side === sideRef.current) {
      handleHit();
    } else {
      handleMiss();
    }
  }, [handleHit, handleMiss]);

  useEffect(() => {
    if (phase !== "intro") return;

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          triggerGameStart();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [phase, triggerGameStart]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") {
        e.preventDefault(); executeAction("SOL");
      }
      if (e.code === "ArrowRight" || e.code === "KeyD") {
        e.preventDefault(); executeAction("SAĞ");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [executeAction]);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-between select-none font-mono p-6"
      style={{ background: "rgba(10, 10, 12, 0.96)", touchAction: "none" }}
    >
      <div className="pointer-events-none absolute inset-0 z-10 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.005),rgba(255,255,255,0.005)_1px,transparent_1px,transparent_4px)]" />

      {phase === "fail" && (
        <div className="absolute inset-0 z-30 bg-rose-950/40 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
          <span className="text-rose-500 text-4xl animate-ping">⚠</span>
          <p className="text-rose-400 text-xs tracking-[0.4em] font-bold mt-2">İLETİM KESİLDİ // ADRENALINE COLLAPSE</p>
        </div>
      )}

      {phase === "success" && (
        <div className="absolute inset-0 z-30 bg-emerald-950/40 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
          <span className="text-emerald-400 text-4xl">✓</span>
          <p className="text-emerald-400 text-xs tracking-[0.4em] font-bold">NABIZ STABİLİZASYONU BAŞARILI</p>
        </div>
      )}

      {/* ÜST PANEL: Can barları 6 adıma göre senkronize çizilir */}
      <div className="relative z-20 w-full max-w-xl flex items-center justify-between border-b border-neutral-900 pb-4 pt-4">
        <div className="text-left">
          <h2 className="text-white text-xs tracking-[0.3em] font-black uppercase m-0">ADRENALINE RUSH (TEST MODU)</h2>
          <span className="text-rose-500 text-[9px] tracking-widest mt-1 block animate-pulse">{echoLabel}</span>
        </div>
        
        {phase === "playing" && (
          <div className="bg-neutral-900 border border-neutral-800 px-3 py-1.5 text-cyan-400 text-[10px] font-bold tracking-[0.2em]">
            İSTENEN TUŞ: <span className="text-white underline">{targetSide === "SOL" ? "A" : "D"}</span>
          </div>
        )}

        <div className="flex gap-1.5">
          {Array.from({ length: hitsNeeded }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-1.5 transform skew-x-12 transition-colors duration-300 ${
                i < hitsNeeded - hitsLeft ? "bg-green-500 shadow-[0_0_8px_#4ade80]" : "bg-neutral-800"
              }`}
            />
          ))}
        </div>
      </div>

      {/* ORTA PANEL */}
      <div className="w-full max-w-xl flex flex-col items-center justify-center my-auto">
        {phase === "intro" && (
          <div className="text-center mb-6">
            <p className="text-neutral-400 text-[11px] tracking-[0.35em] font-bold uppercase mb-2">PULSE SYNC REQUIRED</p>
            <p className="text-rose-500 font-bold text-[10px] tracking-[0.18em] uppercase animate-pulse">
              KALİBRASYON BAŞLIYOR: <span className="text-white font-mono text-sm underline">{countdown}s</span>
            </p>
          </div>
        )}

        <div className="relative w-full border border-neutral-900 bg-neutral-950 shadow-2xl" style={{ height: 140 }}>
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ display: "block" }} />
        </div>
      </div>

      {/* ALT PANEL */}
      <div className="relative z-20 w-full max-w-xl grid grid-cols-2 gap-4 pb-4">
        <button
          type="button"
          disabled={phase === "intro"}
          onClick={() => executeAction("SOL")}
          className="border p-4 font-mono text-xs font-bold tracking-[0.2em] transition-all disabled:opacity-10 border-neutral-800 text-neutral-500 bg-neutral-900/10 hover:text-neutral-300"
        >
          [A] SOL ENJEKSİYON
        </button>

        <button
          type="button"
          disabled={phase === "intro"}
          onClick={() => executeAction("SAĞ")}
          className="border p-4 font-mono text-xs font-bold tracking-[0.2em] transition-all disabled:opacity-10 border-neutral-800 text-neutral-500 bg-neutral-900/10 hover:text-neutral-300"
        >
          [D] SAĞ ENJEKSİYON
        </button>
      </div>
    </div>
  );
}
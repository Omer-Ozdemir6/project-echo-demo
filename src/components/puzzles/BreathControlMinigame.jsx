import { useCallback, useEffect, useRef, useState } from "react";

const DIFFICULTY = {
  1: { speedPx: 120, hitWindow: 40, spawnInterval: 2200 }, // Yavaş akış
  2: { speedPx: 180, hitWindow: 35, spawnInterval: 1600 }, // Orta akış
  3: { speedPx: 260, hitWindow: 28, spawnInterval: 1100 }, // Hızlı akış
};

export default function BreathControlMinigame({
  difficulty   = 1, 
  hitsNeeded   = 6, 
  echoLabel    = "ECHO_PROXIMITY_ALERT",
  onSuccess,
  onFail,
}) {
  const cfg = DIFFICULTY[Math.min(3, Math.max(1, difficulty))];

  const [phase, setPhase]         = useState("intro");
  const [hitsLeft, setHitsLeft]   = useState(hitsNeeded);
  const [flashCol, setFlashCol]   = useState(null);
  const [countdown, setCountdown] = useState(5);
  // 🚀 REVIZE: State render yükünü azaltmak için ekranda sadece o an basılması gereken tuş kılavuzunu tutuyoruz
  const [requiredKey, setRequiredKey] = useState("-");

  const canvasRef   = useRef(null);
  const phaseRef    = useRef("intro");
  const hitsRef     = useRef(0);
  const flashRef    = useRef(null);
  const rafRef      = useRef(null);
  
  const nodesRef     = useRef([]); 
  const lastSpawnRef = useRef(0);

  useEffect(() => {
    setHitsLeft(hitsNeeded);
    hitsRef.current = 0;
  }, [hitsNeeded]);

  const stopLoop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const handleMiss = useCallback(() => {
    stopLoop();
    phaseRef.current = "fail";
    setPhase("fail");
    flashRef.current = "rgba(225,29,72,0.35)";
    setFlashCol("rgba(225,29,72,0.35)");
    setTimeout(() => { if (onFail) onFail(); }, 1800);
  }, [onFail, stopLoop]);

  const handleHit = useCallback(() => {
    hitsRef.current += 1;
    const newLeft = hitsNeeded - hitsRef.current;
    setHitsLeft(newLeft);

    flashRef.current = "rgba(52, 211, 153, 0.15)";
    setFlashCol("rgba(52, 211, 153, 0.15)");
    
    setTimeout(() => { 
      flashRef.current = null; 
      setFlashCol(null);
    }, 120);

    if (newLeft <= 0) {
      stopLoop();
      phaseRef.current = "success";
      setPhase("success");
      setTimeout(() => { if (onSuccess) onSuccess(); }, 1200);
    }
  }, [hitsNeeded, onSuccess, stopLoop]);

  // Döngü (Game Loop)
  const startLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let lastTs = performance.now();
    lastSpawnRef.current = performance.now();

    const loop = (ts) => {
      if (phaseRef.current !== "playing") return;
      const dt = Math.min((ts - lastTs) / 1000, 0.05);
      lastTs = ts;

      const W = canvas.width  = canvas.offsetWidth;
      const H = canvas.height = canvas.offsetHeight;
      
      const hitX = W * 0.20; 
      const midY = H * 0.5;

      // 1. Kutuları Oluşturma (Spawn)
      if (ts - lastSpawnRef.current > cfg.spawnInterval) {
        const side = Math.random() < 0.5 ? "A" : "D";
        nodesRef.current.push({
          x: W + 30,
          side,
          hitProcessed: false
        });
        lastSpawnRef.current = ts;
      }

      ctx.clearRect(0, 0, W, H);

      // Klinik Bilişsel Arka Plan Sinyal Çizgisi
      ctx.beginPath();
      ctx.strokeStyle = "rgba(245, 158, 11, 0.08)";
      ctx.lineWidth = 1;
      ctx.moveTo(0, midY); ctx.lineTo(W, midY);
      ctx.stroke();

      if (flashRef.current) {
        ctx.fillStyle = flashRef.current;
        ctx.fillRect(0, 0, W, H);
      }

      // 2. Sabit Sol Hedef Çizgisi (Neon Klinik Cyan Görünüm)
      ctx.beginPath();
      ctx.strokeStyle = "rgba(34, 211, 238, 0.4)";
      ctx.lineWidth = 2;
      ctx.moveTo(hitX, 10);
      ctx.lineTo(hitX, H - 10);
      ctx.stroke();

      // 3. Kutuları Güncelle ve Çiz
      let closestNode = null;

      for (let i = 0; i < nodesRef.current.length; i++) {
        const node = nodesRef.current[i];
        node.x -= cfg.speedPx * dt;

        // Hedef alanına giren veya yaklaşan en yakın aktif düğümü bul
        if (!node.hitProcessed && node.x > hitX - cfg.hitWindow) {
          if (!closestNode || node.x < closestNode.x) {
            closestNode = node;
          }
        }

        // 🚀 CRITICAL FIX: Sadece hedef alanını ıskalayıp geçen kutular cezalandırılır
        if (!node.hitProcessed && node.x < hitX - cfg.hitWindow - 5) {
          handleMiss();
          return;
        }

        // Kutuları Çiz (Steril Klinik Hücre Blokları)
        const size = 28;
        const isNearZone = Math.abs(node.x - hitX) <= cfg.hitWindow;

        ctx.fillStyle = isNearZone ? "rgba(52, 211, 153, 0.9)" : "rgba(34, 211, 238, 0.25)";
        ctx.strokeStyle = isNearZone ? "#4ade80" : "rgba(34, 211, 238, 0.6)";
        ctx.lineWidth = 1.5;
        
        const boxY = node.side === "A" ? midY - 32 : midY + 4;
        
        ctx.fillRect(node.x - size / 2, boxY, size, size);
        ctx.strokeRect(node.x - size / 2, boxY, size, size);

        // İçindeki Yazı (A veya D)
        ctx.fillStyle = isNearZone ? "#000000" : "#ffffff";
        ctx.font = "bold 12px font-mono";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(node.side, node.x, boxY + size / 2);
      }

      // 🚀 REVIZE: Frame başı gereksiz state render tetiklenmesini engelliyoruz
      const currentKeyToDisplay = closestNode ? closestNode.side : "-";
      setRequiredKey(currentKeyToDisplay);

      // Ekrandan çıkan kutuları temizle
      nodesRef.current = nodesRef.current.filter(n => n.x > -40);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
  }, [cfg, handleMiss]);

  // Tuşa basıldığında tetiklenen mekanik
  const executeAction = useCallback((key) => {
    if (phaseRef.current !== "playing") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const hitX = canvas.width * 0.20;

    // Hedef penceresindeki en yakın eşleşen kutuyu bul
    const validNode = nodesRef.current.find(
      (node) => !node.hitProcessed && Math.abs(node.x - hitX) <= cfg.hitWindow
    );

    if (validNode && validNode.side === key) {
      validNode.hitProcessed = true;
      nodesRef.current = nodesRef.current.filter(n => n !== validNode);
      handleHit();
    } else {
      // Oyuncu boşluğa bastıysa veya yanlış tuşa bastıysa ritim bozulur
      handleMiss();
    }
  }, [cfg, handleHit, handleMiss]);

  useEffect(() => {
    if (phase !== "intro") return;

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          phaseRef.current = "playing";
          setPhase("playing");
          startLoop();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [phase, startLoop]);

  useEffect(() => {
    const onKey = (e) => {
      if (phaseRef.current !== "playing") return;
      if (e.code === "KeyA" || e.code === "ArrowLeft") {
        e.preventDefault(); executeAction("A");
      }
      if (e.code === "KeyD" || e.code === "ArrowRight") {
        e.preventDefault(); executeAction("D");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [executeAction]);

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-between select-none font-mono p-6 bg-black/95 backdrop-blur-xs"
      style={{ touchAction: "none" }}
    >
      <div className="pointer-events-none absolute inset-0 z-10 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.005),rgba(255,255,255,0.005)_1px,transparent_1px,transparent_4px)] opacity-40" />

      {phase === "fail" && (
        <div className="absolute inset-0 z-30 bg-rose-950/40 backdrop-blur-xs flex flex-col items-center justify-center gap-2">
          <span className="text-rose-500 text-3xl animate-pulse">⚠</span>
          <p className="text-rose-400 text-xs tracking-[0.35em] font-black mt-2">RESPIRATION_SYNCHRONIZATION_FAILED</p>
        </div>
      )}

      {phase === "success" && (
        <div className="absolute inset-0 z-30 bg-emerald-950/40 backdrop-blur-xs flex flex-col items-center justify-center gap-2">
          <span className="text-emerald-400 text-3xl">✓</span>
          <p className="text-emerald-400 text-xs tracking-[0.35em] font-black">NEURAL_STABILIZATION_ONLINE</p>
        </div>
      )}

      {/* ÜST HUD PANELİ */}
      <div className="relative z-20 w-full max-w-xl flex items-center justify-between border-b border-neutral-900 pb-4 pt-2 text-[10px]">
        <div className="text-left">
          <h2 className="text-neutral-400 text-[10px] tracking-[0.3em] font-black uppercase m-0">NEURAL_RESPIRATION_LOCK</h2>
          <span className="text-rose-500 text-[9px] tracking-widest mt-1.5 block font-bold animate-pulse">{echoLabel}</span>
        </div>
        
        {phase === "playing" && (
          <div className="bg-neutral-950 border border-neutral-900 px-3 py-1.5 text-cyan-400 font-bold tracking-[0.2em] rounded-xs">
            NEXT_NODE: <span className="text-white underline font-mono font-black ml-1">{requiredKey}</span>
          </div>
        )}

        <div className="flex gap-1">
          {Array.from({ length: hitsNeeded }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-2 transition-all duration-300 rounded-xs ${
                i < hitsNeeded - hitsLeft ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-neutral-900 border border-neutral-800"
              }`}
            />
          ))}
        </div>
      </div>

      {/* MERKEZ GRAPHIC CANVAS */}
      <div className="w-full max-w-xl flex flex-col items-center justify-center my-auto">
        {phase === "intro" && (
          <div className="text-center mb-6">
            <p className="text-neutral-500 text-[9px] tracking-[0.4em] font-black uppercase mb-1">COGNITIVE_PULSE_CALIBRATION</p>
            <p className="text-amber-500 font-bold text-[10px] tracking-[0.2em] uppercase animate-pulse">
              INTEGRATION_IN: <span className="text-white font-mono text-xs underline font-black">{countdown}S</span>
            </p>
          </div>
        )}

        <div className="relative w-full border border-neutral-900 bg-neutral-950 shadow-2xl rounded-xs" style={{ height: 140 }}>
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ display: "block" }} />
        </div>
      </div>

      {/* ALT PANEL (KLİNİK BUTONLAR) */}
      <div className="relative z-20 w-full max-w-xl grid grid-cols-2 gap-4 pb-2">
        <button
          type="button"
          disabled={phase !== "playing"}
          onClick={() => executeAction("A")}
          className="border py-4 font-mono text-[10px] font-black tracking-[0.2em] transition-all disabled:opacity-5 border-neutral-900 text-neutral-400 bg-neutral-950 hover:text-cyan-300 hover:border-cyan-950 active:bg-neutral-900 rounded-sm"
        >
          [A] COMPRESS_LEFT
        </button>

        <button
          type="button"
          disabled={phase !== "playing"}
          onClick={() => executeAction("D")}
          className="border py-4 font-mono text-[10px] font-black tracking-[0.2em] transition-all disabled:opacity-5 border-neutral-900 text-neutral-400 bg-neutral-950 hover:text-cyan-300 hover:border-cyan-950 active:bg-neutral-900 rounded-sm"
        >
          [D] COMPRESS_RIGHT
        </button>
      </div>
    </div>
  );
}
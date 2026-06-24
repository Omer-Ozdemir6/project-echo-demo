import { useCallback, useEffect, useRef, useState } from "react";

const DIFFICULTY = {
  1: { speedPx: 120, hitWindow: 40, spawnInterval: 2200 }, // Sakin nabız akışı
  2: { speedPx: 180, hitWindow: 35, spawnInterval: 1600 }, // Gergin nabız akışı
  3: { speedPx: 260, hitWindow: 28, spawnInterval: 1100 }, // Panik rezonans akışı
};

export default function BreathControlMinigame({
  difficulty   = 1, 
  hitsNeeded   = 6, 
  echoLabel    = "KARALTI_YAKINLIK_UYARISI",
  onSuccess,
  onFail,
}) {
  const cfg = DIFFICULTY[Math.min(3, Math.max(1, difficulty))];

  const [phase, setPhase]         = useState("intro");
  const [hitsLeft, setHitsLeft]   = useState(hitsNeeded);
  const [flashCol, setFlashCol]   = useState(null);
  const [countdown, setCountdown] = useState(5);
  const [requiredWave, setRequiredWave] = useState("-");

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
    phaseRef.current = "intro";
    setPhase("intro");
  }, [hitsNeeded]);

  const stopLoop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const handleMiss = useCallback(() => {
    // Eğer zaten başarı fazına geçildiyse arkadan gelen karelerin hata fırlatmasını engelle
    if (phaseRef.current === "success" || phaseRef.current === "fail") return;

    stopLoop();
    phaseRef.current = "fail";
    setPhase("fail");
    flashRef.current = "rgba(225,29,72,0.35)";
    setFlashCol("rgba(225,29,72,0.35)");
    setTimeout(() => { if (onFail) onFail(); }, 1800);
  }, [onFail, stopLoop]);

  const handleHit = useCallback(() => {
    if (phaseRef.current === "success" || phaseRef.current === "fail") return;

    hitsRef.current += 1;
    const newLeft = hitsNeeded - hitsRef.current;
    setHitsLeft(newLeft);

    flashRef.current = "rgba(245, 158, 11, 0.15)";
    setFlashCol("rgba(245, 158, 11, 0.15)");
    
    setTimeout(() => { 
      flashRef.current = null; 
      setFlashCol(null);
    }, 120);

    // 🚀 CRITICAL FIX: Kazanma durumunda fazı anında kilitliyoruz ki loop handleMiss tetikleyemesin
    if (newLeft <= 0) {
      phaseRef.current = "success"; 
      setPhase("success");
      stopLoop();
      setTimeout(() => { if (onSuccess) onSuccess(); }, 1200);
    }
  }, [hitsNeeded, onSuccess, stopLoop]);

  // Sismik Nabız Döngüsü (Game Loop)
  const startLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let lastTs = performance.now();
    lastSpawnRef.current = performance.now();

    const loop = (ts) => {
      // Başarı durumuna geçildiyse döngüyü anında kır, aşağısını hesaplama
      if (phaseRef.current !== "playing") return;

      const dt = Math.min((ts - lastTs) / 1000, 0.05);
      lastTs = ts;

      const W = canvas.width  = canvas.offsetWidth;
      const H = canvas.height = canvas.offsetHeight;
      
      const hitX = W * 0.25; 
      const midY = H * 0.5;

      // 1. Kalp Atış Dalgalarını Oluşturma (Spawn)
      if (ts - lastSpawnRef.current > cfg.spawnInterval) {
        const side = Math.random() < 0.5 ? "A" : "D"; 
        nodesRef.current.push({
          x: W + 40,
          side,
          hitProcessed: false
        });
        lastSpawnRef.current = ts;
      }

      ctx.clearRect(0, 0, W, H);

      // Sığınak Arka Plan Statik Kılavuz Çizgisi
      ctx.beginPath();
      ctx.strokeStyle = "rgba(120, 113, 108, 0.15)";
      ctx.lineWidth = 1;
      ctx.moveTo(0, midY); ctx.lineTo(W, midY);
      ctx.stroke();

      if (flashRef.current) {
        ctx.fillStyle = flashRef.current;
        ctx.fillRect(0, 0, W, H);
      }

      // Analog Hizalama Çizgisi (Kehribar Rezonans Hattı)
      ctx.beginPath();
      ctx.strokeStyle = "rgba(245, 158, 11, 0.5)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.moveTo(hitX, 10);
      ctx.lineTo(hitX, H - 10);
      ctx.stroke();
      ctx.setLineDash([]);

      // 2. Kalp Ritmini Güncelle ve Çiz
      let closestNode = null;

      for (let i = 0; i < nodesRef.current.length; i++) {
        const node = nodesRef.current[i];
        node.x -= cfg.speedPx * dt;

        if (!node.hitProcessed && node.x > hitX - cfg.hitWindow) {
          if (!closestNode || node.x < closestNode.x) {
            closestNode = node;
          }
        }

        // 🚀 CRITICAL REVIZE: Eğer oyun zaten bittiyse (success) kaçan dalgaya ceza kesme
        if (!node.hitProcessed && node.x < hitX - cfg.hitWindow - 5) {
          if (phaseRef.current === "playing") {
            handleMiss();
            return;
          }
        }

        const isNearZone = Math.abs(node.x - hitX) <= cfg.hitWindow;
        ctx.strokeStyle = isNearZone ? "#f59e0b" : "rgba(120, 113, 108, 0.5)";
        ctx.lineWidth = isNearZone ? 2.5 : 1.5;
        ctx.beginPath();

        if (node.side === "A") {
          ctx.moveTo(node.x - 25, midY);
          ctx.lineTo(node.x - 10, midY);
          ctx.lineTo(node.x - 5, midY - 25);
          ctx.lineTo(node.x, midY + 15);
          ctx.lineTo(node.x + 5, midY - 5);
          ctx.lineTo(node.x + 10, midY);
          ctx.lineTo(node.x + 25, midY);
        } else {
          ctx.moveTo(node.x - 25, midY);
          ctx.lineTo(node.x - 10, midY);
          ctx.lineTo(node.x - 5, midY + 25);
          ctx.lineTo(node.x, midY - 15);
          ctx.lineTo(node.x + 5, midY + 5);
          ctx.lineTo(node.x + 10, midY);
          ctx.lineTo(node.x + 25, midY);
        }
        ctx.stroke();

        ctx.fillStyle = isNearZone ? "#f59e0b" : "#78716c";
        ctx.font = "bold 9px monospace";
        const textY = node.side === "A" ? midY - 35 : midY + 38;
        ctx.fillText(node.side === "A" ? "🜁 [SOL]" : "🜃 [SAĞ]", node.x, textY);
      }

      const currentWaveDisplay = closestNode 
        ? (closestNode.side === "A" ? "🜁 P_DALGASI" : "🜃 T_DALGASI") 
        : "-";
      setRequiredWave(currentWaveDisplay);

      nodesRef.current = nodesRef.current.filter(n => n.x > -50);
      
      if (phaseRef.current === "playing") {
        rafRef.current = requestAnimationFrame(loop);
      }
    };

    rafRef.current = requestAnimationFrame(loop);
  }, [cfg, handleMiss]);

  const executeAction = useCallback((key) => {
    if (phaseRef.current !== "playing") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const hitX = canvas.width * 0.25;

    const validNode = nodesRef.current.find(
      (node) => !node.hitProcessed && node.side === key && Math.abs(node.x - hitX) <= cfg.hitWindow
    );

    if (validNode) {
      validNode.hitProcessed = true;
      nodesRef.current = nodesRef.current.filter(n => n !== validNode);
      handleHit();
    } else {
      handleMiss();
    }
  }, [cfg.hitWindow, handleHit, handleMiss]);

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
      <div className="pointer-events-none absolute inset-0 z-10 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.005),rgba(255,255,255,0.005)_1px,transparent_1px,transparent_4px)] opacity-25" />

      {phase === "fail" && (
        <div className="absolute inset-0 z-30 bg-rose-950/40 backdrop-blur-xs flex flex-col items-center justify-center gap-2">
          <span className="text-rose-600 text-3xl animate-ping">⚠️</span>
          <p className="text-rose-600 text-xs tracking-[0.3em] font-black mt-4 uppercase">// SOLUNUM_REZONANS_KAYBI_KAŞİF_TESPİT_EDİLDİ</p>
        </div>
      )}

      {phase === "success" && (
        <div className="absolute inset-0 z-30 bg-neutral-950/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2">
          <span className="text-amber-500 text-2xl animate-pulse">✓</span>
          <p className="text-amber-500 text-xs tracking-[0.3em] font-black uppercase">// FREKANS_STABİLİZASYONU_SAĞLANDI_TEHLİKE_GECTİ</p>
        </div>
      )}

      <div className="relative z-20 w-full max-w-xl flex items-center justify-between border-b border-stone-900 pb-4 pt-2 text-[10px]">
        <div className="text-left">
          <h2 className="text-stone-500 text-[10px] tracking-[0.25em] font-black uppercase m-0">TELSİZ KÖPRÜSÜ // NEFES KİLİTLEME</h2>
          <span className="text-rose-700 text-[9px] tracking-widest mt-1.5 block font-black uppercase animate-pulse">{echoLabel}</span>
        </div>
        
        {phase === "playing" && (
          <div className="bg-neutral-950 border border-stone-900 px-3 py-1.5 text-amber-600 text-[9px] font-black tracking-widest uppercase rounded-xs">
            YAKLAŞAN_NABIZ: <span className="text-stone-200 font-mono font-bold ml-1">{requiredWave}</span>
          </div>
        )}

        <div className="flex gap-1.5">
          {Array.from({ length: hitsNeeded }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-2 transition-all duration-300 rounded-2xs ${
                i < hitsNeeded - hitsLeft ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" : "bg-stone-950 border border-stone-900"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="w-full max-w-xl flex flex-col items-center justify-center my-auto">
        {phase === "intro" && (
          <div className="text-center mb-6">
            <p className="text-stone-600 text-[9px] tracking-[0.3em] font-black uppercase mb-1">AKUSTİK_NABIZ_KALİBRASYONU</p>
            <p className="text-amber-600/80 font-bold text-[10px] tracking-[0.18em] uppercase animate-pulse">
              SENKRONİZASYON_BAŞLANGICI: <span className="text-stone-200 font-mono text-xs underline font-black">{countdown}S</span>
            </p>
          </div>
        )}

        <div className="relative w-full border border-stone-900 bg-black shadow-2xl rounded-xs" style={{ height: 160 }}>
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ display: "block" }} />
        </div>
      </div>

      <div className="relative z-20 w-full max-w-xl grid grid-cols-2 gap-4 pb-2 font-mono">
        <button
          type="button"
          disabled={phase !== "playing"}
          onClick={() => executeAction("A")}
          className="border py-4 text-[10px] font-black tracking-[0.2em] transition-all disabled:opacity-5 border-stone-900 text-stone-500 bg-stone-950/40 hover:text-amber-500 hover:border-amber-900/60 rounded-xs uppercase"
        >
          [A] 🜁 SOL_DENGELİ
        </button>

        <button
          type="button"
          disabled={phase !== "playing"}
          onClick={() => executeAction("D")}
          className="border py-4 text-[10px] font-black tracking-[0.2em] transition-all disabled:opacity-5 border-stone-900 text-stone-500 bg-stone-950/40 hover:text-amber-500 hover:border-amber-900/60 rounded-xs uppercase"
        >
          [D] 🜃 SAĞ_DENGELİ
        </button>
      </div>
    </div>
  );
}
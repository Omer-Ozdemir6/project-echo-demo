import { useCallback, useEffect, useRef, useState } from "react";

const DIFFICULTY = {
  1: { speedPx: 120, hitWindow: 35, spawnInterval: 2200 }, // Yavaş akış
  2: { speedPx: 180, hitWindow: 30, spawnInterval: 1600 }, // Orta akış
  3: { speedPx: 260, hitWindow: 25, spawnInterval: 1100 }, // Hızlı akış
};

export default function BreathControlMinigame({
  difficulty   = 1, 
  hitsNeeded   = 6, 
  echoLabel    = "ECHO YAKIN",
  onSuccess,
  onFail,
}) {
  const cfg = DIFFICULTY[Math.min(3, Math.max(1, difficulty))];

  const [phase, setPhase]         = useState("intro");
  const [hitsLeft, setHitsLeft]   = useState(hitsNeeded);
  const [flashCol, setFlashCol]   = useState(null);
  const [countdown, setCountdown] = useState(5);
  const [currentRequiredKey, setCurrentRequiredKey] = useState("-");

  const canvasRef   = useRef(null);
  const phaseRef    = useRef("intro");
  const hitsRef     = useRef(0);
  const flashRef    = useRef(null);
  const rafRef      = useRef(null);
  
  // Ritim oyunlarında kutuları (node'ları) tutan dizi
  const nodesRef    = useRef([]); 
  const lastSpawnRef = useRef(0);

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
    flashRef.current = "rgba(225,29,72,0.4)";
    setFlashCol("rgba(225,29,72,0.4)");
    setTimeout(() => { if (onFail) onFail(); }, 1800);
  }, [onFail, stopLoop]);

  const handleHit = useCallback(() => {
    hitsRef.current += 1;
    const newLeft = hitsNeeded - hitsRef.current;
    setHitsLeft(newLeft);

    flashRef.current = "rgba(74, 222, 128, 0.2)";
    setFlashCol("rgba(74, 222, 128, 0.2)");
    setTimeout(() => { 
      flashRef.current = null; 
      setFlashCol(null);
    }, 150);

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
      
      // Hedef Çizgisi Sol tarafta sabit (Genişliğin %20'sinde)
      const hitX = W * 0.20; 
      const midY = H * 0.5;

      // 1. Kutuları Oluşturma (Spawn) — Belirli aralıklarla sağdan doğarlar
      if (ts - lastSpawnRef.current > cfg.spawnInterval) {
        const side = Math.random() < 0.5 ? "A" : "D";
        nodesRef.current.push({
          x: W + 30, // Ekranın tamamen sağından başlar
          side,
          hitProcessed: false
        });
        lastSpawnRef.current = ts;
      }

      // Arka planı temizle
      ctx.clearRect(0, 0, W, H);

      // Kırmızı Arka Plan Sinyal Çizgisi (Statik Dehşet Efekti)
      ctx.beginPath();
      ctx.strokeStyle = "rgba(185, 28, 28, 0.15)";
      ctx.lineWidth = 1;
      ctx.moveTo(0, midY); ctx.lineTo(W, midY);
      ctx.stroke();

      // Flaş Efekti Kontrolü
      if (flashRef.current) {
        ctx.fillStyle = flashRef.current;
        ctx.fillRect(0, 0, W, H);
      }

      // 2. Sabit Sol Hedef Çizgisini Çiz (Kutular buraya gelmeli)
      ctx.beginPath();
      ctx.strokeStyle = "rgba(34, 211, 238, 0.5)";
      ctx.lineWidth = 3;
      ctx.moveTo(hitX, 15);
      ctx.lineTo(hitX, H - 15);
      ctx.stroke();

      // Hedef çizgisine neon parlama
      ctx.shadowColor = "rgba(34, 211, 238, 0.4)";
      ctx.shadowBlur = 8;

      // 3. Kutuları Güncelle ve Çiz (Sağdan Sola Hareket)
      let currentKeyToDisplay = "-";
      let closestNode = null;

      for (let i = 0; i < nodesRef.current.length; i++) {
        const node = nodesRef.current[i];
        
        // Kutuyu sola doğru kaydırıyoruz
        node.x -= cfg.speedPx * dt;

        // Hedef çizgisine en yakın ve henüz basılmamış kutuyu bul
        if (!node.hitProcessed && node.x > hitX - cfg.hitWindow) {
          if (!closestNode || node.x < closestNode.x) {
            closestNode = node;
          }
        }

        // Eğer kutu basılmadan hedef alanını çok fazla geçerse -> MISS (Kaçırdın)
        if (!node.hitProcessed && node.x < hitX - cfg.hitWindow - 10) {
          handleMiss();
          return;
        }

        // Kutuyu Çiz (Beyaz Kutu)
        const size = 32;
        const isNearZone = Math.abs(node.x - hitX) <= cfg.hitWindow;

        ctx.fillStyle = isNearZone ? "#4ade80" : "rgba(255, 255, 255, 0.9)";
        ctx.shadowColor = isNearZone ? "#4ade80" : "transparent";
        ctx.shadowBlur = isNearZone ? 10 : 0;
        
        // Kutunun dikey pozisyonu A veya D olmasına göre hafif değişebilir ya da merkezde kalır
        const boxY = node.side === "A" ? midY - 35 : midY + 5;
        
        ctx.fillRect(node.x - size / 2, boxY, size, size);

        // İçindeki Yazı (A veya D)
        ctx.fillStyle = "#000000";
        ctx.shadowBlur = 0;
        ctx.font = "bold 14px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(node.side, node.x, boxY + size / 2);
      }

      // Ekrana basılması gereken aktif tuşu güncelle
      if (closestNode) {
        currentKeyToDisplay = closestNode.side;
      }
      if (currentRequiredKey !== currentKeyToDisplay) {
        setCurrentRequiredKey(currentKeyToDisplay);
      }

      // Ekrandan çıkan kutuları temizle
      nodesRef.current = nodesRef.current.filter(n => n.x > -50);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
  }, [cfg, handleMiss, currentRequiredKey]);

  // Tuşa basıldığında tetiklenen mekanik
  const executeAction = useCallback((key) => {
    if (phaseRef.current !== "playing") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const hitX = canvas.width * 0.20;

    // Hedef penceresindeki en yakın kutuyu bul
    const validNode = nodesRef.current.find(
      (node) => !node.hitProcessed && Math.abs(node.x - hitX) <= cfg.hitWindow
    );

    if (validNode && validNode.side === key) {
      validNode.hitProcessed = true;
      // Basılan kutuyu diziden hemen kaldıralım ki çift tetiklenmesin
      nodesRef.current = nodesRef.current.filter(n => n !== validNode);
      handleHit();
    } else {
      // Yanlış tuş veya yanlış zamanlama -> FAIL
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
      className="fixed inset-0 z-[200] flex flex-col items-center justify-between select-none font-mono p-6"
      style={{ background: "rgba(10, 10, 12, 0.98)", touchAction: "none" }}
    >
      <div className="pointer-events-none absolute inset-0 z-10 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.005),rgba(255,255,255,0.005)_1px,transparent_1px,transparent_4px)]" />

      {phase === "fail" && (
        <div className="absolute inset-0 z-30 bg-rose-950/50 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
          <span className="text-rose-500 text-4xl animate-ping">⚠</span>
          <p className="text-rose-400 text-xs tracking-[0.4em] font-bold mt-2">İLETİM KESİLDİ // ADRENALINE COLLAPSE</p>
        </div>
      )}

      {phase === "success" && (
        <div className="absolute inset-0 z-30 bg-emerald-950/50 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
          <span className="text-emerald-400 text-4xl">✓</span>
          <p className="text-emerald-400 text-xs tracking-[0.4em] font-bold">NABIZ STABİLİZASYONU BAŞARILI</p>
        </div>
      )}

      {/* ÜST PANEL */}
      <div className="relative z-20 w-full max-w-xl flex items-center justify-between border-b border-neutral-900 pb-4 pt-4">
        <div className="text-left">
          <h2 className="text-white text-xs tracking-[0.3em] font-black uppercase m-0">RHYTHM SYNC MOTOR</h2>
          <span className="text-rose-500 text-[9px] tracking-widest mt-1 block animate-pulse">{echoLabel}</span>
        </div>
        
        {phase === "playing" && (
          <div className="bg-neutral-900 border border-neutral-800 px-3 py-1.5 text-cyan-400 text-[10px] font-bold tracking-[0.2em]">
            YAKLAŞAN HEDEF: <span className="text-white underline font-mono text-xs">{currentRequiredKey}</span>
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
            <p className="text-neutral-400 text-[11px] tracking-[0.35em] font-bold uppercase mb-2">PULSE RHYTHM INTEGRATION</p>
            <p className="text-rose-500 font-bold text-[10px] tracking-[0.18em] uppercase animate-pulse">
              HİZALANMA BAŞLIYOR: <span className="text-white font-mono text-sm underline">{countdown}s</span>
            </p>
          </div>
        )}

        <div className="relative w-full border border-neutral-900 bg-neutral-950 shadow-2xl rounded" style={{ height: 150 }}>
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ display: "block" }} />
        </div>
      </div>

      {/* ALT PANEL (BUTONLAR) */}
      <div className="relative z-20 w-full max-w-xl grid grid-cols-2 gap-4 pb-4">
        <button
          type="button"
          disabled={phase !== "playing"}
          onClick={() => executeAction("A")}
          className="border p-4 font-mono text-xs font-bold tracking-[0.2em] transition-all disabled:opacity-10 border-neutral-800 text-neutral-400 bg-neutral-900/40 hover:text-neutral-200 active:bg-neutral-800"
        >
          [A] ENJEKSİYON SOL
        </button>

        <button
          type="button"
          disabled={phase !== "playing"}
          onClick={() => executeAction("D")}
          className="border p-4 font-mono text-xs font-bold tracking-[0.2em] transition-all disabled:opacity-10 border-neutral-800 text-neutral-400 bg-neutral-900/40 hover:text-neutral-200 active:bg-neutral-800"
        >
          [D] ENJEKSİYON SAĞ
        </button>
      </div>
    </div>
  );
}
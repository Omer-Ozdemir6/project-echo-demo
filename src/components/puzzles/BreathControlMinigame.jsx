import { useCallback, useEffect, useRef, useState } from "react";

const DIFFICULTY = {
  1: { speedPx: 120, hitWindow: 40, spawnInterval: 2200 },
  2: { speedPx: 180, hitWindow: 35, spawnInterval: 1600 },
  3: { speedPx: 260, hitWindow: 28, spawnInterval: 1100 },
};

// ─── Tutorial Demo Canvas ─────────────────────────────────────────────────────
// Otomatik animasyonlu demo — P ve T dalgasını sırayla gösterir, doğru tuşu vurgular
function TutorialDemo() {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const startTs = performance.now();

    const drawWaveShape = (ctx, nx, midY, side, inWindow) => {
      ctx.strokeStyle = inWindow ? "#f59e0b" : "rgba(120,113,108,0.45)";
      ctx.lineWidth   = inWindow ? 2.5 : 1.5;
      ctx.beginPath();
      if (side === "A") {                         // P_DALGASI — tepe YUKARI
        ctx.moveTo(nx - 22, midY);
        ctx.lineTo(nx - 9,  midY);
        ctx.lineTo(nx - 4,  midY - 22);
        ctx.lineTo(nx + 1,  midY + 13);
        ctx.lineTo(nx + 5,  midY - 5);
        ctx.lineTo(nx + 9,  midY);
        ctx.lineTo(nx + 22, midY);
      } else {                                    // T_DALGASI — tepe AŞAĞI
        ctx.moveTo(nx - 22, midY);
        ctx.lineTo(nx - 9,  midY);
        ctx.lineTo(nx - 4,  midY + 22);
        ctx.lineTo(nx + 1,  midY - 13);
        ctx.lineTo(nx + 5,  midY + 5);
        ctx.lineTo(nx + 9,  midY);
        ctx.lineTo(nx + 22, midY);
      }
      ctx.stroke();
    };

    const loop = (ts) => {
      const t    = ((ts - startTs) / 1000) % 4;       // 4s döngü
      const W    = canvas.width  = canvas.offsetWidth;
      const H    = canvas.height = canvas.offsetHeight;
      const hitX = W * 0.28;
      const midY = H * 0.5;

      ctx.clearRect(0, 0, W, H);

      // Izgara
      ctx.strokeStyle = "rgba(120,113,108,0.07)";
      ctx.lineWidth = 1;
      for (let y = 0; y < H; y += 16) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
      // Orta çizgi
      ctx.beginPath();
      ctx.strokeStyle = "rgba(120,113,108,0.18)";
      ctx.lineWidth = 1;
      ctx.moveTo(0, midY); ctx.lineTo(W, midY);
      ctx.stroke();

      // Kehribar vuruş hattı
      ctx.beginPath();
      ctx.strokeStyle = "rgba(245,158,11,0.45)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.moveTo(hitX, 6); ctx.lineTo(hitX, H - 6);
      ctx.stroke();
      ctx.setLineDash([]);

      // R işareti — hedef halka
      ctx.beginPath();
      ctx.arc(hitX, midY, 5, 0, Math.PI * 2);
      ctx.fillStyle   = "rgba(245,158,11,0.18)";
      ctx.fill();
      ctx.strokeStyle = "rgba(245,158,11,0.6)";
      ctx.lineWidth   = 1;
      ctx.stroke();
      ctx.fillStyle = "rgba(245,158,11,0.85)";
      ctx.font = "bold 7px monospace";
      ctx.fillText("R", hitX - 3, midY + 3);

      // Dalga animasyonu — t<2: A, t>=2: D
      const side  = t < 2 ? "A" : "D";
      const sub   = t < 2 ? t / 2 : (t - 2) / 2;            // 0..1 yarı döngü içi
      const nodeX = W + 28 - (W + 28 - hitX + 12) * Math.min(sub / 0.78, 1.05);
      const inWin = Math.abs(nodeX - hitX) <= 35;
      const isHit = sub > 0.78 && sub < 0.92;

      // Hit anı parlaması
      if (isHit) {
        ctx.fillStyle = "rgba(245,158,11,0.10)";
        ctx.fillRect(0, 0, W, H);
      }

      if (nodeX < W + 28 && nodeX > hitX - 70) {
        // Yakın bölge halesi
        if (inWin) {
          ctx.beginPath();
          ctx.arc(nodeX, midY, 20, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(245,158,11,0.06)";
          ctx.fill();
        }

        drawWaveShape(ctx, nodeX, midY, side, inWin);

        // Dalga etiketi
        ctx.fillStyle = inWin ? "#f59e0b" : "#57534e";
        ctx.font = "bold 8px monospace";
        const ly = side === "A" ? midY - 32 : midY + 38;
        ctx.fillText(side === "A" ? "🜁 P" : "🜃 T", nodeX - 8, ly);
      }

      // Tuş vurgu — dalga yakınken
      if ((inWin || isHit) && !isHit) {
        const kLabel = side === "A" ? "← [A]" : "[D] →";
        ctx.fillStyle = "rgba(245,158,11,0.55)";
        ctx.font = "bold 8px monospace";
        ctx.fillText(kLabel, hitX - 16, H - 7);
      }
      if (isHit) {
        ctx.fillStyle = "#f59e0b";
        ctx.font = "bold 10px monospace";
        ctx.fillText(side === "A" ? "✓ [A]" : "✓ [D]", hitX - 14, H - 7);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  return (
    <div
      className="relative w-full border border-stone-800/60 bg-black/90 overflow-hidden"
      style={{ height: 96, borderRadius: 2 }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: "block" }}
      />
      {/* iç kenarlarda CRT vinyeti */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.55)_100%)]" />
    </div>
  );
}

// ─── Mini dalga şekil diyagramı (SVG) ────────────────────────────────────────
function WaveShape({ side }) {
  // side: "A" = tepe yukarda (P_DALGASI), "D" = tepe aşağıda (T_DALGASI)
  const mid = 18;
  const points =
    side === "A"
      ? `5,${mid} 14,${mid} 17,4 22,30 26,12 30,${mid} 44,${mid}`
      : `5,${mid} 14,${mid} 17,30 22,4 26,24 30,${mid} 44,${mid}`;
  return (
    <svg
      width="50"
      height="36"
      viewBox="0 0 50 36"
      className="block mx-auto"
      aria-hidden="true"
    >
      <polyline
        points={points}
        stroke="rgba(120,113,108,0.6)"
        strokeWidth="1.5"
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* hedef çizgisi */}
      <line x1="0" y1={mid} x2="50" y2={mid} stroke="rgba(120,113,108,0.15)" strokeWidth="1" />
    </svg>
  );
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────
/**
 * BreathControlMinigame
 *
 * Props:
 *  difficulty       (1|2|3) — zorluk seviyesi
 *  hitsNeeded       — kaç başarılı vuruş
 *  echoLabel        — üst başlık uyarı yazısı
 *  firstTime        — true → tutorial göster | false → direkt countdown
 *  onSuccess        — tüm vuruşlar tamamlandığında çağrılır
 *  onFail           — bir vuruş kaçırıldığında çağrılır
 *  onTutorialSeen   — tutorial kapatıldığında çağrılır (parent memory'ye kayıt edebilir)
 */
export default function BreathControlMinigame({
  difficulty       = 1,
  hitsNeeded       = 6,
  echoLabel        = "KARALTI_YAKINLIK_UYARISI",
  firstTime        = true,
  onSuccess,
  onFail,
  onTutorialSeen,
}) {
  const cfg = DIFFICULTY[Math.min(3, Math.max(1, difficulty))];

  const initPhase = firstTime ? "tutorial" : "intro";

  const [phase,        setPhase]        = useState(initPhase);
  const [hitsLeft,     setHitsLeft]     = useState(hitsNeeded);
  const [flashCol,     setFlashCol]     = useState(null);
  const [countdown,    setCountdown]    = useState(5);
  const [requiredWave, setRequiredWave] = useState("-");

  const canvasRef    = useRef(null);
  const phaseRef     = useRef(initPhase);
  const hitsRef      = useRef(0);
  const flashRef     = useRef(null);
  const rafRef       = useRef(null);
  const nodesRef     = useRef([]);
  const lastSpawnRef = useRef(0);

  useEffect(() => {
    setHitsLeft(hitsNeeded);
    hitsRef.current = 0;
    const p = firstTime ? "tutorial" : "intro";
    phaseRef.current = p;
    setPhase(p);
  }, [hitsNeeded, firstTime]);

  const stopLoop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const handleMiss = useCallback(() => {
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
    flashRef.current = "rgba(245,158,11,0.15)";
    setFlashCol("rgba(245,158,11,0.15)");
    setTimeout(() => { flashRef.current = null; setFlashCol(null); }, 120);

    if (newLeft <= 0) {
      phaseRef.current = "success";
      setPhase("success");
      stopLoop();
      setTimeout(() => { if (onSuccess) onSuccess(); }, 1200);
    }
  }, [hitsNeeded, onSuccess, stopLoop]);

  const startLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let lastTs = performance.now();
    lastSpawnRef.current = performance.now();
    nodesRef.current = [];

    const loop = (ts) => {
      if (phaseRef.current !== "playing") return;

      const dt   = Math.min((ts - lastTs) / 1000, 0.05);
      lastTs = ts;

      const W    = canvas.width  = canvas.offsetWidth;
      const H    = canvas.height = canvas.offsetHeight;
      const hitX = W * 0.25;
      const midY = H * 0.5;

      // Yeni dalga spawn
      if (ts - lastSpawnRef.current > cfg.spawnInterval) {
        nodesRef.current.push({ x: W + 40, side: Math.random() < 0.5 ? "A" : "D", hitProcessed: false });
        lastSpawnRef.current = ts;
      }

      ctx.clearRect(0, 0, W, H);

      // Arka plan ızgarası
      ctx.strokeStyle = "rgba(120,113,108,0.05)";
      ctx.lineWidth = 1;
      for (let y = 0; y < H; y += 18) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // Orta çizgi
      ctx.beginPath();
      ctx.strokeStyle = "rgba(120,113,108,0.12)";
      ctx.lineWidth = 1;
      ctx.moveTo(0, midY); ctx.lineTo(W, midY);
      ctx.stroke();

      // Flaş katmanı
      if (flashRef.current) {
        ctx.fillStyle = flashRef.current;
        ctx.fillRect(0, 0, W, H);
      }

      // Kehribar vuruş hattı
      ctx.beginPath();
      ctx.strokeStyle = "rgba(245,158,11,0.5)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.moveTo(hitX, 10); ctx.lineTo(hitX, H - 10);
      ctx.stroke();
      ctx.setLineDash([]);

      // R hedef halkası
      ctx.beginPath();
      ctx.arc(hitX, midY, 5, 0, Math.PI * 2);
      ctx.fillStyle   = "rgba(245,158,11,0.18)";
      ctx.fill();
      ctx.strokeStyle = "rgba(245,158,11,0.6)";
      ctx.lineWidth   = 1;
      ctx.stroke();
      ctx.fillStyle = "rgba(245,158,11,0.9)";
      ctx.font = "bold 7px monospace";
      ctx.fillText("R", hitX - 3, midY + 3);

      let closestNode = null;

      for (let i = 0; i < nodesRef.current.length; i++) {
        const node = nodesRef.current[i];
        node.x -= cfg.speedPx * dt;

        // Kaçırıldı mı?
        if (!node.hitProcessed && node.x < hitX - cfg.hitWindow - 5) {
          if (phaseRef.current === "playing") { handleMiss(); return; }
        }

        const inWindow = Math.abs(node.x - hitX) <= cfg.hitWindow;
        if (!node.hitProcessed && inWindow) {
          if (!closestNode || node.x < closestNode.x) closestNode = node;
        }

        // Yakın alan parlaması
        if (inWindow) {
          ctx.beginPath();
          ctx.arc(node.x, midY, 22, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(245,158,11,0.06)";
          ctx.fill();
        }

        // Dalga çizimi
        ctx.strokeStyle = inWindow ? "#f59e0b" : "rgba(120,113,108,0.5)";
        ctx.lineWidth   = inWindow ? 2.5 : 1.5;
        ctx.beginPath();
        if (node.side === "A") {
          ctx.moveTo(node.x - 25, midY); ctx.lineTo(node.x - 10, midY);
          ctx.lineTo(node.x - 5, midY - 25); ctx.lineTo(node.x, midY + 15);
          ctx.lineTo(node.x + 5, midY - 5); ctx.lineTo(node.x + 10, midY);
          ctx.lineTo(node.x + 25, midY);
        } else {
          ctx.moveTo(node.x - 25, midY); ctx.lineTo(node.x - 10, midY);
          ctx.lineTo(node.x - 5, midY + 25); ctx.lineTo(node.x, midY - 15);
          ctx.lineTo(node.x + 5, midY + 5); ctx.lineTo(node.x + 10, midY);
          ctx.lineTo(node.x + 25, midY);
        }
        ctx.stroke();

        // Dalga etiketi
        ctx.fillStyle = inWindow ? "#f59e0b" : "#78716c";
        ctx.font = "bold 9px monospace";
        const textY = node.side === "A" ? midY - 34 : midY + 38;
        ctx.fillText(node.side === "A" ? "🜁 [SOL]" : "🜃 [SAĞ]", node.x, textY);
      }

      setRequiredWave(
        closestNode
          ? closestNode.side === "A" ? "🜁 P_DALGASI" : "🜃 T_DALGASI"
          : "-"
      );

      nodesRef.current = nodesRef.current.filter(n => n.x > -50);
      if (phaseRef.current === "playing") rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
  }, [cfg, handleMiss]);

  const executeAction = useCallback((key) => {
    if (phaseRef.current !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const hitX = canvas.width * 0.25;
    const validNode = nodesRef.current.find(
      n => !n.hitProcessed && n.side === key && Math.abs(n.x - hitX) <= cfg.hitWindow
    );
    if (validNode) {
      validNode.hitProcessed = true;
      nodesRef.current = nodesRef.current.filter(n => n !== validNode);
      handleHit();
    } else {
      handleMiss();
    }
  }, [cfg.hitWindow, handleHit, handleMiss]);

  // Countdown — sadece "intro" fazından tetiklenir
  useEffect(() => {
    if (phase !== "intro") return;
    setCountdown(5);
    const id = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(id);
          phaseRef.current = "playing";
          setPhase("playing");
          startLoop();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase, startLoop]);

  // Klavye
  useEffect(() => {
    const onKey = (e) => {
      if (phaseRef.current !== "playing") return;
      if (e.code === "KeyA" || e.code === "ArrowLeft") { e.preventDefault(); executeAction("A"); }
      if (e.code === "KeyD" || e.code === "ArrowRight") { e.preventDefault(); executeAction("D"); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [executeAction]);

  const dismissTutorial = useCallback(() => {
    if (onTutorialSeen) onTutorialSeen();
    phaseRef.current = "intro";
    setPhase("intro");
    setCountdown(5);
  }, [onTutorialSeen]);

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-between select-none font-mono p-6 bg-black/95 backdrop-blur-xs"
      style={{ touchAction: "none" }}
    >
      {/* Tarama çizgileri */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.005),rgba(255,255,255,0.005)_1px,transparent_1px,transparent_4px)] opacity-25" />

      {/* ─── FAIL OVERLAY ────────────────────────────────────────────── */}
      {phase === "fail" && (
        <div className="absolute inset-0 z-30 bg-rose-950/40 backdrop-blur-xs flex flex-col items-center justify-center gap-2">
          <span className="text-rose-600 text-3xl animate-ping">⚠️</span>
          <p className="text-rose-600 text-xs tracking-[0.3em] font-black mt-4 uppercase">
            // SOLUNUM_REZONANS_KAYBI — KAŞİF_TESPİT_EDİLDİ
          </p>
        </div>
      )}

      {/* ─── SUCCESS OVERLAY ─────────────────────────────────────────── */}
      {phase === "success" && (
        <div className="absolute inset-0 z-30 bg-neutral-950/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2">
          <span className="text-amber-500 text-2xl" style={{
            animationName: "pulse",
            animationDuration: "2s",
            animationIterationCount: "infinite",
            animationTimingFunction: "cubic-bezier(0.4,0,0.6,1)"
          }}>✓</span>
          <p className="text-amber-500 text-xs tracking-[0.3em] font-black uppercase">
            // FREKANS_STABİLİZASYONU_SAĞLANDI — TEHLİKE_GECTİ
          </p>
        </div>
      )}

      {/* ─── TUTORIAL OVERLAY ────────────────────────────────────────── */}
      {phase === "tutorial" && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
          <div className="w-full max-w-xs border border-stone-800 bg-neutral-950/99 flex flex-col gap-0 overflow-hidden" style={{ borderRadius: 1 }}>

            {/* Başlık çubuğu */}
            <div className="bg-stone-950 border-b border-stone-900 px-4 py-3 flex items-center gap-2">
              <span className="text-rose-700 text-[8px] tracking-[0.4em] font-black uppercase" style={{
                animationName: "pulse",
                animationDuration: "2s",
                animationIterationCount: "infinite",
                animationTimingFunction: "cubic-bezier(0.4,0,0.6,1)"
              }}>● REC</span>
              <span className="text-stone-600 text-[8px] tracking-widest uppercase ml-auto">PROTOKOL_07</span>
            </div>

            <div className="px-4 pt-4 pb-3 flex flex-col gap-3">

              {/* Başlık */}
              <div>
                <p className="text-stone-600 text-[8px] tracking-[0.35em] uppercase mb-0.5">TELSİZ KÖPRÜSÜ — AKUSTİK BASKILAMA</p>
                <h2 className="text-stone-100 text-[13px] font-black tracking-[0.15em] uppercase leading-tight">
                  NEFES KİLİTLEME
                </h2>
              </div>

              {/* Animasyonlu demo */}
              <TutorialDemo />

              {/* Dalga türleri */}
              <div className="grid grid-cols-2 gap-2">
                {/* P Dalgası */}
                <div className="border border-stone-900 bg-black/40 p-2.5 flex flex-col items-center gap-1.5">
                  <div className="text-[7px] text-stone-600 tracking-[0.3em] uppercase">P_DALGASI</div>
                  <WaveShape side="A" />
                  <div className="text-[7px] text-stone-500 tracking-wider uppercase">TEPE YUKARI ↑</div>
                  <div className="w-full border border-amber-900/50 bg-amber-950/25 text-amber-500 text-[10px] font-black tracking-widest text-center py-1.5">
                    [A] / ←
                  </div>
                </div>
                {/* T Dalgası */}
                <div className="border border-stone-900 bg-black/40 p-2.5 flex flex-col items-center gap-1.5">
                  <div className="text-[7px] text-stone-600 tracking-[0.3em] uppercase">T_DALGASI</div>
                  <WaveShape side="D" />
                  <div className="text-[7px] text-stone-500 tracking-wider uppercase">TEPE AŞAĞI ↓</div>
                  <div className="w-full border border-amber-900/50 bg-amber-950/25 text-amber-500 text-[10px] font-black tracking-widest text-center py-1.5">
                    [D] / →
                  </div>
                </div>
              </div>

              {/* Kural kutusu */}
              <div className="border-l-2 border-amber-900/60 bg-black/30 pl-3 pr-2 py-2">
                <p className="text-stone-400 text-[9px] leading-relaxed tracking-wide">
                  Dalga <span className="text-amber-500 font-black">kehribar hattına</span> yaklaştığında
                  doğru tuşa bas. Kaçırmak veya yanlış tuş sinyali keser.
                </p>
              </div>

              {/* Uyarı */}
              <p className="text-rose-800/90 text-[8px] tracking-[0.18em] uppercase font-black text-center">
                ⚠&nbsp; KAÇIRIRSAN HER ŞEY BITER
              </p>

              {/* Başlat butonu */}
              <button
                type="button"
                onClick={dismissTutorial}
                className="w-full border border-amber-800/50 bg-amber-950/20 text-amber-400 text-[9px] font-black tracking-[0.28em] uppercase py-3.5 hover:bg-amber-950/40 hover:border-amber-700/70 hover:text-amber-300 transition-all"
                style={{ borderRadius: 1 }}
              >
                HAZIR — KALİBRASYONA BAŞLA
              </button>

              {/* Alt not */}
              <p className="text-stone-800 text-[7px] tracking-widest uppercase text-center -mt-1">
                Bu mesaj bir daha gösterilmeyecek
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Header ──────────────────────────────────────────────────── */}
      <div className="relative z-20 w-full max-w-xl flex items-center justify-between border-b border-stone-900 pb-4 pt-2 text-[10px]">
        <div className="text-left">
          <h2 className="text-stone-500 text-[10px] tracking-[0.25em] font-black uppercase m-0">
            TELSİZ KÖPRÜSÜ // NEFES KİLİTLEME
          </h2>
          <span
            className="text-rose-700 text-[9px] tracking-widest mt-1.5 block font-black uppercase"
            style={{
              animationName: "pulse",
              animationDuration: "2s",
              animationIterationCount: "infinite",
              animationTimingFunction: "cubic-bezier(0.4,0,0.6,1)"
            }}
          >{echoLabel}</span>
        </div>

        {phase === "playing" && (
          <div className="bg-neutral-950 border border-stone-900 px-3 py-1.5 text-amber-600 text-[9px] font-black tracking-widest uppercase">
            NABIZ: <span className="text-stone-200 font-mono font-bold ml-1">{requiredWave}</span>
          </div>
        )}

        {/* İlerleme göstergesi */}
        <div className="flex gap-1.5">
          {Array.from({ length: hitsNeeded }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-2 transition-all duration-300 ${
                i < hitsNeeded - hitsLeft
                  ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                  : "bg-stone-950 border border-stone-900"
              }`}
            />
          ))}
        </div>
      </div>

      {/* ─── Canvas ──────────────────────────────────────────────────── */}
      <div className="w-full max-w-xl flex flex-col items-center justify-center my-auto">
        {phase === "intro" && (
          <div className="text-center mb-5">
            <p className="text-stone-600 text-[9px] tracking-[0.3em] font-black uppercase mb-1">
              AKUSTİK_NABIZ_KALİBRASYONU
            </p>
            <p
              className="text-amber-600/80 font-bold text-[10px] tracking-[0.18em] uppercase"
              style={{
                animationName: "pulse",
                animationDuration: "2s",
                animationIterationCount: "infinite",
                animationTimingFunction: "cubic-bezier(0.4,0,0.6,1)"
              }}
            >
              SENKRONİZASYON:{" "}
              <span className="text-stone-200 font-mono text-xs underline font-black">
                {countdown}S
              </span>
            </p>
            {/* Küçük tuş hatırlatıcı */}
            <div className="flex justify-center items-center gap-3 mt-3">
              <span className="text-stone-700 text-[8px] font-black tracking-widest">🜁 P → [A]</span>
              <span className="text-stone-800 text-[7px]">|</span>
              <span className="text-stone-700 text-[8px] font-black tracking-widest">🜃 T → [D]</span>
            </div>
          </div>
        )}

        <div
          className="relative w-full border border-stone-900 bg-black shadow-2xl overflow-hidden"
          style={{ height: 160, borderRadius: 1 }}
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ display: "block" }}
          />
          {/* İç kenarlarda CRT vinyeti */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_60%,rgba(0,0,0,0.55)_100%)]" />
        </div>
      </div>

      {/* ─── Tuşlar ──────────────────────────────────────────────────── */}
      <div className="relative z-20 w-full max-w-xl grid grid-cols-2 gap-4 pb-2 font-mono">
        <button
          type="button"
          disabled={phase !== "playing"}
          onPointerDown={() => executeAction("A")}
          className="border py-4 text-[10px] font-black tracking-[0.2em] transition-all disabled:opacity-5 border-stone-900 text-stone-500 bg-stone-950/40 hover:text-amber-500 hover:border-amber-900/60 active:bg-amber-950/20 active:border-amber-800/60 uppercase"
          style={{ borderRadius: 1, touchAction: "none" }}
        >
          [A] 🜁 SOL_DENGELİ
        </button>

        <button
          type="button"
          disabled={phase !== "playing"}
          onPointerDown={() => executeAction("D")}
          className="border py-4 text-[10px] font-black tracking-[0.2em] transition-all disabled:opacity-5 border-stone-900 text-stone-500 bg-stone-950/40 hover:text-amber-500 hover:border-amber-900/60 active:bg-amber-950/20 active:border-amber-800/60 uppercase"
          style={{ borderRadius: 1, touchAction: "none" }}
        >
          [D] 🜃 SAĞ_DENGELİ
        </button>
      </div>
    </div>
  );
}

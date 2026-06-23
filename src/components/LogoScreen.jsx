import { useEffect, useMemo, useState, useRef } from "react";

export default function LogoScreen({ gameTitle = "PROJECT ECHO", onComplete }) {
  const [progress, setProgress] = useState(0);
  const [blackout, setBlackout] = useState(false);
  const [glitchActive, setGlitchActive] = useState(false);
  const [systemLog, setSystemLog] = useState("INITIALIZING HARMONIC RECEIVER...");

  const canvasRef = useRef(null);

  // 1. Dinamik Arka Plan Sinyal Dalgalanması (Canvas)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationId;
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
      // İlerleme arttıkça parazit azalır, sinyal daha düzgün bir sinüse dönüşür
      const noiseSeverity = Math.max(2, (100 - progress) * 0.4);

      ctx.beginPath();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = progress >= 100 
        ? `rgba(52, 211, 153, ${Math.random() * 0.3})` // Emerald Yeşil
        : `rgba(34, 211, 238, ${0.08 + Math.random() * 0.08})`; // Cyan

      for (let x = 0; x < canvas.width; x += 4) {
        const sine = Math.sin(x * 0.015 + frame * 0.1) * 30;
        const noise = (Math.random() - 0.5) * noiseSeverity;
        
        if (x === 0) ctx.moveTo(x, midY + sine + noise);
        else ctx.lineTo(x, midY + sine + noise);
      }
      ctx.stroke();

      animationId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, [progress]);

  // 2. Mikro Dalgalanmalı Sinyal İlerlemesi ve Dinamik Log Akışı
  useEffect(() => {
    let currentProgress = 0;

    const logs = [
      { p: 15, text: "PROBING SUBCARRIER FREQUENCIES..." },
      { p: 40, text: "ESTABLISHING HANDSHAKE PROTOCOL [A12-77]..." },
      { p: 65, text: "DECRYPTING NURAL FEED STREAM..." },
      { p: 85, text: "SYNCHRONIZING BUFFER MEMORY CORE..." },
      { p: 100, text: "TERMINAL CONNECTION ONLINE." }
    ];

    const nextStep = () => {
      if (currentProgress >= 100) return;

      // Sabit adımlar yerine organik, değişken artışlar (Organik yükleme hissi)
      const increment = Math.floor(Math.random() * 8) + 4; 
      currentProgress = Math.min(100, currentProgress + increment);
      setProgress(currentProgress);

      // İlerlemeye göre alt terminal logunu güncelle
      const matchingLog = logs.find(l => currentProgress <= l.p);
      if (matchingLog) setSystemLog(matchingLog.text);

      // Rastgele gecikmelerle bir sonraki adımı tetikle (Jitter efekti)
      const nextDelay = Math.floor(Math.random() * 250) + 150;
      setTimeout(nextStep, nextDelay);
    };

    const startTimeout = setTimeout(nextStep, 300);
    return () => clearTimeout(startTimeout);
  }, []);

  // 3. Aşırı Yüklenme (Glitch Burst) ve Blackout Geçiş Yönetimi
  useEffect(() => {
    if (progress < 100) return;

    // Sinyal yakalandığı an ekranda anlık patlama/yırtılma efekti tetiklenir
    setGlitchActive(true);

    const glitchTimeout = setTimeout(() => {
      setGlitchActive(false);
      setBlackout(true);
    }, 350); // Glitch patlama süresi

    const completeTimeout = setTimeout(() => {
      onComplete?.();
    }, 1200); // Toplam kararma ve ana ekrana geçiş süresi optimize edildi (Sıkmamak adına)

    return () => {
      clearTimeout(glitchTimeout);
      clearTimeout(completeTimeout);
    };
  }, [progress, onComplete]);

  // Yükleme barı oluşturucu
  const bar = useMemo(() => {
    const filled = Math.round(progress / 10);
    return "█".repeat(filled) + "░".repeat(10 - filled);
  }, [progress]);

  const isComplete = progress >= 100;

  if (blackout) {
    return <main className="min-h-dvh bg-black transition-colors duration-1000" />;
  }

  return (
    <main 
      className={[
        "relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-black font-mono select-none text-cyan-50",
        glitchActive ? "animate-[screenGlitch_0.05s_infinite]" : "animate-[flicker_5s_infinite]"
      ].join(" ")}
    >
      {/* Canvas Sinyal Çizgileri */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-80" />

      {/* CRT Tarama Perdeleri */}
      <div className="pointer-events-none fixed inset-0 z-50 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.012),rgba(255,255,255,0.012)_2px,transparent_2px,transparent_5px)] opacity-40 shadow-[inset_0_0_80px_rgba(0,0,0,0.85)]" />
      <div className={`pointer-events-none absolute inset-0 z-10 transition-colors duration-700 ${isComplete ? 'bg-[radial-gradient(circle_at_center,rgba(52,211,153,0.04),transparent_60%)]' : 'bg-[radial-gradient(circle_at_center,rgba(8,145,178,0.08),transparent_65%)]'}`} />

      {/* Ana İçerik Grubu */}
      <div className="relative z-20 flex flex-col items-center">
        
        {/* Merkez Nöral Sinyal Logosu */}
        <div 
          className={[
            "grid h-48 w-48 place-items-center rounded-full border border-cyan-500/30 text-center text-xs tracking-[0.5em] font-black uppercase transition-all duration-500 relative",
            isComplete 
              ? "border-emerald-500 text-emerald-400 shadow-[0_0_40px_rgba(52,211,153,0.25)]" 
              : "border-cyan-400 text-cyan-300 shadow-[0_0_30px_rgba(34,211,238,0.2)] animate-pulse"
          ].join(" ")}
        >
          {/* İç Dönen Dekoratif Halka */}
          <div className={`absolute inset-1.5 border border-dashed rounded-full opacity-20 ${isComplete ? 'border-emerald-400 animate-spin' : 'border-cyan-400 animate-[spin_30s_linear_infinite]'}`} />
          
          <span className="pl-2 z-10">{gameTitle}</span>
        </div>

        {/* Durum Gösterge Paneli */}
        <div className="mt-12 text-center w-72">
          <p className={`text-[9px] tracking-[0.4em] font-bold uppercase transition-colors duration-300 ${isComplete ? "text-emerald-400" : "text-cyan-400/70"}`}>
            {isComplete ? "// SIGNAL_STABLE" : "// ACQUIRING_RELAY_STREAM"}
          </p>

          {/* Klinik Matrix Yükleme Kutusu */}
          <div className={`mt-4 border bg-black/80 px-4 py-3.5 font-mono text-xs tracking-[0.2em] transition-all duration-300 rounded ${isComplete ? 'border-emerald-950 shadow-[0_0_20px_rgba(52,211,153,0.05)]' : 'border-cyan-950/40 shadow-[0_0_15px_rgba(34,211,238,0.03)]'}`}>
            <div className="flex items-center justify-between">
              <span className={isComplete ? "text-emerald-500" : "text-cyan-500/50"}>&gt;</span>
              <span className={`font-light ${isComplete ? 'text-emerald-400/80' : 'text-cyan-200/70'}`}>{bar}</span>
              <span className={`w-10 text-right font-bold ${isComplete ? "text-emerald-400" : "text-cyan-300"}`}>
                {progress}%
              </span>
            </div>
          </div>

          {/* Dinamik Altyazı / Sistem Logu */}
          <p className="mt-3.5 h-4 text-[8px] tracking-[0.18em] text-neutral-500 font-mono uppercase truncate">
            {systemLog}
          </p>
        </div>
      </div>

      {/* Sağ Üst Köşe: Sistem İstatistik Süslemesi */}
      <div className="absolute top-6 right-6 hidden sm:block text-right text-[8px] text-neutral-600 tracking-widest leading-relaxed">
        <div>SYS_RELAY: ACTIVE</div>
        <div>BAND_FREQ: 1420.4 MHz</div>
        <div className={isComplete ? "text-emerald-600" : "text-cyan-700"}>
          STATUS: {isComplete ? "CONNECTED" : "SEARCHING"}
        </div>
      </div>
    </main>
  );
}
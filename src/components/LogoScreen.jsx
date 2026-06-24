import { useEffect, useMemo, useState, useRef } from "react";

export default function LogoScreen({ gameTitle = "PROJECT ECHO", onComplete }) {
  const [progress, setProgress] = useState(0);
  const [blackout, setBlackout] = useState(false);
  const [glitchActive, setGlitchActive] = useState(false);
  const [systemLog, setSystemLog] = useState("HARMONİK ALICI BAŞLATILIYOR...");

  const canvasRef = useRef(null);

  // 1. Dinamik Yer Altı Sismik ve Frekans Dalgalanması (Canvas)
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
      ctx.fillStyle = "rgba(5, 5, 5, 0.18)"; // Zifiri taş karanlığı
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const midY = canvas.height / 2;
      // Frekans kilitlendikçe parazit azalır, sismik dalga stabil bir analoga dönüşür
      const noiseSeverity = Math.max(2, (100 - progress) * 0.4);

      ctx.beginPath();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = progress >= 100 
        ? `rgba(245, 158, 11, 0.25)` // Stabil Kehribar Rezonansı
        : `rgba(120, 113, 108, ${0.08 + Math.random() * 0.08})`; // Loş Taş Rengi Parazit

      for (let x = 0; x < canvas.width; x += 4) {
        const sine = Math.sin(x * 0.015 + frame * 0.08) * 25;
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

  // 2. Mikro Dalgalanmalı Sinyal İlerlemesi ve Dinamik Sığınak Log Akışı
  useEffect(() => {
    let currentProgress = 0;

    const logs = [
      { p: 15, text: "YERALTI ALT TAŞIYICI FREKANSLARI TARANIYOR..." },
      { p: 40, text: "TELSİZ KÖPRÜSÜ FREKANS PROTOKOLÜ BAŞLATILDI..." },
      { p: 65, text: "AKUSTİK YANKI VE PARÇALANMIŞ VERİ AYRIŞTIRILIYOR..." },
      { p: 85, text: "TELSİZ ÖN BELLEK REZONANSI EŞLEŞTİRİLİYOR..." },
      { p: 100, text: "YER ALTI SİNYAL BAĞLANTISI AKTİF." }
    ];

    const nextStep = () => {
      if (currentProgress >= 100) return;

      // Değişken artışlarla analog yükleme hissi
      const increment = Math.floor(Math.random() * 8) + 4; 
      currentProgress = Math.min(100, currentProgress + increment);
      setProgress(currentProgress);

      const matchingLog = logs.find(l => currentProgress <= l.p);
      if (matchingLog) setSystemLog(matchingLog.text);

      const nextDelay = Math.floor(Math.random() * 250) + 150;
      setTimeout(nextStep, nextDelay);
    };

    const startTimeout = setTimeout(nextStep, 300);
    return () => clearTimeout(startTimeout);
  }, []);

  // 3. Aşırı Yüklenme (Telsiz Parazit Patlaması) ve Blackout Yönetimi
  useEffect(() => {
    if (progress < 100) return;

    setGlitchActive(true);

    const glitchTimeout = setTimeout(() => {
      setGlitchActive(false);
      setBlackout(true);
    }, 350);

    const completeTimeout = setTimeout(() => {
      onComplete?.();
    }, 1200);

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
        "relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-black font-mono select-none text-stone-200",
        glitchActive ? "animate-[screenGlitch_0.05s_infinite]" : ""
      ].join(" ")}
    >
      {/* Sismik Sinyal Çizgileri */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-80" />

      {/* CRT Tarama Perdeleri */}
      <div className="pointer-events-none fixed inset-0 z-50 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.01),rgba(255,255,255,0.01)_2px,transparent_2px,transparent_5px)] opacity-25 shadow-[inset_0_0_80px_rgba(0,0,0,0.95)]" />
      <div className={`pointer-events-none absolute inset-0 z-10 transition-colors duration-700 ${isComplete ? 'bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.03),transparent_60%)]' : 'bg-[radial-gradient(circle_at_center,rgba(120,113,108,0.02),transparent_65%)]'}`} />

      {/* Ana İçerik Grubu */}
      <div className="relative z-20 flex flex-col items-center">
        
        {/* Merkez Telsiz Sinyal Logosu */}
        <div 
          className={[
            "grid h-44 w-44 place-items-center rounded-full border text-center text-[11px] tracking-[0.4em] font-bold uppercase transition-all duration-500 relative",
            isComplete 
              ? "border-amber-600 text-amber-500 shadow-[0_0_35px_rgba(245,158,11,0.25)]" 
              : "border-stone-800 text-stone-400 shadow-[0_0_20px_rgba(0,0,0,0.8)] animate-pulse"
          ].join(" ")}
        >
          {/* İç Dönen Dekoratif Rezonans Halkası */}
          <div className={`absolute inset-2 border border-dashed rounded-full opacity-10 ${isComplete ? 'border-amber-500 animate-spin' : 'border-stone-600 animate-[spin_40s_linear_infinite]'}`} />
          
          <span className="pl-1.5 z-10 font-bold tracking-[0.3em] uppercase">{gameTitle}</span>
        </div>

        {/* Durum Gösterge Paneli */}
        <div className="mt-12 text-center w-72">
          <p className={`text-[8px] tracking-[0.35em] font-black uppercase transition-colors duration-300 ${isComplete ? "text-amber-500" : "text-stone-600"}`}>
            {isComplete ? "// SİNYAL_SABİTLENDİ" : "// REZONANS_AKIŞI_ARANIYOR"}
          </p>

          {/* Antik Yükleme Çerçevesi */}
          <div className={`mt-4 border bg-neutral-950 px-4 py-3.5 font-mono text-xs tracking-[0.15em] transition-all duration-300 rounded-xs ${isComplete ? 'border-amber-950 shadow-[0_0_20px_rgba(245,158,11,0.03)]' : 'border-stone-900'}`}>
            <div className="flex items-center justify-between">
              <span className={isComplete ? "text-amber-600 font-bold" : "text-stone-700"}>&gt;</span>
              <span className={`font-light tracking-normal ${isComplete ? 'text-amber-500/70' : 'text-stone-600'}`}>{bar}</span>
              <span className={`w-10 text-right font-mono font-bold ${isComplete ? "text-amber-500" : "text-stone-500"}`}>
                %{progress}
              </span>
            </div>
          </div>

          {/* Dinamik Altyazı / Telsiz Logu */}
          <p className="mt-3.5 h-4 text-[8px] tracking-[0.15em] text-stone-600 font-mono uppercase truncate font-bold m-0">
            {systemLog}
          </p>
        </div>
      </div>

      {/* Sağ Üst Köşe: Telsiz İstasyon İstatistik Süslemesi */}
      <div className="absolute top-6 right-6 hidden sm:block text-right text-[8px] text-stone-600 tracking-widest leading-relaxed font-black uppercase">
        <div>KOLON_BAĞLANTI: AKTİF</div>
        <div>FREKANS_BANDI: 1420.4 MHz</div>
        <div className={isComplete ? "text-amber-600" : "text-stone-700"}>
          DURUM: {isComplete ? "BAĞLANDI" : "ARANIYOR"}
        </div>
      </div>
    </main>
  );
}
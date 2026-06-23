import { useEffect, useState, useRef, useMemo } from "react";

// Arka planda akacak klinik alt sistem logları
const PROCESS_LOGS = [
  "ALLOCATING NEURAL MEMORY...",
  "PARSING ENCRYPTED FREQUENCY...",
  "RESOLVING COGNITIVE NODES...",
  "ESTABLISHING SECURE PROTOCOL [A12-77]...",
  "SCANNING SUBSYSTEM MEMORY CORE...",
  "BUFFERING TRANSMISSION DATA STREAM...",
  "CLEANING COGNITIVE RESIDUE..."
];

export default function ProgressTaskModal({ task }) {
  const [progress, setProgress] = useState(0);
  const [currentLog, setCurrentLog] = useState("INITIALIZING PROCESS...");
  const [glitch, setGlitch] = useState(false);

  // İşlemin tona göre renk haritası (Klinik terminal bütünlüğü için)
  const theme = useMemo(() => {
    const tone = task?.tone || "system";
    if (tone === "danger" || tone === "critical") {
      return { text: "text-rose-500", border: "border-rose-950", bg: "bg-rose-950/20", glow: "shadow-[0_0_50px_rgba(225,29,72,0.12)]", bar: "bg-rose-500", accent: "text-rose-400/70" };
    }
    if (tone === "warning") {
      return { text: "text-amber-500", border: "border-amber-950", bg: "bg-amber-950/20", glow: "shadow-[0_0_50px_rgba(245,158,11,0.12)]", bar: "bg-amber-500", accent: "text-amber-400/70" };
    }
    // Varsayılan Emerald/Cyan Sistemi
    return { text: "text-emerald-400", border: "border-neutral-900", bg: "bg-black/95", glow: "shadow-[0_0_40px_rgba(52,211,153,0.06)]", bar: "bg-emerald-400", accent: "text-emerald-500/60" };
  }, [task?.tone]);

  useEffect(() => {
    if (!task) return;

    setProgress(0);
    setGlitch(false);
    setCurrentLog("INITIALIZING PROCESS...");

    const duration = task.duration || 6000;
    const startedAt = Date.now();
    let logInterval;

    // 1. Organik Mikro Dalgalanmalı (Jitter) Yükleme Döngüsü
    const updateProgress = () => {
      const elapsed = Date.now() - startedAt;
      let nextProgress = (elapsed / duration) * 100;

      // Gerçekçilik katmak için: Yükleme çubuğu belirli noktalarda mikro takılmalar yaşar
      if (nextProgress > 30 && nextProgress < 36) nextProgress = 32;
      if (nextProgress > 75 && nextProgress < 81) nextProgress = 76;

      const roundedProgress = Math.min(100, Math.round(nextProgress));
      setProgress(roundedProgress);

      if (roundedProgress < 100) {
        // Rastgele ufak sarsıntılar (Glitch burst) tetikler
        if (Math.random() > 0.97) {
          setGlitch(true);
          setTimeout(() => setGlitch(false), 100);
        }
        requestAnimationFrame(updateProgress);
      } else {
        setCurrentLog(task.completeText || "PROCESS COMPLETED.");
        clearInterval(logInterval);
      }
    };

    // Fonksiyonu başlat
    requestAnimationFrame(updateProgress);

    // 2. Canlı Akan Alt Sistem Log Zamanlayıcısı
    logInterval = setInterval(() => {
      const randomLog = PROCESS_LOGS[Math.floor(Math.random() * PROCESS_LOGS.length)];
      // Başına rastgele bir hex bellek adresi ekleyelim
      const hexAddr = `0x00${Math.floor(Math.random() * 255).toString(16).toUpperCase()}`;
      setCurrentLog(`[${hexAddr}] ${randomLog}`);
    }, 1200);

    return () => {
      clearInterval(logInterval);
    };
  }, [task]);

  // Hücre segmentli yapay yükleme barı (Retro blok görünümü)
  const segments = useMemo(() => {
    const totalBlocks = 20; // Yan yana kaç kare blok görünecek
    const filledBlocks = Math.round((progress / 100) * totalBlocks);
    return {
      filled: filledBlocks,
      empty: totalBlocks - filledBlocks
    };
  }, [progress]);

  if (!task) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/85 backdrop-blur-xs select-none">
      {/* Tarama Çizgileri Perdesi */}
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.01),rgba(255,255,255,0.01)_2px,transparent_2px,transparent_5px)] opacity-30" />

      {/* Ana Terminal Kutusu */}
      <div 
        className={[
          "w-[min(440px,92vw)] border-2 bg-black p-6 font-mono border-b-4 rounded-t transition-all duration-150",
          theme.border, theme.glow,
          glitch ? "animate-[screenGlitch_0.08s_infinite] scale-[1.01]" : ""
        ].join(" ")}
      >
        {/* Üst Bilgi Başlığı */}
        <div className={`flex items-center justify-between border-b ${theme.border} pb-2.5 mb-5 text-[10px] tracking-widest font-bold ${theme.accent}`}>
          <span>SYSTEM OPERATIONS FRAMEWORK</span>
          <span className="animate-pulse">TaskID_#{Math.floor(duration / 100)}</span>
        </div>

        {/* Görev Başlık Alanı */}
        <div className="text-center">
          <div className={`text-[10px] tracking-[0.4em] font-black uppercase ${theme.accent}`}>
            {task.tone === "danger" ? "🚨 ANOMALY OVERRIDE IN PROGRESS" : "--- EXECUTING COMMAND ---"}
          </div>

          <div className="mt-3 text-lg font-black tracking-[0.15em] text-white uppercase font-mono border-x border-neutral-900 py-1 px-4">
            {task.title}
          </div>

          {task.subtitle && (
            <div className="mt-2 text-xs tracking-wide text-neutral-400 font-light truncate">
              &gt; {task.subtitle}
            </div>
          )}
        </div>

        {/* 🚀 RETRO SEGMENTLİ YÜKLEME ALANI */}
        <div className="mt-8">
          <div className="flex items-center justify-between text-[11px] font-bold mb-2 tracking-widest text-neutral-500">
            <span>PROGRESS LOG_</span>
            <span className={progress === 100 ? "text-emerald-400" : "text-white"}>{progress}%</span>
          </div>

          {/* Blokların Çizildiği Hücresel Panel */}
          <div className="flex gap-1 border border-neutral-900 bg-neutral-950 p-1.5 rounded-xs justify-between">
            {Array.from({ length: segments.filled }).map((_, i) => (
              <div key={`f-${i}`} className={`h-4 flex-1 ${theme.bar} shadow-[0_0_6px_currentColor]`} />
            ))}
            {Array.from({ length: segments.empty }).map((_, i) => (
              <div key={`e-${i}`} className="h-4 flex-1 bg-neutral-900/50" />
            ))}
          </div>
        </div>

        {/* CANLI AKAN SİSTEM LOGU */}
        <div className="mt-6 border border-neutral-950 bg-neutral-950/40 p-2.5 rounded-sm">
          <p className="text-[9px] tracking-wide text-neutral-500 font-mono uppercase truncate">
            <span className={theme.text}>⚡</span> {currentLog}
          </p>
        </div>
      </div>
    </div>
  );
}
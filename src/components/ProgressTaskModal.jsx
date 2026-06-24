import { useEffect, useState, useRef, useMemo } from "react";

// Arka planda akacak sığınak ve telsiz alt sistem logları
const PROCESS_LOGS = [
  "SİSMİK VERİ PAKETLERİ AYRIŞTIRILIYOR...",
  "FREKANS REZONANS DEĞERLERİ OKUNUYOR...",
  "ALT KATMAN KOORDİNATLARI EŞLEŞTİRİLİYOR...",
  "TELSİZ KÖPRÜSÜ PROTOKOLÜ [K-32]...",
  "ODALARIN AKUSTİK YANKI HARİTASI TARANIYOR...",
  "JONES AYDIN VERİ AKIŞI ÖN BELLEKLEME...",
  "SİNYAL PARAZİTLERİ TEMİZLENİYOR..."
];

export default function ProgressTaskModal({ task }) {
  const [progress, setProgress] = useState(0);
  const [currentLog, setCurrentLog] = useState("BAĞLANTI BAŞLATILIYOR...");
  const [glitch, setGlitch] = useState(false);

  // İşlemin tona göre renk haritası (Yeraltı sığınağı bütünlüğü için)
  const theme = useMemo(() => {
    const tone = task?.tone || "system";
    if (tone === "danger" || tone === "critical") {
      return { text: "text-rose-600", border: "border-rose-950", bg: "bg-rose-950/20", glow: "shadow-[0_0_50px_rgba(220,38,38,0.1)]", bar: "bg-rose-600", accent: "text-rose-500/70" };
    }
    if (tone === "warning") {
      return { text: "text-amber-500", border: "border-amber-950", bg: "bg-amber-950/20", glow: "shadow-[0_0_50px_rgba(245,158,11,0.1)]", bar: "bg-amber-500", accent: "text-amber-600/70" };
    }
    // Varsayılan Kehribar/Taş Sistemi
    return { text: "text-amber-500", border: "border-stone-900", bg: "bg-black/95", glow: "shadow-[0_0_40px_rgba(245,158,11,0.03)]", bar: "bg-amber-500", accent: "text-stone-600" };
  }, [task?.tone]);

  useEffect(() => {
    if (!task) return;

    setProgress(0);
    setGlitch(false);
    setCurrentLog("BAĞLANTI BAŞLATILIYOR...");

    const duration = task.duration || 6000;
    const startedAt = Date.now();
    let logInterval;

    // 1. Organik Mikro Dalgalanmalı (Jitter) Yükleme Döngüsü
    const updateProgress = () => {
      const elapsed = Date.now() - startedAt;
      let nextProgress = (elapsed / duration) * 100;

      // Mağara sismik engelleri simülasyonu: Yükleme çubuğu belirli noktalarda mikro takılmalar yaşar
      if (nextProgress > 30 && nextProgress < 36) nextProgress = 32;
      if (nextProgress > 75 && nextProgress < 81) nextProgress = 76;

      const roundedProgress = Math.min(100, Math.round(nextProgress));
      setProgress(roundedProgress);

      if (roundedProgress < 100) {
        // Telsiz parazit sarsıntıları (Glitch burst) tetikler
        if (Math.random() > 0.97) {
          setGlitch(true);
          setTimeout(() => setGlitch(false), 100);
        }
        requestAnimationFrame(updateProgress);
      } else {
        setCurrentLog(task.completeText || "İŞLEM TAMAMLANDI.");
        clearInterval(logInterval);
      }
    };

    requestAnimationFrame(updateProgress);

    // 2. Canlı Akan Telsiz Sinyal Log Zamanlayıcısı
    logInterval = setInterval(() => {
      const randomLog = PROCESS_LOGS[Math.floor(Math.random() * PROCESS_LOGS.length)];
      // Başına rastgele bir hex sığınak adres bloğu ekleyelim
      const hexAddr = `0x00${Math.floor(Math.random() * 255).toString(16).toUpperCase()}`;
      setCurrentLog(`[${hexAddr}] ${randomLog}`);
    }, 1200);

    return () => {
      clearInterval(logInterval);
    };
  }, [task]);

  // Hücre segmentli yapay yükleme barı (Retro blok görünümü)
  const segments = useMemo(() => {
    const totalBlocks = 20; 
    const filledBlocks = Math.round((progress / 100) * totalBlocks);
    return {
      filled: filledBlocks,
      empty: totalBlocks - filledBlocks
    };
  }, [progress]);

  if (!task) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/90 backdrop-blur-xs select-none">
      {/* Tarama Çizgileri Perdesi */}
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.01),rgba(255,255,255,0.01)_2px,transparent_2px,transparent_5px)] opacity-25" />

      {/* Ana Terminal Kutusu */}
      <div 
        className={[
          "w-[min(420px,92vw)] border bg-neutral-950 p-6 font-mono border-b-2 rounded-xs transition-all duration-150",
          theme.border, theme.glow,
          glitch ? "animate-[screenGlitch_0.08s_infinite] scale-[1.01]" : ""
        ].join(" ")}
      >
        {/* Üst Bilgi Başlığı */}
        <div className={`flex items-center justify-between border-b ${theme.border} pb-2.5 mb-5 text-[8px] tracking-widest font-black uppercase ${theme.accent}`}>
          <span>KATMAN_PROJESİ_SİNYAL_MASASI</span>
          <span className="animate-pulse">GÖREV_ID_#{Math.floor(progress * 7)}</span>
        </div>

        {/* Görev Başlık Alanı */}
        <div className="text-center">
          <div className={`text-[9px] tracking-[0.35em] font-black uppercase ${theme.accent}`}>
            {task.tone === "danger" ? "🚨 SEKANSTA ANOMALİ TESPİT EDİLDİ" : "--- KOMUT YÜRÜTÜLÜYOR ---"}
          </div>

          <div className="mt-3 text-sm font-bold tracking-[0.15em] text-stone-200 uppercase font-mono border-x border-stone-900 py-1 px-4">
            {task.title}
          </div>

          {task.subtitle && (
            <div className="mt-2 text-[11px] tracking-wide text-stone-500 font-mono truncate">
              &gt; {task.subtitle}
            </div>
          )}
        </div>

        {/* RETRO SEGMENTLİ YÜKLEME ALANI */}
        <div className="mt-8">
          <div className="flex items-center justify-between text-[10px] font-black mb-2 tracking-widest text-stone-600 uppercase">
            <span>İŞLEM_LOGU_</span>
            <span className={progress === 100 ? "text-amber-500" : "text-stone-300"}>%{progress}</span>
          </div>

          {/* Blokların Çizildiği Hücresel Panel */}
          <div className="flex gap-1 border border-stone-900 bg-black p-1.5 rounded-xs justify-between">
            {Array.from({ length: segments.filled }).map((_, i) => (
              <div key={`f-${i}`} className={`h-3.5 flex-1 ${theme.bar} shadow-[0_0_6px_currentColor]`} />
            ))}
            {Array.from({ length: segments.empty }).map((_, i) => (
              <div key={`e-${i}`} className="h-3.5 flex-1 bg-stone-900/40" />
            ))}
          </div>
        </div>

        {/* CANLI AKAN TELSİZ LOGU */}
        <div className="mt-6 border border-stone-900 bg-stone-950/40 p-2.5 rounded-xs">
          <p className="text-[9px] tracking-wide text-stone-500 font-mono uppercase truncate m-0 flex items-center gap-1.5">
            <span className={theme.text}>⚡</span> {currentLog}
          </p>
        </div>
      </div>
    </div>
  );
}
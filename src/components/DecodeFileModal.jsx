import { useEffect, useState, useMemo } from "react";
import { getGameText } from "../i18n/gameText";

const ScanlineOverlay = () => (
  <div className="pointer-events-none absolute inset-0 z-50 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.012),rgba(255,255,255,0.012)_2px,transparent_2px,transparent_5px)] opacity-30 shadow-[inset_0_0_60px_rgba(0,0,0,0.85)]" />
);

export default function DecodeFileModal({ file, onComplete, onClose, language = "en" }) {
  const [progress, setProgress] = useState(0);
  const [cryptoStream, setCryptoStream] = useState("");
  const [glitch, setGlitch] = useState(false);

  // Dosya türüne göre laboratuvar/klinik renk paleti eşlemesi
  const theme = useMemo(() => {
    if (file?.type === "map") return { text: "text-amber-400", border: "border-amber-500/30 shadow-[0_0_40px_rgba(245,158,11,0.05)]", corner: "border-amber-500/70" };
    if (file?.type === "log" || file?.type === "crew") return { text: "text-cyan-400", border: "border-cyan-500/30 shadow-[0_0_40px_rgba(34,211,238,0.05)]", corner: "border-cyan-500/70" };
    return { text: "text-emerald-400", border: "border-emerald-500/20 shadow-[0_0_40px_rgba(52,211,153,0.04)]", corner: "border-emerald-500/70" };
  }, [file?.type]);

  // 1. Organik İlerleme (Mikro Duraksamalı ve Değişken İvme)
  useEffect(() => {
    if (!file) return;

    setProgress(0);
    setGlitch(false);

    const duration = 2200; // Şifre çözme gerilim süresi (2.2 saniye)
    const startedAt = Date.now();
    let streamInterval;

    const updateProgress = () => {
      const elapsed = Date.now() - startedAt;
      let nextProgress = (elapsed / duration) * 100;

      // Sinyal yapaylığını kırmak için: Algoritma %42 ve %80 dolaylarında bellek temizliği simüle eder
      if (nextProgress > 42 && nextProgress < 49) nextProgress = 44;
      if (nextProgress > 80 && nextProgress < 85) nextProgress = 81;

      const rounded = Math.min(100, Math.round(nextProgress));
      setProgress(rounded);

      if (rounded < 100) {
        // Nöral gürültüye bağlı anlık veri bozulması (glitch) tetikle
        if (Math.random() > 0.98) {
          setGlitch(true);
          setTimeout(() => setGlitch(false), 80);
        }
        requestAnimationFrame(updateProgress);
      } else {
        clearInterval(streamInterval);
        // Tamamlandığında deşifre edilmiş veriyi ana sisteme aktarır
        setTimeout(() => {
          onComplete?.(file);
        }, 600);
      }
    };

    requestAnimationFrame(updateProgress);

    // 2. Canlı Akan Nöral Ham Veri Matrisi (Bozuk Sinyal Kodları)
    streamInterval = setInterval(() => {
      const chars = "01X_█░SESSION_ECHO_";
      let fakeStream = "";
      for (let i = 0; i < 4; i++) {
        fakeStream += chars[Math.floor(Math.random() * chars.length)];
      }
      setCryptoStream(`[RAW_FEED: ${fakeStream.trim()}]`);
    }, 70);

    return () => {
      clearInterval(streamInterval);
    };
  }, [file, onComplete]);

  // Hücresel Retro Blok Çubuğu (Yenilenen Kare Bloklar)
  const bar = useMemo(() => {
    const filled = Math.round(progress / 10);
    return "█".repeat(filled) + "░".repeat(10 - filled);
  }, [progress]);

  if (!file) return null;

  return (
    <div
      className="fixed inset-0 z-[190] grid place-items-center bg-black/85 backdrop-blur-xs p-4 select-none font-mono"
      onClick={onClose}
    >
      <ScanlineOverlay />

      <section
        className={[
          "relative z-[191] w-full max-w-lg border bg-black/95 p-6 border-b-2 rounded-xs transition-all duration-150",
          theme.border,
          glitch ? "animate-[screenGlitch_0.08s_infinite] scale-[1.01]" : ""
        ].join(" ")}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Klinik İnce Çizgi Braketleri */}
        <div className={`absolute -top-0.5 -left-0.5 h-3 w-3 border-t-2 border-l-2 ${theme.corner}`} />
        <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 border-b-2 border-r-2 ${theme.corner}`} />

        {/* Üst Klinik Sinyal Satırı */}
        <div className="flex items-center justify-between border-b border-neutral-900 pb-2.5 mb-4 text-[9px] text-neutral-500 tracking-widest font-bold">
          <span>COGNITIVE_DATA_RESTORATION</span>
          <span className="uppercase">INDEX_{file.type || "MEMORY"}</span>
        </div>

        {/* Dosya Başlığı */}
        <h2 className="mb-5 truncate text-xs tracking-[0.2em] text-zinc-300 font-bold uppercase pl-2 border-l border-neutral-800">
          {file.title || "COGNITIVE_RECOVERABLE_NODE.LOG"}
        </h2>

        {/* Laboratuvar Deşifre Hücresi */}
        <div className="border border-neutral-900 bg-neutral-950/40 p-4 font-mono rounded-xs relative">
          
          {/* Anlık Durum Göstergesi */}
          <div className="flex items-center justify-between mb-3">
            <p className={`text-[11px] tracking-[0.25em] font-black uppercase ${progress >= 100 ? "text-emerald-400" : theme.text}`}>
              {progress >= 100 ? "✓ EXTRES_CLEARANCE_GRANTED" : "⚡ PARSING_NEURAL_CELLS..."}
            </p>
            <span className="text-[8px] text-neutral-600 animate-pulse font-mono tracking-wider">
              {progress >= 100 ? "[STABLE_LOG]" : cryptoStream}
            </span>
          </div>

          {/* Kare Bloklu Yükleme Çubuğu */}
          <div className="text-base tracking-[0.15em] text-zinc-200 flex items-center justify-between border-y border-neutral-900/40 py-2.5 my-3">
            <span className="font-light tracking-[0.08em] opacity-80">{bar}</span>
            <span className={`font-black text-xs min-w-[40px] text-right ${progress >= 100 ? "text-emerald-400" : "text-zinc-400"}`}>
              {progress}%
            </span>
          </div>

          {/* Alt Durum Sızıntı Logu */}
          <p className="mt-3 text-[8px] tracking-[0.2em] text-neutral-500 uppercase">
            {progress >= 100
              ? "&gt; FILE MOUNTED // CORRELATING ELIAS MEMORY BUFFER"
              : "&gt; EXTRACTING DATA FROM SUBCONSCIOUS ARCHIVE"}
          </p>
        </div>
      </section>
    </div>
  );
}
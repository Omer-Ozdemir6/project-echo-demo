import { useEffect, useMemo, useState } from "react";

export default function DecodeFileModal({ file, onComplete, onClose, language = "en" }) {
  const [progress, setProgress] = useState(0);
  const [cryptoStream, setCryptoStream] = useState("");
  const [glitch, setGlitch] = useState(false);

  // Bulgu türüne göre yeraltı / sığınak renk paleti eşlemesi
  const theme = useMemo(() => {
    if (file?.type === "map") return { text: "text-amber-500", border: "border-amber-950 shadow-[0_0_40px_rgba(245,158,11,0.05)]", corner: "border-amber-600" };
    if (file?.type === "log" || file?.type === "crew") return { text: "text-stone-300", border: "border-stone-900", corner: "border-stone-600" };
    return { text: "text-rose-600", border: "border-rose-950 shadow-[0_0_40px_rgba(220,38,38,0.05)]", corner: "border-rose-700" };
  }, [file?.type]);

  // 1. Organik İlerleme (Mikro Duraksamalı ve Değişken İvme)
  useEffect(() => {
    if (!file) return;

    setProgress(0);
    setGlitch(false);

    const duration = 2200; // Sinyal ayrıştırma gerilim süresi (2.2 saniye)
    const startedAt = Date.now();
    let streamInterval;

    const updateProgress = () => {
      const elapsed = Date.now() - startedAt;
      let nextProgress = (elapsed / duration) * 100;

      // Mağara derinliği sismik parazit simülasyonu: Sinyal %42 ve %80 dolaylarında takılma yaşar
      if (nextProgress > 42 && nextProgress < 49) nextProgress = 44;
      if (nextProgress > 80 && nextProgress < 85) nextProgress = 81;

      const rounded = Math.min(100, Math.round(nextProgress));
      setProgress(rounded);

      if (rounded < 100) {
        // Telsiz gürültüsüne bağlı anlık dalga bozulması (glitch) tetikle
        if (Math.random() > 0.98) {
          setGlitch(true);
          setTimeout(() => setGlitch(false), 80);
        }
        requestAnimationFrame(updateProgress);
      } else {
        clearInterval(streamInterval);
        // Tamamlandığında ayrıştırılmış bulguyu sisteme aktarır
        setTimeout(() => {
          onComplete?.(file);
        }, 600);
      }
    };

    requestAnimationFrame(updateProgress);

    // 2. Canlı Akan Akustik Ham Veri Matrisi (Parazitli Ham Sinyal Kodları)
    streamInterval = setInterval(() => {
      const chars = "01X_█░REZONANS_K_";
      let fakeStream = "";
      for (let i = 0; i < 4; i++) {
        fakeStream += chars[Math.floor(Math.random() * chars.length)];
      }
      setCryptoStream(`[HAM_AKUSTİK: ${fakeStream.trim()}]`);
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
      className="fixed inset-0 z-[190] grid place-items-center bg-black/90 backdrop-blur-xs p-4 select-none font-mono"
      onClick={onClose}
    >
      {/* Tarama Çizgileri Perdesi */}
      <div className="pointer-events-none absolute inset-0 z-50 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.01),rgba(255,255,255,0.01)_2px,transparent_2px,transparent_5px)] opacity-25" />

      <section
        className={[
          "relative z-[191] w-full max-w-md border bg-neutral-950 p-6 border-b-2 rounded-xs transition-all duration-150",
          theme.border,
          glitch ? "animate-[screenGlitch_0.08s_infinite] scale-[1.01]" : ""
        ].join(" ")}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Antik Kesim Taş Braketleri */}
        <div className={`absolute -top-0.5 -left-0.5 h-3 w-3 border-t-2 border-l-2 ${theme.corner}`} />
        <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 border-b-2 border-r-2 ${theme.corner}`} />

        {/* Üst Akustik Sinyal Satırı */}
        <div className="flex items-center justify-between border-b border-stone-900 pb-2.5 mb-4 text-[8px] text-stone-600 tracking-widest font-black uppercase">
          <span>SİNYAL_VERİ_AYRIŞTIRMA</span>
          <span>DİZİN_{file.type || "BULGU"}</span>
        </div>

        {/* Bulgular Başlığı */}
        <h2 className="mb-5 truncate text-xs tracking-[0.18em] text-stone-300 font-bold uppercase pl-2 border-l border-stone-900">
          {file.title || "KATMAN_BULGU_AKTI.LOG"}
        </h2>

        {/* Telsiz Deşifre Hücresi */}
        <div className="border border-stone-900 bg-black p-4 font-mono rounded-xs relative">
          
          {/* Anlık Durum Göstergesi */}
          <div className="flex items-center justify-between mb-3">
            <p className={`text-[10px] tracking-[0.2em] font-bold uppercase m-0 ${progress >= 100 ? "text-amber-500" : theme.text}`}>
              {progress >= 100 ? "✓ FREKANS_KİLİDİ_SAĞLANDI" : "⚡ SİNYAL_DALGASI_FİLTRELENİYOR..."}
            </p>
            <span className="text-[8px] text-stone-700 animate-pulse font-mono tracking-wider">
              {progress >= 100 ? "[STABLE_LOG]" : cryptoStream}
            </span>
          </div>

          {/* Kare Bloklu Yükleme Çubuğu */}
          <div className="text-sm tracking-[0.15em] text-stone-300 flex items-center justify-between border-y border-stone-900/50 py-2.5 my-3">
            <span className="font-light tracking-[0.05em] opacity-60 text-xs">{bar}</span>
            <span className={`font-mono font-bold text-xs min-w-[40px] text-right ${progress >= 100 ? "text-amber-500" : "text-stone-500"}`}>
              %{progress}
            </span>
          </div>

          {/* Alt Durum Sızıntı Logu */}
          <p className="mt-3 text-[8px] tracking-[0.15em] text-stone-600 uppercase font-black m-0">
            {progress >= 100
              ? "&gt; VERİ ARŞİVE BAĞLANDI // AKUSTİK HARİTA GÜNCELLENİYOR"
              : "&gt; DERİN DEHLİZ AKUSTİK VERİSİ ÖN BELLEĞE ALINIYOR"}
          </p>
        </div>
      </section>
    </div>
  );
}
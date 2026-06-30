import { useEffect, useMemo, useState } from "react";

export default function DecodeFileModal({ file, onComplete, onClose, language = "en" }) {
  const [progress, setProgress] = useState(0);
  const [cryptoStream, setCryptoStream] = useState("");
  const [glitch, setGlitch] = useState(false);

  // Derinlik, taş ve antik bulgu türlerine göre yeraltı renk paleti eşlemesi
  const theme = useMemo(() => {
    // Haritalar ve Keşifler: Kadim parşömen, meşale ateşi ve altın amber tonları
    if (file?.type === "map") {
      return { 
        text: "text-amber-500", 
        border: "border-amber-950/70 shadow-[0_0_35px_rgba(245,158,11,0.04)]", 
        corner: "border-amber-700",
        badge: "bg-amber-950/40 text-amber-500 border-amber-900/60"
      };
    }
    // Günlükler ve Ekip Kayıtları: Rutubetli taşlar, askeri mat yeşil ve yosun tonları
    if (file?.type === "log" || file?.type === "crew") {
      return { 
        text: "text-emerald-600", 
        border: "border-stone-900 shadow-[inset_0_0_30px_rgba(0,0,0,0.95)]", 
        corner: "border-stone-600",
        badge: "bg-stone-900/50 text-stone-400 border-stone-800"
      };
    }
    // Kritik/Tehlikeli Bulgular: Derin çatlaklar, sığınak acil durum alarmı ve kan kırmızı tonlar
    return { 
      text: "text-rose-600", 
      border: "border-rose-950/50 shadow-[0_0_35px_rgba(220,38,38,0.04)]", 
      corner: "border-rose-800",
      badge: "bg-rose-950/40 text-rose-500 border-rose-900/60"
    };
  }, [file?.type]);

  // 1. Organik İlerleme (Sismik Duraksamalı Yeraltı Akustik Algoritması)
  useEffect(() => {
    if (!file) return;

    setProgress(0);
    setGlitch(false);

    const duration = 2200; // Sinyalin taştan süzülme süresi
    const startedAt = Date.now();
    let streamInterval;

    const updateProgress = () => {
      const elapsed = Date.now() - startedAt;
      let nextProgress = (elapsed / duration) * 100;

      // Sismik parazit simülasyonu: Sinyal yoğun taş katmanlarında (%42 ve %80) takılır
      if (nextProgress > 42 && nextProgress < 49) nextProgress = 43;
      if (nextProgress > 80 && nextProgress < 85) nextProgress = 81;

      const rounded = Math.min(100, Math.round(nextProgress));
      setProgress(rounded);

      if (rounded < 100) {
        // Mağara derinliği statik gürültüsü ve anlık sinyal kırılması
        if (Math.random() > 0.97) {
          setGlitch(true);
          setTimeout(() => setGlitch(false), 70);
        }
        requestAnimationFrame(updateProgress);
      } else {
        clearInterval(streamInterval);
        // Çözümleme bittiğinde veriyi antik arşive süz
        setTimeout(() => {
          onComplete?.(file);
        }, 600);
      }
    };

    requestAnimationFrame(updateProgress);

    // 2. Canlı Akan Akustik Ham Veri (Kadim Rün ve Sismik Dalga Sembolleri)
    streamInterval = setInterval(() => {
      const chars = "▒░█▓ΔΩΘΞ𐎔𐏟_YANKI_K";
      let fakeStream = "";
      for (let i = 0; i < 4; i++) {
        fakeStream += chars[Math.floor(Math.random() * chars.length)];
      }
      setCryptoStream(`[REZONANS: ${fakeStream.trim()}]`);
    }, 80);

    return () => {
      clearInterval(streamInterval);
    };
  }, [file, onComplete]);

  // Hücresel Taş Blok Çubuğu
  const bar = useMemo(() => {
    const filled = Math.round(progress / 10);
    return "█".repeat(filled) + "░".repeat(10 - filled);
  }, [progress]);

  if (!file) return null;

  return (
    <div
      className="fixed inset-0 z-[190] grid place-items-center bg-black/95 backdrop-blur-xs p-4 select-none font-mono"
      onClick={onClose}
    >
      {/* RUTUBET VE DEHLİZ HAVA KATMANI (FAINT GRID EFFECT) */}
      <div className="pointer-events-none absolute inset-0 z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_6px] opacity-20 mix-blend-overlay" />

      <section
        className={[
          "relative z-[191] w-full max-w-md border bg-gradient-to-b from-stone-950 to-neutral-950 p-6 rounded-xs transition-all duration-150 border-stone-900/80",
          theme.border,
          glitch ? "animate-[screenGlitch_0.1s_infinite] opacity-90 translate-y-[0.5px]" : ""
        ].join(" ")}
        onClick={(event) => event.stopPropagation()}
      >
        {/* ANTİK KESİM TAŞ BRAKETLERİ (KÖŞE DETAYLARI) */}
        <div className={`absolute -top-0.5 -left-0.5 h-3 w-3 border-t-2 border-l-2 ${theme.corner}`} />
        <div className={`absolute -top-0.5 -right-0.5 h-3 w-3 border-t-2 border-r-2 ${theme.corner}`} />
        <div className={`absolute -bottom-0.5 -left-0.5 h-3 w-3 border-b-2 border-l-2 ${theme.corner}`} />
        <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 border-b-2 border-r-2 ${theme.corner}`} />

        {/* ÜST AKUSTİK SİNYAL SATIRI */}
        <div className="flex items-center justify-between border-b border-stone-900 pb-2.5 mb-4 text-[8px] text-stone-600 tracking-[0.2em] font-black uppercase">
          <div className="flex items-center gap-1.5">
            <span className={`w-1 h-1 rounded-full ${progress >= 100 ? 'bg-amber-600' : 'bg-stone-700 animate-pulse'}`} />
            <span>KADİM_YANKI_ANALİZÖRÜ</span>
          </div>
          <span>KOD_DEHLİZ_30</span>
        </div>

        {/* BULGULAR VE ANALİZ KATMANI BAŞLIĞI */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="m-0 truncate text-xs tracking-[0.15em] text-stone-400 font-bold uppercase pl-2 border-l border-stone-800">
            {file.title || "KATMAN_BULGU_AKTI.LOG"}
          </h2>
          <span className={`shrink-0 text-[8px] font-black tracking-widest border px-1.5 py-0.5 rounded-2xs uppercase ${theme.badge}`}>
            {file.type || "BULGU"}
          </span>
        </div>

        {/* TELSİZ VE DEŞİFRE HÜCRESİ (DEEP EXPEDITION INTERFACE) */}
        <div className="border border-stone-950 bg-black/80 p-4 font-mono rounded-xs relative shadow-[inset_0_0_15px_rgba(0,0,0,0.9)]">
          
          {/* Anlık Durum Göstergesi */}
          <div className="flex items-center justify-between mb-3.5">
            <p className={`text-[10px] tracking-[0.15em] font-bold uppercase m-0 ${progress >= 100 ? "text-amber-500" : theme.text}`}>
              {progress >= 100 ? "✓ REZONANS_DENGELENDİ" : "⚓ DEHLİZ_SESİ_FİLTRELENİYOR..."}
            </p>
            <span className="text-[8px] text-stone-600 font-mono tracking-wider shrink-0">
              {progress >= 100 ? "[HARİTALANDI]" : cryptoStream}
            </span>
          </div>

          {/* Kare Bloklu Yükleme Çubuğu */}
          <div className="text-sm tracking-[0.12em] text-stone-400 flex items-center justify-between border-y border-stone-900/60 py-3 my-3 bg-neutral-950/50 px-2 rounded-2xs">
            <span className="font-light tracking-[0.05em] text-stone-600 text-xs selection:bg-transparent">{bar}</span>
            <span className={`font-mono font-bold text-xs min-w-[35px] text-right ${progress >= 100 ? "text-amber-500" : "text-stone-500"}`}>
              %{progress}
            </span>
          </div>

          {/* Alt Durum Sızıntı Logu */}
          <div className="mt-3 text-[8px] tracking-[0.12em] text-stone-600 uppercase font-black m-0 flex items-start">
            <span className="text-stone-800 mr-1.5 font-black">&gt;</span>
            <p className="m-0 flex-1 leading-normal">
              {progress >= 100
                ? "KADİM KATMAN VERİSİ ÇÖZÜLDÜ // TABLOLAŞTIRMA TAMAM"
                : "TAŞ BLOKLARDAN YANSIYAN SES FREKANSLARI DERLENİYOR"}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
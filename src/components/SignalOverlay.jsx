import { useEffect, useState } from "react";
import { getGameText } from "../i18n/gameText";

export default function SignalOverlay({ status, language = "en" }) {
  const [isVisible, setIsVisible] = useState(true);
  const [shouldRender, setShouldRender] = useState(false);

  const isLost = status?.type === "lost";
  const isRestored = status?.type === "restored";

  // Bağlantı durum değişikliklerini yöneten ve otomatik kapanma sağlayan sinematik zamanlayıcı
  useEffect(() => {
    if (!status) {
      setShouldRender(false);
      return;
    }

    setShouldRender(true);
    setIsVisible(true);

    // Eğer bağlantı geri geldiyse (restored), ekranda 1.5 saniye parlayıp yumuşakça kaybolsun
    if (isRestored) {
      const fadeTimer = setTimeout(() => {
        setIsVisible(false);
      }, 1500);

      const removeTimer = setTimeout(() => {
        setShouldRender(false);
      }, 2000); // Fade out animasyonunun bitişi

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(removeTimer);
      };
    }
  }, [status, isRestored]);

  if (!shouldRender || !status) return null;

  const headerText = getGameText(
    "signal.transmissionStatus",
    language === "tr" ? "İLETİM DURUMU" : "TRANSMISSION STATUS",
    language
  );

  return (
    <div 
      className={[
        "pointer-events-none fixed inset-0 z-[80] flex items-center justify-center font-mono select-none transition-all duration-500",
        isVisible ? "opacity-100" : "opacity-0 filter blur-sm"
      ].join(" ")}
    >
      {/* Arka Plan Perdesi - Kopma anında hafif kırmızı, restorasyonda hafif yeşil camgöbeği */}
      <div
        className={[
          "absolute inset-0 transition-colors duration-500",
          isLost
            ? "bg-rose-950/20 backdrop-blur-[1px]"
            : isRestored
              ? "bg-emerald-950/10"
              : "bg-slate-950/40"
        ].join(" ")}
      />

      {/* 1. KATMAN: Telsiz Parazit Efekti (Sadece bağlantı tamamen koptuğunda devreye girer) */}
      {isLost && (
        <div 
          className="absolute inset-0 opacity-[0.12] mix-blend-screen pointer-events-none"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, #ffffff 2px, #ffffff 4px)"
          }}
        />
      )}

      {/* Ana Bildirim Paneli */}
      <div
        className={[
          "relative border p-6 min-w-[280px] sm:min-w-[360px]",
          "bg-slate-950/90 backdrop-blur-md shadow-[0_0_50px_rgba(0,0,0,0.65)]",
          isLost
            ? "border-rose-500/60 text-rose-400 animate-[screenGlitch_0.2s_infinite]" // Kopma anında panel sarsılır ve titrer
            : isRestored
              ? "border-emerald-400/60 text-emerald-300 animate-pulse"
              : "border-cyan-400/50 text-cyan-300 animate-pulse"
        ].join(" ")}
      >
        {/* Dekoratif Köşe Çizgileri (Klinik Endüstriyel Arayüz Hissi) */}
        <div className={`absolute -top-1 -left-1 h-3 w-3 border-t-2 border-l-2 ${isLost ? "border-rose-400" : isRestored ? "border-emerald-400" : "border-cyan-400"}`} />
        <div className={`absolute -bottom-1 -right-1 h-3 w-3 border-b-2 border-r-2 ${isLost ? "border-rose-400" : isRestored ? "border-emerald-400" : "border-cyan-400"}`} />

        <div className="text-center">
          {/* Durum Başlığı */}
          <div className="mb-2 text-[10px] tracking-[0.4em] opacity-50 uppercase">
            {headerText}
          </div>

          {/* Dinamik Durum Mesajı */}
          <p className={[
            "text-center tracking-[0.2em] uppercase font-bold text-xs sm:text-sm",
            isLost ? "drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]" : ""
          ].join(" ")}>
            {isLost ? `⚠️ ${status.message}` : isRestored ? `⚡ ${status.message}` : status.message}
          </p>
        </div>
      </div>
    </div>
  );
}
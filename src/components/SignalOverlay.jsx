import { useEffect, useState, useMemo } from "react";
import { getGameText } from "../i18n/gameText";

export default function SignalOverlay({ status, language = "en" }) {
  const [isVisible, setIsVisible] = useState(true);
  const [shouldRender, setShouldRender] = useState(false);
  const [liveDb, setLiveDb] = useState(-14.2); // Telsiz rezonans dalgalanma metriği

  const isLost = status?.type === "lost";
  const isRestored = status?.type === "restored";

  // Telsiz sinyal gücünü canlı simüle eden mikro döngü
  useEffect(() => {
    if (!shouldRender || isLost) return;
    
    const dbInterval = setInterval(() => {
      // Sığınak derinliklerinde -12.0 ile -15.5 dB arasında gerçekçi analog dalgalanma
      setLiveDb((prev) => {
        const jitter = (Math.random() - 0.5) * 0.8;
        const next = prev + jitter;
        return Math.max(-18.0, Math.min(-10.5, next));
      });
    }, 300);

    return () => clearInterval(dbInterval);
  }, [shouldRender, isLost]);

  // Zamanlayıcı ve akış yönetimi
  useEffect(() => {
    if (!status) {
      setShouldRender(false);
      return;
    }

    setShouldRender(true);
    setIsVisible(true);

    if (isLost) {
      setLiveDb(-99.9); // Sinyal koptuğunda desibel tabana vurur
    }

    if (isRestored) {
      setLiveDb(-12.4); // Sinyal geri geldiğinde ideal rezonansa oturur
      
      const fadeTimer = setTimeout(() => {
        setIsVisible(false);
      }, 2200);

      const removeTimer = setTimeout(() => {
        setShouldRender(false);
      }, 2800);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(removeTimer);
      };
    }
  }, [status, isRestored, isLost]);

  // Antik Taş ve Mağara Atmosferi Tema Renk Yönetimi
  const theme = useMemo(() => {
    if (isLost) return {
      border: "border-rose-950 shadow-[0_0_40px_rgba(220,38,38,0.1)]",
      text: "text-rose-600",
      accent: "text-rose-700",
      badge: "bg-rose-950/40 text-rose-500 border-rose-900",
      corner: "border-rose-700",
      pulse: "animate-pulse"
    };
    if (isRestored) return {
      border: "border-amber-900 shadow-[0_0_40px_rgba(245,158,11,0.1)]",
      text: "text-amber-500",
      accent: "text-amber-600",
      badge: "bg-amber-950/40 text-amber-500 border-amber-900",
      corner: "border-amber-600",
      pulse: "animate-pulse"
    };
    return {
      border: "border-stone-800",
      text: "text-stone-400",
      accent: "text-stone-500",
      badge: "bg-stone-900/40 text-stone-400 border-stone-800",
      corner: "border-stone-700",
      pulse: "animate-pulse"
    };
  }, [isLost, isRestored]);

  if (!shouldRender || !status) return null;

  const headerText = getGameText(
    "signal.transmissionStatus",
    language === "tr" ? "TELSİZ REZONANS DURUMU" : "RADIO FREQUENCY STATUS",
    language
  );

  return (
    <div 
      className={[
        "pointer-events-none fixed inset-0 z-[180] flex items-center justify-center font-mono select-none transition-all duration-700",
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-[0.98] filter blur-md"
      ].join(" ")}
    >
      {/* CSS Enjeksiyonu: Yer Altı Analog Parazit ve Dalga Efektleri */}
      <style>{`
        @keyframes scanlineMove {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .analog-noise {
          background-image: repeating-linear-gradient(0deg, rgba(0,0,0,0.25), rgba(0,0,0,0.25) 1px, transparent 1px, transparent 4px);
          animation: scanlineMove 10s linear infinite;
        }
        .analog-noise::before {
          content: " ";
          display: block;
          position: absolute;
          inset: 0;
          background: rgba(185, 28, 28, 0.03);
          opacity: ${isLost ? 1 : 0};
        }
      `}</style>

      {/* Arka Plan Mağara/Sığınak Karartma Filtresi */}
      <div
        className={[
          "absolute inset-0 transition-colors duration-700",
          isLost ? "bg-rose-950/20 backdrop-blur-[1px]" : isRestored ? "bg-amber-950/5 backdrop-blur-xs" : "bg-black/50"
        ].join(" ")}
      />

      {/* Canlı Tarama Çizgisi Perdesi */}
      <div className="absolute inset-0 analog-noise pointer-events-none z-10" />

      {/* ANA PANEL */}
      <div
        className={[
          "relative border p-6 min-w-[300px] sm:min-w-[380px] rounded-xs bg-neutral-950/98 shadow-2xl backdrop-blur-md transition-all duration-300",
          theme.border, theme.pulse
        ].join(" ")}
      >
        {/* Endüstriyel Taş/Metal Köşe Braketleri */}
        <div className={`absolute -top-1 -left-1 h-3 w-3 border-t-2 border-l-2 ${theme.corner}`} />
        <div className={`absolute -bottom-1 -right-1 h-3 w-3 border-b-2 border-r-2 ${theme.corner}`} />

        {/* Panel Üst Küçük Süs Verileri */}
        <div className="flex items-center justify-between border-b border-stone-900 pb-2.5 mb-4 text-[8px] text-stone-600 tracking-widest font-black uppercase">
          <span>FREK_RELAY_v2.8</span>
          <span className={theme.text}>
            {isLost ? "GAIN: -INF" : `GAIN: ${liveDb.toFixed(1)} dB`}
          </span>
        </div>

        {/* Merkez Gövde */}
        <div className="text-center relative">
          {/* Arka Plan Filigranı */}
          <div className={`absolute inset-0 flex items-center justify-center opacity-[0.015] text-4xl font-black ${theme.text}`}>
            {isLost ? "ERR" : "LINK"}
          </div>

          <div className={`mb-2 text-[8px] tracking-[0.4em] uppercase font-black ${theme.accent}`}>
            {headerText}
          </div>

          {/* Dinamik Durum Mesajı */}
          <p className={[
            "text-center tracking-[0.15em] uppercase font-bold text-xs my-3 font-mono",
            theme.text,
            isLost ? "drop-shadow-[0_0_10px_rgba(220,38,38,0.4)]" : "drop-shadow-[0_0_10px_rgba(245,158,11,0.25)]"
          ].join(" ")}>
            {isLost ? `[ ☠ ] ${status.message}` : isRestored ? `[ ✓ ] ${status.message}` : status.message}
          </p>
        </div>

        {/* Alt Sinyal Durum Çubuğu */}
        <div className="mt-4 pt-2.5 border-t border-stone-900 flex items-center justify-between text-[8px] text-stone-600 tracking-widest font-bold uppercase">
          <div className="flex items-center gap-1.5">
            <span className={`w-1 h-1 rounded-full ${isLost ? "bg-rose-600 animate-ping" : "bg-amber-500"}`} />
            <span>{isLost ? "HAT_KESİLDİ" : "FREKANS_YAKALANDI"}</span>
          </div>
          <span className="font-mono opacity-50">
            {isLost ? "SIGNAL_ERR_0x04" : "RE_ROUTING_OK"}
          </span>
        </div>
      </div>
    </div>
  );
}
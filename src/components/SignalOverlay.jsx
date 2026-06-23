import { useEffect, useState, useMemo } from "react";
import { getGameText } from "../i18n/gameText";

function resolveConfigText(value, language = "en") {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    return getGameText(value.textKey, value.text || "", language);
  }
  return "";
}

export default function SignalOverlay({ status, language = "en" }) {
  const [isVisible, setIsVisible] = useState(true);
  const [shouldRender, setShouldRender] = useState(false);
  const [liveDb, setLiveDb] = useState(-14.2); // Anlık sinyal dalgalanma metriği

  const isLost = status?.type === "lost";
  const isRestored = status?.type === "restored";

  // Sinyal gücünü canlı simüle eden mikro döngü
  useEffect(() => {
    if (!shouldRender || isLost) return;
    
    const dbInterval = setInterval(() => {
      // Sinyal stabilken -12.0 ile -15.5 dB arasında gerçekçi mikro dalgalanma
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
      setLiveDb(-99.9); // Sinyal koptuğunda desibel tabana vurur (-Infinity)
    }

    if (isRestored) {
      setLiveDb(-12.4); // Sinyal geri geldiğinde ideal değere oturur
      
      const fadeTimer = setTimeout(() => {
        setIsVisible(false);
      }, 2200); // Oyuncunun durum loglarını okuması için süre hafifçe esnetildi

      const removeTimer = setTimeout(() => {
        setShouldRender(false);
      }, 2800);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(removeTimer);
      };
    }
  }, [status, isRestored, isLost]);

  // Tema Renk Yönetimi
  const theme = useMemo(() => {
    if (isLost) return {
      border: "border-rose-600 shadow-[0_0_40px_rgba(225,29,72,0.15)]",
      text: "text-rose-400",
      accent: "text-rose-600",
      badge: "bg-rose-950 text-rose-400 border-rose-800",
      corner: "border-rose-500",
      pulse: "animate-[screenGlitch_0.1s_infinite]"
    };
    if (isRestored) return {
      border: "border-emerald-500 shadow-[0_0_40px_rgba(52,211,153,0.15)]",
      text: "text-emerald-400",
      accent: "text-emerald-600",
      badge: "bg-emerald-950 text-emerald-400 border-emerald-800",
      corner: "border-emerald-400",
      pulse: "animate-pulse"
    };
    return {
      border: "border-cyan-500",
      text: "text-cyan-400",
      accent: "text-cyan-600",
      badge: "bg-cyan-950 text-cyan-400 border-cyan-800",
      corner: "border-cyan-400",
      pulse: "animate-pulse"
    };
  }, [isLost, isRestored]);

  if (!shouldRender || !status) return null;

  const headerText = getGameText(
    "signal.transmissionStatus",
    language === "tr" ? "İLETİM DURUMU" : "TRANSMISSION STATUS",
    language
  );

  return (
    <div 
      className={[
        "pointer-events-none fixed inset-0 z-[180] flex items-center justify-center font-mono select-none transition-all duration-700",
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-[0.98] filter blur-md"
      ].join(" ")}
    >
      {/* CSS Enjeksiyonu: Gerçekçi Analog Karlanma ve Parazit Dalga Efektleri */}
      <style>{`
        @keyframes scanlineMove {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .analog-noise {
          background-image: repeating-linear-gradient(0deg, rgba(0,0,0,0.2), rgba(0,0,0,0.2) 1px, transparent 1px, transparent 3px);
          animation: scanlineMove 8s linear infinite;
        }
        .analog-noise::before {
          content: " ";
          display: block;
          position: absolute;
          inset: 0;
          background: rgba(244, 63, 94, 0.02);
          opacity: ${isLost ? 1 : 0};
        }
      `}</style>

      {/* Arka Plan Cam Küre Filtresi */}
      <div
        className={[
          "absolute inset-0 transition-colors duration-700",
          isLost ? "bg-rose-950/25 backdrop-blur-[2px]" : isRestored ? "bg-emerald-950/12 backdrop-blur-xs" : "bg-black/40"
        ].join(" ")}
      />

      {/* Canlı Tarama Çizgisi Perdesi */}
      <div className="absolute inset-0 analog-noise pointer-events-none z-10" />

      {/* ANA PANEL */}
      <div
        className={[
          "relative border-2 p-6 min-w-[300px] sm:min-w-[400px] rounded-sm bg-black/95 shadow-2xl backdrop-blur-md transition-all duration-300",
          theme.border, theme.pulse
        ].join(" ")}
      >
        {/* Endüstriyel Köşe Braketleri */}
        <div className={`absolute -top-1.5 -left-1.5 h-3.5 w-3.5 border-t-4 border-l-4 ${theme.corner}`} />
        <div className={`absolute -bottom-1.5 -right-1.5 h-3.5 w-3.5 border-b-4 border-r-4 ${theme.corner}`} />

        {/* Panel Üst Küçük Süs Verileri */}
        <div className="flex items-center justify-between border-b border-neutral-900 pb-2.5 mb-4 text-[9px] text-neutral-500 tracking-widest font-bold">
          <span>NET_TRANS_RELAY_v2.8</span>
          <span className={theme.text}>
            {isLost ? "DB_GAIN: -INF" : `DB_GAIN: ${liveDb.toFixed(1)} dB`}
          </span>
        </div>

        {/* Merkez Gövde */}
        <div className="text-center relative">
          {/* Arka Plan Büyük Şematik İkon Su Damgası */}
          <div className={`absolute inset-0 flex items-center justify-center opacity-[0.02] text-5xl font-black ${theme.text}`}>
            {isLost ? "ERR" : "SYNC"}
          </div>

          <div className={`mb-2 text-[9px] tracking-[0.45em] uppercase font-black ${theme.accent}`}>
            {headerText}
          </div>

          {/* Dinamik Durum Mesajı */}
          <p className={[
            "text-center tracking-[0.18em] uppercase font-black text-xs sm:text-sm my-3 font-mono",
            theme.text,
            isLost ? "drop-shadow-[0_0_12px_rgba(244,63,94,0.6)]" : "drop-shadow-[0_0_12px_rgba(52,211,153,0.4)]"
          ].join(" ")}>
            {isLost ? `[ ☠ ] ${status.message}` : isRestored ? `[ ✓ ] ${status.message}` : status.message}
          </p>
        </div>

        {/* Alt Sinyal Durum Çubuğu (Klinik Grafik) */}
        <div className="mt-4 pt-2.5 border-t border-neutral-900 flex items-center justify-between text-[9px] text-neutral-500 tracking-wider">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isLost ? "bg-rose-500 animate-ping" : "bg-emerald-400"}`} />
            <span className="uppercase">{isLost ? "LINK_TERMINATED" : "STREAM_RE_ESTABLISHED"}</span>
          </div>
          <span className="font-mono opacity-60">
            {isLost ? "ADDR_FAULT_0x04" : "RE-ROUTING_COMPLETE"}
          </span>
        </div>
      </div>
    </div>
  );
}
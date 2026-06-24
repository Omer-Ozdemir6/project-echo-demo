import { useEffect, useState, useRef } from "react";
import { getGameText } from "../i18n/gameText";

function resolveConfigText(value, language = "en", fallback = "") {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    return getGameText(value.textKey, value.text || fallback, language);
  }
  return fallback;
}

export default function RebootConfirmScreen({
  config,
  onRestart,
  language = "en"
}) {
  const [countdown, setCountdown] = useState(config?.countdownSeconds || 10);
  const [isRestarting, setIsRestarting] = useState(false);
  const [glitchTrigger, setGlitchTrigger] = useState(false);
  const [dynamicLogs, setDynamicLogs] = useState([]);

  const canvasRef = useRef(null);
  const audioRef = useRef(null);

  // Dil destekli yeni yerel/kültürel text tanımlamaları
  const kicker = getGameText(config?.kickerKey, config?.kicker || "SİNYAL REZONANS KAYBI // DERİN KATMAN", language);
  const title = getGameText(config?.titleKey, config?.title || "TELSİZ FREKANSI ÇÖKÜŞÜ", language);
  const restartingText = getGameText(config?.restartingTextKey, config?.restartingText || "TELSİZ KÖPRÜSÜ YENİDEN BAĞLANIYOR...", language);
  const countdownLabel = getGameText(config?.countdownLabelKey, config?.countdownLabel || "HAT SIFIRLAMA SEKANSI BAŞLANGICI:", language);
  const buttonLoadingText = getGameText(config?.buttonLoadingTextKey, config?.buttonLoadingText || "BAĞLANILIYOR...", language);
  const buttonText = getGameText(config?.buttonTextKey, config?.buttonText || "FREKANSI ZORLA (KÖPRÜ KUR)", language);

  // 1. Dinamik Yer Altı Akustik Bozulma Efekti (Canvas)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;
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
      // Geri sayım azaldıkça sismik titreşim dalgası vahşileşir
      const severity = isRestarting ? 45 : (11 - countdown) * 4;

      ctx.beginPath();
      ctx.lineWidth = isRestarting ? 2.5 : 1.2;
      ctx.strokeStyle = isRestarting ? `rgba(245, 158, 11, 0.3)` : `rgba(185, 28, 28, 0.15)`; // Amber veya Pas kırmızısı sismik hat

      for (let x = 0; x < canvas.width; x += 5) {
        const noise = Math.sin(x * 0.01 + frame * 0.2) * Math.cos(x * 0.005 - frame * 0.05) * severity;
        const glitch = Math.random() > 0.98 ? (Math.random() - 0.5) * severity * 2 : 0;
        
        if (x === 0) ctx.moveTo(x, midY + noise + glitch);
        else ctx.lineTo(x, midY + noise + glitch);
      }
      ctx.stroke();

      animationFrameId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [countdown, isRestarting]);

  // 2. Rastgele Mağara Arıza ve Sinyal Logları Akışı
  useEffect(() => {
    if (isRestarting) return;
    const extraLogs = [
      "HAT: Sinyal kazanımı %12 altına düştü.",
      "ANOMALİ: Jones Aydın panik atağı tetiklendi.",
      "KARALTI: Yakın alan rezonans mırıldanması.",
      "HAVA_SEVİYESİ: Statik oksijen tüketimi hızlandı."
    ];

    const logInterval = setInterval(() => {
      if (Math.random() > 0.4) {
        const randomLog = extraLogs[Math.floor(Math.random() * extraLogs.length)];
        setDynamicLogs((prev) => [randomLog, ...prev.slice(0, 2)]);
        setGlitchTrigger(true);
        setTimeout(() => setGlitchTrigger(false), 80);
      }
    }, 2000);

    return () => clearInterval(logInterval);
  }, [isRestarting]);

  // Geri sayım sarsıntısı (Süre azaldıkça sarsıntı artar)
  useEffect(() => {
    setGlitchTrigger(true);
    const duration = isRestarting ? 400 : Math.max(80, countdown * 30);
    const t = setTimeout(() => setGlitchTrigger(false), duration);
    return () => clearTimeout(t);
  }, [countdown, isRestarting]);

  // Geri sayım döngüsü
  useEffect(() => {
    if (isRestarting) return;

    if (countdown <= 0) {
      handleRestart();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, isRestarting]);

  function handleRestart() {
    if (isRestarting) return;
    setIsRestarting(true);
    setGlitchTrigger(true);

    setTimeout(() => {
      onRestart();
    }, config?.restartDelayMs || 1500);
  }

  const crtOverlay = (
    <div className="pointer-events-none fixed inset-0 z-50 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.01),rgba(255,255,255,0.01)_2px,transparent_2px,transparent_5px)] opacity-35 shadow-[inset_0_0_80px_rgba(0,0,0,0.95)]" />
  );

  return (
    <main 
      className={[
        "relative grid min-h-dvh place-items-center overflow-hidden bg-black p-4 font-mono select-none text-stone-200",
        isRestarting ? "animate-pulse" : glitchTrigger ? "animate-[screenGlitch_0.12s_infinite]" : ""
      ].join(" ")}
    >
      <audio ref={audioRef} />
      
      {/* Sismik Arka Plan Dalgalanması */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-90" />
      {crtOverlay}

      <section 
        className={[
          "relative z-10 w-full max-w-2xl border bg-neutral-950 p-6 shadow-2xl transition-all duration-500 border-b-2 rounded-xs backdrop-blur-md",
          isRestarting 
            ? "border-amber-900 shadow-[0_0_50px_rgba(245,158,11,0.1)]" 
            : "border-stone-900 shadow-[0_0_40px_rgba(0,0,0,0.8)]"
        ].join(" ")}
      >
        {/* Terminal Üst Bilgi Satırı */}
        <div className="flex items-center justify-between border-b border-stone-900 pb-3 mb-5 text-[8px] tracking-widest font-black uppercase">
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 bg-rose-600 rounded-full animate-ping" />
            <p className="m-0 text-rose-600">
              {kicker}
            </p>
          </div>
          <span className="text-stone-600">
            SIGNAL_STABLE: FALSE
          </span>
        </div>

        {/* Ana Başlık */}
        <h1 className="mb-6 text-xs tracking-[0.22em] text-rose-600 font-bold uppercase border-l-2 border-rose-800 pl-3">
          {title}
        </h1>

        {/* Antik Bölge Bulguları & Canlı Simüle Edilen Arıza Logları */}
        <div className="mb-6 border border-stone-900/60 bg-black/50 p-4 space-y-2.5 max-h-[160px] overflow-hidden rounded-xs">
          {(config?.warnings || [
            "UYARI: Jones Aydın'ın telsiz frekansı derin dehlizlerde sismik engellere takılıyor.",
            "KRİTİK: Bağlantı kurulan öznenin yaşamsal ritminde akut panik sapması tespit edildi.",
            "KATMAN PROJESİ TALİMATI: Akustik yansımalara ve mırıldanmalara yanıt vermeyin. Telsiz köprüsünün kopması durumunda rezonansı manuel olarak zorlayın."
          ]).map((warning, index) => {
            const warningText = resolveConfigText(warning, language);
            return (
              <p key={`warn-${index}`} className="text-[11px] leading-relaxed tracking-wide text-stone-500 text-justify">
                <span className="text-stone-700 font-bold">&gt;</span> {warningText}
              </p>
            );
          })}

          {/* Canlı Akıcı Loglar */}
          {dynamicLogs.map((log, index) => (
            <p key={`dyn-${index}`} className="text-[11px] tracking-wide text-rose-500/80 font-bold animate-[bootLineIn_0.1s_ease-out_both]">
              <span className="text-rose-800 font-black">!!</span> {log}
            </p>
          ))}
        </div>

        {/* Geri Sayım / Şok Alanı */}
        <div className="mb-6 border border-stone-900/60 bg-stone-950/40 p-4 text-[10px] tracking-[0.2em] text-stone-500 flex items-center justify-between rounded-xs">
          {isRestarting ? (
            <span className="text-amber-500 font-bold tracking-[0.15em] uppercase flex items-center gap-2">
              <span className="animate-spin text-xs">⚡</span> {restartingText}
            </span>
          ) : (
            <div className="w-full flex items-center justify-between font-mono font-bold uppercase">
              <span>{countdownLabel}</span>
              <strong className="text-xl text-rose-600 font-black tracking-normal drop-shadow-[0_0_10px_rgba(220,38,38,0.45)]">
                {countdown === 3 ? "⚠" : countdown === 1 ? "ERR" : `${countdown}S`}
              </strong>
            </div>
          )}
        </div>

        {/* Override / Re-ignition Butonu */}
        <button
          type="button"
          className={[
            "w-full border py-4 text-[10px] tracking-[0.3em] font-bold uppercase transition-all duration-300 rounded-xs",
            isRestarting
              ? "border-amber-900 bg-amber-950/10 text-amber-600 cursor-not-allowed"
              : "border-stone-800 bg-stone-900/20 text-stone-400 hover:border-amber-900 hover:bg-amber-950/10 hover:text-amber-500 active:scale-[0.99]"
          ].join(" ")}
          onClick={handleRestart}
          disabled={isRestarting}
        >
          {isRestarting ? buttonLoadingText : buttonText}
        </button>
      </section>

      {/* Sağ Alttaki Frekans Arama Spinner Grubu */}
      <div className="fixed bottom-6 right-6 flex items-center gap-4 opacity-30 z-30 font-black">
        <span className="text-[8px] tracking-[0.25em] text-stone-600 font-bold uppercase">
          {isRestarting ? "FORCE_RADIO_OVERDRIVE_" : "TUNNEL_RESONANCE_CRIT_"}
        </span>
        <div className="relative w-5 h-5 animate-spin" style={{ animationDuration: isRestarting ? "0.5s" : "4s" }}>
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-rose-600 rounded-full"
              style={{
                top: `${50 + 35 * Math.sin((i * Math.PI) / 4)}%`,
                left: `${50 + 35 * Math.cos((i * Math.PI) / 4)}%`,
                transform: "translate(-50%, -50%)",
                opacity: (i + 1) / 8
              }}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
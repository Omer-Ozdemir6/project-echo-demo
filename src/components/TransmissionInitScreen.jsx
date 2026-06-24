import { useEffect, useState, useRef } from "react";

const ScanlineOverlay = () => (
  <div className="pointer-events-none fixed inset-0 z-50 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.015),rgba(255,255,255,0.015)_2px,transparent_2px,transparent_5px)] opacity-30 shadow-[inset_0_0_80px_rgba(0,0,0,0.85)]" />
);

// Harf harf daktilo efekti üreten mikro bileşen (Atmosferi uçuracak detay)
function TypewriterLine({ text, speed = 25, onLineComplete }) {
  const [displayedText, setDisplayedText] = useState("");
  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayedText("");

    const interval = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayedText((prev) => prev + text.charAt(indexRef.current));
        indexRef.current += 1;
      } else {
        clearInterval(interval);
        onLineComplete?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, onLineComplete]);

  return <span>{displayedText}</span>;
}

export default function TransmissionInitScreen({ config, onComplete }) {
  const [visibleLines, setVisibleLines] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [lineActive, setLineActive] = useState(false); // Daktilo yazma kontrolü
  const [glitch, setGlitch] = useState(false);

  const sequence = config?.sequence || [];

  // Anlık nöral gürültü / parazit (glitch) tetikleyici döngü
  useEffect(() => {
    if (isComplete) return;
    const glitchInterval = setInterval(() => {
      if (Math.random() > 0.85) {
        setGlitch(true);
        setTimeout(() => setGlitch(false), 90);
      }
    }, 2000);
    return () => clearInterval(glitchInterval);
  }, [isComplete]);

  useEffect(() => {
    if (isComplete) return;

    if (!sequence.length) {
      setIsComplete(true);
      onComplete?.();
      return;
    }

    // Tüm dizi bittiğinde güvenli kapanış geçişi
    if (currentIndex >= sequence.length) {
      const completeDelay = config?.completeDelayMs || 1000;
      const completeTimer = setTimeout(() => {
        setIsComplete(true);
        onComplete?.();
      }, completeDelay);

      return () => clearTimeout(completeTimer);
    }

    // Eğer o an bir satır daktilo ile yazılıyorsa yenisine geçmeyi beklet
    if (lineActive) return;

    const currentLine = sequence[currentIndex];
    const timer = setTimeout(() => {
      setVisibleLines((prev) => [...prev, currentLine]);
      setLineActive(true);
    }, currentLine.delayMs || 400);

    return () => clearTimeout(timer);
  }, [currentIndex, sequence, config, onComplete, isComplete, lineActive]);

  return (
    <main 
      className={[
        "relative grid min-h-dvh place-items-center overflow-hidden bg-black p-4 text-cyan-50/90 font-mono select-none transition-all duration-500",
        glitch ? "animate-[screenGlitch_0.08s_infinite] scale-[1.005] filter brightness-125" : ""
      ].join(" ")}
    >
      <ScanlineOverlay />
      
      {/* Laboratuvar Cam Parlama Filtresi */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.03),transparent_65%)]" />

      <section className="relative z-10 w-full max-w-2xl border border-neutral-900 bg-neutral-950/40 backdrop-blur-md p-6 border-b-2 rounded-xs shadow-[0_0_40px_rgba(0,0,0,0.8)]">
        
        {/* Üst Klinik HUD Bilgisi */}
        <div className="mb-6 border-b border-neutral-900 pb-4 flex items-center justify-between text-[10px] tracking-widest font-bold text-neutral-500">
          <div className="space-y-1">
            <p className="m-0 text-cyan-400/80 uppercase">
              {config?.kicker || "COGNITIVE_LINK_INITIALIZATION"}
            </p>
            <p className="m-0 text-[8px] opacity-60">
              SYNAPSE FREQUENCY NEGOTIATION: ACTIVE
            </p>
          </div>
          <span className="text-[9px] text-cyan-700 animate-pulse bg-cyan-950/30 px-2 py-0.5 rounded-xs border border-cyan-900/40">
            {isComplete ? "SECURE" : "LINKING"}
          </span>
        </div>

        {/* Canlı Akış Alanı */}
        <div className="flex min-h-[240px] flex-col gap-2.5 text-xs tracking-wider text-neutral-400 font-mono">
          {visibleLines.map((line, index) => {
            const isLastLine = index === visibleLines.length - 1;
            return (
              <p
                key={`${line.text}-${index}`}
                className={[
                  "m-0 flex items-start gap-2",
                  line.status === "success"
                    ? "text-emerald-400 font-bold drop-shadow-[0_0_8px_rgba(52,211,153,0.25)]"
                    : line.status === "error" || line.status === "critical"
                    ? "text-rose-500 font-bold animate-pulse"
                    : "text-zinc-300"
                ].join(" ")}
              >
                <span className="opacity-30 shrink-0">&gt;</span>
                
                {isLastLine ? (
                  <TypewriterLine 
                    text={line.text} 
                    speed={18} 
                    onLineComplete={() => {
                      setLineActive(false);
                      setCurrentIndex((prev) => prev + 1);
                    }}
                  />
                ) : (
                  <span>{line.text}</span>
                )}
              </p>
            );
          })}

          {/* İmleç Kontrolü */}
          {!isComplete && lineActive === false && (
            <span className="mt-0.5 animate-pulse text-cyan-400 text-sm">█</span>
          )}
        </div>
      </section>
    </main>
  );
}
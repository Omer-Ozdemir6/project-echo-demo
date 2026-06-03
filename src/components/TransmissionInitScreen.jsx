import { useEffect, useState } from "react";

export default function TransmissionInitScreen({ config, onComplete }) {
  const [visibleLines, setVisibleLines] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const sequence = config?.sequence || [];

  useEffect(() => {
    if (isComplete) return;

    if (!sequence.length) {
      setIsComplete(true);
      onComplete();
      return;
    }

    if (currentIndex >= sequence.length) {
      const completeDelay = config?.completeDelayMs || 800;

      const completeTimer = setTimeout(() => {
        setIsComplete(true);
        onComplete();
      }, completeDelay);

      return () => clearTimeout(completeTimer);
    }

    const currentLine = sequence[currentIndex];

    const timer = setTimeout(() => {
      setVisibleLines((prev) => [...prev, currentLine]);
      setCurrentIndex((prev) => prev + 1);
    }, currentLine.delayMs || 700);

    return () => clearTimeout(timer);
  }, [currentIndex, sequence, config, onComplete, isComplete]);

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-slate-950 p-4 text-cyan-50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(8,47,73,0.28),transparent_60%)]" />

      <div className="pointer-events-none fixed inset-0 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.04),rgba(255,255,255,0.04)_1px,transparent_1px,transparent_5px)] mix-blend-overlay" />

      <div className="pointer-events-none fixed inset-0 bg-[repeating-radial-gradient(circle,rgba(255,255,255,0.035)_0,rgba(255,255,255,0.035)_1px,transparent_1px,transparent_3px)] opacity-45" />

      <section className="relative z-10 w-full max-w-3xl border border-cyan-300/25 bg-slate-950/90 p-5 shadow-[0_0_50px_rgba(34,211,238,0.08),inset_0_0_30px_rgba(34,211,238,0.04)] sm:p-7">
        <div className="mb-5 border-b border-cyan-300/15 pb-4">
          <p className="m-0 text-xs tracking-[0.3em] text-cyan-300/80">
            {config?.kicker || "TRANSMISSION INITIALIZATION"}
          </p>

          <p className="mt-2 text-[10px] tracking-[0.22em] text-cyan-50/35">
            SECURE CHANNEL NEGOTIATION ACTIVE
          </p>
        </div>

        <div className="flex min-h-[280px] flex-col gap-3 text-sm tracking-[0.08em] sm:text-base">
          {visibleLines.map((line, index) => (
            <p
              key={`${line.text}-${index}`}
              className={[
                "m-0",
                line.status === "success"
                  ? "text-emerald-300 drop-shadow-[0_0_10px_rgba(134,239,172,0.4)]"
                  : "text-cyan-50/70"
              ].join(" ")}
            >
              <span className="text-cyan-50/35">&gt;</span>{" "}
              {line.text}
            </p>
          ))}

          {!isComplete && (
            <span className="mt-1 animate-pulse text-cyan-300">█</span>
          )}
        </div>
      </section>
    </main>
  );
}
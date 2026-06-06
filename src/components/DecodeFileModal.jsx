import { useEffect, useMemo, useState } from "react";

export default function DecodeFileModal({ file, onComplete, onClose }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!file) return;

    setProgress(0);

    const steps = [
      { value: 10, delay: 180 },
      { value: 28, delay: 420 },
      { value: 50, delay: 720 },
      { value: 76, delay: 1050 },
      { value: 100, delay: 1350 }
    ];

    const timers = steps.map((step) =>
      setTimeout(() => setProgress(step.value), step.delay)
    );

    const completeTimer = setTimeout(() => {
      onComplete?.(file);
    }, 1750);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(completeTimer);
    };
  }, [file, onComplete]);

  const bar = useMemo(() => {
    const filled = Math.round(progress / 10);
    return "█".repeat(filled) + "░".repeat(10 - filled);
  }, [progress]);

  if (!file) return null;

  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-center bg-black/90 p-4 text-cyan-50 backdrop-blur-sm"
      onClick={onClose}
    >
      <section
        className="relative z-[91] w-full max-w-lg border border-cyan-300/35 bg-slate-950/95 p-5 shadow-[0_0_60px_rgba(34,211,238,0.14),inset_0_0_36px_rgba(34,211,238,0.05)]"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="mb-2 text-[10px] tracking-[0.28em] text-cyan-300/60">
          DATA BANK ACCESS
        </p>

        <h2 className="mb-5 truncate text-sm tracking-[0.18em] text-cyan-100">
          {file.title || "UNKNOWN FILE"}
        </h2>

        <div className="border border-cyan-300/20 bg-black/40 p-4 font-mono">
          <p className="mb-3 text-xs tracking-[0.22em] text-cyan-300">
            {progress >= 100 ? "ACCESS GRANTED" : "DECRYPTING FILE..."}
          </p>

          <div className="text-lg tracking-[0.16em] text-cyan-100">
            {bar}{" "}
            <span
              className={
                progress >= 100 ? "text-emerald-300" : "text-cyan-300/70"
              }
            >
              {progress}%
            </span>
          </div>

          <p className="mt-4 text-[10px] tracking-[0.18em] text-cyan-50/40">
            {progress >= 100
              ? "OPENING RECOVERED DATA"
              : "VERIFYING ARCHIVE INTEGRITY"}
          </p>
        </div>
      </section>
    </div>
  );
}
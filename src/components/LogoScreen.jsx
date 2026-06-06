import { useEffect, useMemo, useState } from "react";

export default function LogoScreen({ gameTitle }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const steps = [
      { value: 10, delay: 300 },
      { value: 30, delay: 700 },
      { value: 60, delay: 1200 },
      { value: 84, delay: 1700 },
      { value: 100, delay: 2200 }
    ];

    const timers = steps.map((step) =>
      setTimeout(() => {
        setProgress(step.value);
      }, step.delay)
    );

    return () => timers.forEach(clearTimeout);
  }, []);

  const bar = useMemo(() => {
    const filled = Math.round(progress / 10);
    return "█".repeat(filled) + "░".repeat(10 - filled);
  }, [progress]);

  const isComplete = progress >= 100;

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-black">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.12),transparent_65%)]" />

      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.03),rgba(255,255,255,0.03)_1px,transparent_1px,transparent_4px)] opacity-40" />

      <div className="pointer-events-none absolute inset-0 animate-pulse bg-cyan-300/5" />

      <div className="relative z-10 flex flex-col items-center">
        <div
          className={[
            "grid place-items-center",
            "h-44 w-44 rounded-full",
            "border border-cyan-300/40",
            "text-center",
            "text-sm tracking-[0.45em]",
            "text-cyan-300",
            "shadow-[0_0_40px_rgba(34,211,238,0.35)]",
            "animate-[pulse_3s_ease-in-out_infinite]",
            "sm:h-56 sm:w-56 sm:text-base"
          ].join(" ")}
        >
          {gameTitle}
        </div>

        <div className="mt-10 text-center">
          <p className="text-[10px] tracking-[0.45em] text-cyan-300/60">
            {isComplete ? "SIGNAL ACQUIRED" : "ACQUIRING SIGNAL"}
          </p>

          <div className="mt-4 border border-cyan-300/20 bg-slate-950/70 px-4 py-3 font-mono text-xs tracking-[0.18em] text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.1)]">
            <span className="text-cyan-300/55">&gt;</span>{" "}
            <span>{bar}</span>{" "}
            <span className={isComplete ? "text-emerald-300" : "text-cyan-100/70"}>
              {progress}%
            </span>
          </div>

          <p className="mt-3 text-[10px] tracking-[0.22em] text-cyan-50/35">
            {isComplete ? "CHANNEL ESTABLISHED" : "SYNCING RELAY CHANNEL"}
          </p>
        </div>
      </div>
    </main>
  );
}
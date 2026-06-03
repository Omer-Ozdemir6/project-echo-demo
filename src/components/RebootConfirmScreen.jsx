import { useEffect, useState } from "react";

export default function RebootConfirmScreen({ config, onRestart }) {
  const [countdown, setCountdown] = useState(config?.countdownSeconds || 10);
  const [isRestarting, setIsRestarting] = useState(false);

  function handleRestart() {
    if (isRestarting) return;

    setIsRestarting(true);

    setTimeout(() => {
      onRestart();
    }, config?.restartDelayMs || 800);
  }

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

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-slate-950 p-4 text-cyan-50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(127,29,29,0.28),transparent_58%)]" />

      <div className="pointer-events-none fixed inset-0 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.04),rgba(255,255,255,0.04)_1px,transparent_1px,transparent_5px)] mix-blend-overlay" />

      <div className="pointer-events-none fixed inset-0 bg-[repeating-radial-gradient(circle,rgba(255,255,255,0.035)_0,rgba(255,255,255,0.035)_1px,transparent_1px,transparent_3px)] opacity-45" />

      <section className="relative z-10 w-full max-w-2xl border border-rose-400/45 bg-slate-950/90 p-5 shadow-[0_0_50px_rgba(251,113,133,0.12),inset_0_0_36px_rgba(251,113,133,0.04)] sm:p-7">
        <p className="mb-3 text-xs tracking-[0.3em] text-rose-300/85">
          {config?.kicker || "SYSTEM RECOVERY MODE"}
        </p>

        <h1 className="mb-6 text-xl tracking-[0.18em] text-rose-400 drop-shadow-[0_0_16px_rgba(251,113,133,0.75)] sm:text-2xl">
          {config?.title || "SYSTEM RESTART REQUIRED"}
        </h1>

        <div className="mb-6 border border-rose-400/25 bg-rose-950/20 p-4">
          {(config?.warnings || []).map((warning) => (
            <p
              key={warning}
              className="mb-2 text-sm leading-6 text-rose-50/90 last:mb-0"
            >
              {warning}
            </p>
          ))}
        </div>

        <div className="mb-5 border border-rose-400/20 bg-slate-950/60 p-3 text-sm tracking-[0.16em] text-cyan-50/70">
          {isRestarting ? (
            <span className="text-emerald-200">
              {config?.restartingText || "USER RESTART AUTHORIZATION ACCEPTED"}
            </span>
          ) : (
            <>
              {config?.countdownLabel || "AUTO RESTART IN"}{" "}
              <strong className="ml-2 text-3xl text-rose-400">
                {countdown}
              </strong>
            </>
          )}
        </div>

        <button
          type="button"
          className="w-full border border-rose-400/60 bg-rose-950/30 px-4 py-4 text-sm tracking-[0.25em] text-rose-100 transition hover:bg-rose-400/15 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={handleRestart}
          disabled={isRestarting}
        >
          {isRestarting
            ? config?.buttonLoadingText || "RESTARTING..."
            : config?.buttonText || "RESTART NOW"}
        </button>
      </section>
    </main>
  );
}
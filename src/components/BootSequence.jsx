export default function BootSequence({
  gameTitle,
  completedSteps,
  activeStep,
  bootProgress,
  showError,
  criticalError
}) {
  function getLineColor(status) {
    return status === "failed"
      ? "text-rose-400 drop-shadow-[0_0_12px_rgba(251,113,133,0.75)]"
      : "text-cyan-300";
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-slate-950 p-4 text-cyan-50 sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.12),transparent_35%)]" />

      <div className="pointer-events-none fixed inset-0 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.04),rgba(255,255,255,0.04)_1px,transparent_1px,transparent_5px)] mix-blend-overlay" />

      <div className="pointer-events-none fixed inset-0 bg-[repeating-radial-gradient(circle,rgba(255,255,255,0.035)_0,rgba(255,255,255,0.035)_1px,transparent_1px,transparent_3px)] opacity-45 animate-[noiseShift_0.18s_infinite]" />

      <section className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-8 sm:flex-row sm:justify-center">
        <div className="grid h-36 w-36 shrink-0 place-items-center rounded-full border border-cyan-300 text-center text-xs tracking-[0.35em] text-cyan-300 shadow-[0_0_30px_rgba(103,232,249,0.35)] animate-[spinPulse_4s_linear_infinite] sm:h-40 sm:w-40">
          {gameTitle}
        </div>

        <div className="min-h-[300px] w-full max-w-2xl border border-cyan-300/25 bg-slate-950/75 p-4 shadow-[0_0_28px_rgba(34,211,238,0.08),inset_0_0_24px_rgba(34,211,238,0.05)] animate-[terminalSlideIn_1s_ease-out_both]">
          {completedSteps.map((step, index) => (
            <p
              key={`${step.label}-${index}`}
              className={[
                "mb-3 text-sm tracking-[0.04em] last:mb-0 sm:text-base",
                "animate-[bootLineIn_0.22s_ease-out_both]",
                step.status === "failed"
                  ? "animate-[bootLineIn_0.22s_ease-out_both,errorPulse_0.45s_infinite]"
                  : "animate-[bootLineIn_0.22s_ease-out_both,flicker_1.8s_infinite]",
                getLineColor(step.status)
              ].join(" ")}
            >
              <span className="text-cyan-50/35">&gt;</span>{" "}
              <span>[{step.label}]</span>

              <span className="ml-3 inline-block min-w-12 text-cyan-50/70">
                {step.currentProgress}%
              </span>

              <span
                className={[
                  "ml-3 inline-block min-w-16",
                  step.status === "failed"
                    ? "text-rose-400"
                    : "text-emerald-300"
                ].join(" ")}
              >
                {step.status === "failed" ? "FAILED" : "OK"}
              </span>
            </p>
          ))}

          {!showError && activeStep && (
            <p
              className={[
                "mb-3 text-sm tracking-[0.04em] sm:text-base",
                getLineColor(activeStep.status),
                activeStep.status === "failed"
                  ? "animate-[bootLineIn_0.22s_ease-out_both,errorPulse_0.45s_infinite]"
                  : "animate-[bootLineIn_0.22s_ease-out_both,flicker_1.8s_infinite]"
              ].join(" ")}
            >
              <span className="text-cyan-50/35">&gt;</span>{" "}
              <span>[{activeStep.label}]</span>

              <span className="ml-3 inline-block min-w-12 text-cyan-50/70">
                {bootProgress}%
              </span>

              <span className="ml-2 animate-[cursorBlink_0.7s_infinite] text-cyan-300">
                _
              </span>
            </p>
          )}

          {showError && (
            <div className="mt-4 border border-rose-400/65 bg-rose-950/25 p-4 text-rose-400 shadow-[0_0_20px_rgba(251,113,133,0.12)] animate-[criticalErrorBlink_0.45s_infinite]">
              {criticalError.map((line) => (
                <p
                  key={line}
                  className="mb-2 text-sm tracking-[0.08em] drop-shadow-[0_0_10px_rgba(251,113,133,0.9)] last:mb-0 sm:text-base"
                >
                  {line}
                </p>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
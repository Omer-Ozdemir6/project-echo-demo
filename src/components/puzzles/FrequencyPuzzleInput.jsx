import { useEffect, useMemo, useState } from "react";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toFixedFrequency(value) {
  return Number(value).toFixed(2);
}

function resolveText(t, key, fallback = "") {
  if (key && typeof t === "function") {
    const translated = t(key);

    if (translated && translated !== key) {
      return translated;
    }
  }

  return fallback;
}

function getSignalQuality(frequency, targetFrequency, tolerance = 0.25) {
  const distance = Math.abs(frequency - targetFrequency);
  const quality = Math.max(0, 100 - (distance / tolerance) * 100);

  return Math.round(quality);
}

function getSignalLabel(quality, t) {
  if (quality >= 95) return resolveText(t, "puzzle.frequency.signalLocked", "SIGNAL LOCKED");
  if (quality >= 75) return resolveText(t, "puzzle.frequency.signalStrong", "SIGNAL STRONG");
  if (quality >= 45) return resolveText(t, "puzzle.frequency.signalUnstable", "SIGNAL UNSTABLE");
  if (quality >= 20) return resolveText(t, "puzzle.frequency.weakTrace", "WEAK TRACE");
  return resolveText(t, "puzzle.frequency.static", "STATIC");
}

function getDecodedPreview(quality, puzzle, t) {
  if (quality >= 95) {
    return resolveText(
      t,
      puzzle?.lockedMessageKey,
      puzzle?.lockedMessage || "MAYA: Can anyone hear me?"
    );
  }

  if (quality >= 75) {
    return resolveText(
      t,
      puzzle?.nearMessageKey,
      puzzle?.nearMessage || "M...a...y...a..."
    );
  }

  if (quality >= 45) {
    return resolveText(
      t,
      puzzle?.traceMessageKey,
      puzzle?.traceMessage || "...a... anyone..."
    );
  }

  if (quality >= 20) {
    return resolveText(t, "puzzle.frequency.noiseWeak", "...krrrzzzt...");
  }

  return resolveText(t, "puzzle.frequency.noiseStatic", "~~~~~~~~~~~~");
}

function buildBars(quality) {
  const activeBars = Math.round(quality / 10);

  return Array.from({ length: 10 }, (_, index) => index < activeBars);
}

export default function FrequencyPuzzleInput({
  puzzle,
  attempts = 0,
  onSubmit,
  t
}) {
  const minFrequency = Number(puzzle?.minFrequency ?? 6.5);
  const maxFrequency = Number(puzzle?.maxFrequency ?? 8.0);
  const step = Number(puzzle?.step ?? 0.01);
  const targetFrequency = Number(puzzle?.targetFrequency ?? 7.14);
  const tolerance = Number(puzzle?.tolerance ?? 0.25);
  const lockThreshold = Number(puzzle?.lockThreshold ?? 95);
  const requiredLockHoldMs = Number(puzzle?.requiredLockHoldMs ?? 2500);
const driftEnabled = puzzle?.driftEnabled ?? true;
const driftIntervalMs = Number(puzzle?.driftIntervalMs ?? 1500);
const driftAmount = Number(puzzle?.driftAmount ?? step);

  const [frequency, setFrequency] = useState(
    Number(puzzle?.initialFrequency ?? minFrequency)
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lockProgress, setLockProgress] = useState(0);
const [driftDirection, setDriftDirection] = useState(1);

const signalQuality = useMemo(
  () => getSignalQuality(frequency, targetFrequency, tolerance),
  [frequency, targetFrequency, tolerance]
);

const isInLockRange = signalQuality >= lockThreshold;
const isSignalReady = lockProgress >= 100;

  const signalLabel = getSignalLabel(signalQuality, t);
  const decodedPreview = getDecodedPreview(signalQuality, puzzle, t);
  const bars = buildBars(signalQuality);

  const title = resolveText(
    t,
    puzzle?.titleKey,
    puzzle?.title || "FREQUENCY SCANNER"
  );

  const description = resolveText(
    t,
    puzzle?.descriptionKey,
    puzzle?.description || ""
  );

  const submitLabel = resolveText(
    t,
    puzzle?.submitLabelKey,
    puzzle?.submitLabel || "LOCK SIGNAL"
  );

  function adjustFrequency(amount) {
    setFrequency((prev) =>
      Number(clamp(prev + amount, minFrequency, maxFrequency).toFixed(2))
    );
  }

  useEffect(() => {
  if (!isInLockRange) {
    setLockProgress(0);
    return;
  }

  const interval = setInterval(() => {
    setLockProgress((prev) => {
      const next = prev + 100 / (requiredLockHoldMs / 100);
      return Math.min(100, next);
    });
  }, 100);

  return () => clearInterval(interval);
}, [isInLockRange, requiredLockHoldMs]);

useEffect(() => {
  if (!driftEnabled || isSignalReady) return;

  const interval = setInterval(() => {
    setFrequency((prev) => {
      const next = prev + driftAmount * driftDirection;

      if (next >= maxFrequency) {
        setDriftDirection(-1);
        return Number(maxFrequency.toFixed(2));
      }

      if (next <= minFrequency) {
        setDriftDirection(1);
        return Number(minFrequency.toFixed(2));
      }

      return Number(next.toFixed(2));
    });
  }, driftIntervalMs);

  return () => clearInterval(interval);
}, [
  driftEnabled,
  isSignalReady,
  driftAmount,
  driftDirection,
  driftIntervalMs,
  minFrequency,
  maxFrequency
]);

  function handleSubmit() {
    if (isSubmitting) return;

    setIsSubmitting(true);

    const isLocked = isSignalReady;

    onSubmit(
      isLocked
        ? String(puzzle?.acceptedAnswers?.[0] || targetFrequency)
        : `frequency:${toFixedFrequency(frequency)}`
    );

    setTimeout(() => {
      setIsSubmitting(false);
    }, puzzle?.submitCooldownMs || 500);
  }

  return (
    <div className="mt-4 border border-cyan-300/35 bg-cyan-950/10 p-4 shadow-[0_0_24px_rgba(34,211,238,0.1)]">
      <div className="mb-3 flex items-start justify-between gap-4 border-b border-cyan-300/20 pb-3">
        <div>
          <p className="m-0 text-[10px] tracking-[0.25em] text-cyan-300/60">
            {resolveText(t, "puzzle.frequency.tunerActive", "SIGNAL TUNER ACTIVE")}
          </p>

          <h3 className="mt-1 text-xs tracking-[0.24em] text-cyan-200">
            {title}
          </h3>
        </div>

        {attempts > 0 && (
          <span className="shrink-0 text-[10px] tracking-[0.18em] text-rose-300">
            {resolveText(t, "puzzle.common.attempts", "ATTEMPTS")}: {attempts}
          </span>
        )}
      </div>

      {description && (
        <p className="mb-3 text-xs leading-5 text-cyan-50/55">
          {description}
        </p>
      )}

      <div className="mb-3 border border-cyan-300/15 bg-black/40 p-4">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="m-0 text-[10px] tracking-[0.22em] text-cyan-300/45">
              {resolveText(t, "puzzle.frequency.currentFrequency", "CURRENT FREQUENCY")}
            </p>

            <div className="mt-1 text-3xl tracking-[0.16em] text-cyan-100 drop-shadow-[0_0_12px_rgba(103,232,249,0.35)]">
              {toFixedFrequency(frequency)}
              <span className="ml-2 text-sm text-cyan-300/50">MHz</span>
            </div>
          </div>

          <div className="text-right">
            <p className="m-0 text-[10px] tracking-[0.22em] text-cyan-300/45">
              {resolveText(t, "puzzle.frequency.quality", "QUALITY")}
            </p>

            <strong className="mt-1 block text-lg tracking-[0.14em] text-emerald-200">
              {signalQuality}%
            </strong>
          </div>
        </div>

        <div className="mb-3 flex gap-1">
          {bars.map((isActive, index) => (
            <span
              key={index}
              className={[
                "h-5 flex-1 border border-cyan-300/15",
                isActive
                  ? "bg-cyan-300/55 shadow-[0_0_10px_rgba(103,232,249,0.35)]"
                  : "bg-slate-900/80"
              ].join(" ")}
            />
          ))}
        </div>

        <div className="border border-cyan-300/15 bg-slate-950/70 p-3">
          <p className="m-0 text-[11px] tracking-[0.18em] text-cyan-300/70">
            {signalLabel}
          </p>

          <p className="mt-2 min-h-6 text-sm leading-6 tracking-[0.08em] text-cyan-50/70">
            {decodedPreview}
          </p>

          <div className="mt-3 border-t border-cyan-300/10 pt-3">
  <div className="mb-2 flex items-center justify-between text-[10px] tracking-[0.18em] text-cyan-300/55">
    <span>
      {resolveText(t, "puzzle.frequency.lockProgress", "LOCK PROGRESS")}
    </span>

    <span>{Math.round(lockProgress)}%</span>
  </div>

  <div className="h-2 overflow-hidden bg-slate-900">
    <div
      className="h-full bg-cyan-300 transition-all duration-100"
      style={{ width: `${lockProgress}%` }}
    />
  </div>

  {!isInLockRange && (
    <p className="mt-2 text-[10px] tracking-[0.14em] text-rose-300/80">
      {resolveText(
        t,
        "puzzle.frequency.holdSignalHint",
        "HOLD SIGNAL ABOVE LOCK THRESHOLD"
      )}
    </p>
  )}
</div>
        </div>
      </div>

      <input
        type="range"
        min={minFrequency}
        max={maxFrequency}
        step={step}
        value={frequency}
        onChange={(event) => setFrequency(Number(event.target.value))}
        className="mb-3 w-full accent-cyan-300"
      />

      <div className="grid grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => adjustFrequency(-step * 10)}
          className="border border-cyan-300/25 px-3 py-3 text-[11px] tracking-[0.18em] text-cyan-200 transition hover:bg-cyan-400/10"
        >
          -10
        </button>

        <button
          type="button"
          onClick={() => adjustFrequency(-step)}
          className="border border-cyan-300/25 px-3 py-3 text-[11px] tracking-[0.18em] text-cyan-200 transition hover:bg-cyan-400/10"
        >
          -
        </button>

        <button
          type="button"
          onClick={() => adjustFrequency(step)}
          className="border border-cyan-300/25 px-3 py-3 text-[11px] tracking-[0.18em] text-cyan-200 transition hover:bg-cyan-400/10"
        >
          +
        </button>

        <button
          type="button"
          onClick={() => adjustFrequency(step * 10)}
          className="border border-cyan-300/25 px-3 py-3 text-[11px] tracking-[0.18em] text-cyan-200 transition hover:bg-cyan-400/10"
        >
          +10
        </button>
      </div>

      <button
        type="button"
        disabled={isSubmitting || !isSignalReady}
        onClick={handleSubmit}
        className="mt-3 w-full border border-emerald-300/45 bg-emerald-950/20 px-4 py-3 text-[11px] tracking-[0.22em] text-emerald-200 transition hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isSubmitting
  ? resolveText(t, "puzzle.frequency.locking", "LOCKING...")
  : isSignalReady
    ? submitLabel
    : resolveText(t, "puzzle.frequency.stabilizing", "STABILIZING...")}
      </button>
    </div>
  );
}
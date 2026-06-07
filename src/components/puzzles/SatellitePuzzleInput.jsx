import { useEffect, useMemo, useState } from "react";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function resolveText(t, key, fallback = "") {
  if (key && typeof t === "function") {
    const translated = t(key);

    if (translated && translated !== key) return translated;
  }

  return fallback;
}

function getAxisQuality(value, target, tolerance) {
  const distance = Math.abs(Number(value) - Number(target));
  const quality = Math.max(0, 100 - (distance / Number(tolerance)) * 100);

  return Math.round(quality);
}

function getSatelliteQuality({
  azimuth,
  elevation,
  power,
  targetAzimuth,
  targetElevation,
  targetPower,
  azimuthTolerance,
  elevationTolerance,
  powerTolerance
}) {
  const azimuthQuality = getAxisQuality(
    azimuth,
    targetAzimuth,
    azimuthTolerance
  );

  const elevationQuality = getAxisQuality(
    elevation,
    targetElevation,
    elevationTolerance
  );

  const powerQuality = getAxisQuality(power, targetPower, powerTolerance);

  return Math.round((azimuthQuality + elevationQuality + powerQuality) / 3);
}

function getStatusLabel(quality, t) {
  if (quality >= 95) {
    return resolveText(t, "puzzle.satellite.statusLocked", "SATELLITE LOCKED");
  }

  if (quality >= 75) {
    return resolveText(t, "puzzle.satellite.statusStrong", "SIGNAL STRONG");
  }

  if (quality >= 45) {
    return resolveText(t, "puzzle.satellite.statusUnstable", "ALIGNMENT UNSTABLE");
  }

  if (quality >= 20) {
    return resolveText(t, "puzzle.satellite.statusWeak", "WEAK TELEMETRY");
  }

  return resolveText(t, "puzzle.satellite.statusLost", "NO SATELLITE TRACE");
}

function buildBars(quality) {
  const activeBars = Math.round(quality / 10);
  return Array.from({ length: 10 }, (_, index) => index < activeBars);
}

function AxisControl({
  label,
  unit,
  value,
  min,
  max,
  step,
  quality,
  onChange,
  onAdjust
}) {
  return (
    <div className="border border-cyan-300/15 bg-slate-950/55 p-3">
      <div className="mb-2 flex items-end justify-between gap-3">
        <div>
          <p className="m-0 text-[10px] tracking-[0.22em] text-cyan-300/45">
            {label}
          </p>

          <strong className="mt-1 block text-xl tracking-[0.12em] text-cyan-100">
            {value}
            <span className="ml-1 text-xs text-cyan-300/50">{unit}</span>
          </strong>
        </div>

        <span
          className={[
            "text-[11px] tracking-[0.16em]",
            quality >= 75
              ? "text-emerald-200"
              : quality >= 45
                ? "text-amber-200"
                : "text-rose-300"
          ].join(" ")}
        >
          {quality}%
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mb-2 w-full accent-cyan-300"
      />

      <div className="grid grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => onAdjust(-step * 10)}
          className="border border-cyan-300/20 px-2 py-2 text-[10px] tracking-[0.12em] text-cyan-200 transition hover:bg-cyan-400/10"
        >
          -10
        </button>

        <button
          type="button"
          onClick={() => onAdjust(-step)}
          className="border border-cyan-300/20 px-2 py-2 text-[10px] tracking-[0.12em] text-cyan-200 transition hover:bg-cyan-400/10"
        >
          -
        </button>

        <button
          type="button"
          onClick={() => onAdjust(step)}
          className="border border-cyan-300/20 px-2 py-2 text-[10px] tracking-[0.12em] text-cyan-200 transition hover:bg-cyan-400/10"
        >
          +
        </button>

        <button
          type="button"
          onClick={() => onAdjust(step * 10)}
          className="border border-cyan-300/20 px-2 py-2 text-[10px] tracking-[0.12em] text-cyan-200 transition hover:bg-cyan-400/10"
        >
          +10
        </button>
      </div>
    </div>
  );
}

export default function SatellitePuzzleInput({
  puzzle,
  attempts = 0,
  onSubmit,
  t
}) {
  const minAzimuth = Number(puzzle?.minAzimuth ?? 0);
  const maxAzimuth = Number(puzzle?.maxAzimuth ?? 360);
  const minElevation = Number(puzzle?.minElevation ?? 0);
  const maxElevation = Number(puzzle?.maxElevation ?? 90);
  const minPower = Number(puzzle?.minPower ?? 0);
  const maxPower = Number(puzzle?.maxPower ?? 100);

  const azimuthStep = Number(puzzle?.azimuthStep ?? 1);
  const elevationStep = Number(puzzle?.elevationStep ?? 1);
  const powerStep = Number(puzzle?.powerStep ?? 1);

  const targetAzimuth = Number(puzzle?.targetAzimuth ?? 142);
  const targetElevation = Number(puzzle?.targetElevation ?? 37);
  const targetPower = Number(puzzle?.targetPower ?? 68);

  const azimuthTolerance = Number(puzzle?.azimuthTolerance ?? 8);
  const elevationTolerance = Number(puzzle?.elevationTolerance ?? 5);
  const powerTolerance = Number(puzzle?.powerTolerance ?? 10);

  const lockThreshold = Number(puzzle?.lockThreshold ?? 95);
  const requiredLockHoldMs = Number(puzzle?.requiredLockHoldMs ?? 3000);

  const driftEnabled = puzzle?.driftEnabled ?? true;
  const driftIntervalMs = Number(puzzle?.driftIntervalMs ?? 1800);
  const driftAmount = Number(puzzle?.driftAmount ?? 1);

  const [azimuth, setAzimuth] = useState(
    Number(puzzle?.initialAzimuth ?? minAzimuth)
  );
  const [elevation, setElevation] = useState(
    Number(puzzle?.initialElevation ?? minElevation)
  );
  const [power, setPower] = useState(Number(puzzle?.initialPower ?? 50));

  const [lockProgress, setLockProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [driftDirection, setDriftDirection] = useState(1);

  const azimuthQuality = useMemo(
    () => getAxisQuality(azimuth, targetAzimuth, azimuthTolerance),
    [azimuth, targetAzimuth, azimuthTolerance]
  );

  const elevationQuality = useMemo(
    () => getAxisQuality(elevation, targetElevation, elevationTolerance),
    [elevation, targetElevation, elevationTolerance]
  );

  const powerQuality = useMemo(
    () => getAxisQuality(power, targetPower, powerTolerance),
    [power, targetPower, powerTolerance]
  );

  const satelliteQuality = useMemo(
    () =>
      getSatelliteQuality({
        azimuth,
        elevation,
        power,
        targetAzimuth,
        targetElevation,
        targetPower,
        azimuthTolerance,
        elevationTolerance,
        powerTolerance
      }),
    [
      azimuth,
      elevation,
      power,
      targetAzimuth,
      targetElevation,
      targetPower,
      azimuthTolerance,
      elevationTolerance,
      powerTolerance
    ]
  );

  const isInLockRange = satelliteQuality >= lockThreshold;
  const isSatelliteReady = lockProgress >= 100;
  const statusLabel = getStatusLabel(satelliteQuality, t);
  const bars = buildBars(satelliteQuality);

  const title = resolveText(
    t,
    puzzle?.titleKey,
    puzzle?.title || "SATELLITE ALIGNMENT"
  );

  const description = resolveText(
    t,
    puzzle?.descriptionKey,
    puzzle?.description || ""
  );

  const submitLabel = resolveText(
    t,
    puzzle?.submitLabelKey,
    puzzle?.submitLabel || "LOCK SATELLITE"
  );

  function adjustAzimuth(amount) {
    setAzimuth((prev) =>
      Number(clamp(prev + amount, minAzimuth, maxAzimuth).toFixed(0))
    );
  }

  function adjustElevation(amount) {
    setElevation((prev) =>
      Number(clamp(prev + amount, minElevation, maxElevation).toFixed(0))
    );
  }

  function adjustPower(amount) {
    setPower((prev) =>
      Number(clamp(prev + amount, minPower, maxPower).toFixed(0))
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
    if (!driftEnabled || isSatelliteReady) return;

    const interval = setInterval(() => {
      setAzimuth((prev) => {
        const next = prev + driftAmount * driftDirection;

        if (next >= maxAzimuth) {
          setDriftDirection(-1);
          return maxAzimuth;
        }

        if (next <= minAzimuth) {
          setDriftDirection(1);
          return minAzimuth;
        }

        return Number(next.toFixed(0));
      });
    }, driftIntervalMs);

    return () => clearInterval(interval);
  }, [
    driftEnabled,
    isSatelliteReady,
    driftAmount,
    driftDirection,
    driftIntervalMs,
    minAzimuth,
    maxAzimuth
  ]);

  function handleSubmit() {
    if (isSubmitting || !isSatelliteReady) return;

    setIsSubmitting(true);

    onSubmit(String(puzzle?.acceptedAnswers?.[0] || "SATELLITE_LOCKED"));

    setTimeout(() => {
      setIsSubmitting(false);
    }, puzzle?.submitCooldownMs || 500);
  }

  return (
    <div className="mt-4 border border-cyan-300/35 bg-cyan-950/10 p-4 shadow-[0_0_24px_rgba(34,211,238,0.1)]">
      <div className="mb-3 flex items-start justify-between gap-4 border-b border-cyan-300/20 pb-3">
        <div>
          <p className="m-0 text-[10px] tracking-[0.25em] text-cyan-300/60">
            {resolveText(
              t,
              "puzzle.satellite.moduleActive",
              "SATELLITE CONTROL ACTIVE"
            )}
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

      <div className="mb-3 border border-cyan-300/15 bg-black/35 p-3">
        <p className="m-0 text-[11px] tracking-[0.16em] text-cyan-100/65">
          &gt;{" "}
          {resolveText(
            t,
            "puzzle.satellite.instructions",
            "ALIGN AZIMUTH, ELEVATION AND POWER UNTIL THE RELAY LOCKS."
          )}
        </p>
      </div>

      <div className="mb-3 grid gap-3">
        <AxisControl
          label={resolveText(t, "puzzle.satellite.azimuth", "AZIMUTH")}
          unit="°"
          value={azimuth}
          min={minAzimuth}
          max={maxAzimuth}
          step={azimuthStep}
          quality={azimuthQuality}
          onChange={setAzimuth}
          onAdjust={adjustAzimuth}
        />

        <AxisControl
          label={resolveText(t, "puzzle.satellite.elevation", "ELEVATION")}
          unit="°"
          value={elevation}
          min={minElevation}
          max={maxElevation}
          step={elevationStep}
          quality={elevationQuality}
          onChange={setElevation}
          onAdjust={adjustElevation}
        />

        <AxisControl
          label={resolveText(t, "puzzle.satellite.power", "POWER")}
          unit="%"
          value={power}
          min={minPower}
          max={maxPower}
          step={powerStep}
          quality={powerQuality}
          onChange={setPower}
          onAdjust={adjustPower}
        />
      </div>

      <div className="border border-cyan-300/15 bg-slate-950/70 p-3">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="m-0 text-[10px] tracking-[0.22em] text-cyan-300/45">
              {resolveText(t, "puzzle.satellite.signalQuality", "SIGNAL QUALITY")}
            </p>

            <strong className="mt-1 block text-xl tracking-[0.14em] text-emerald-200">
              {satelliteQuality}%
            </strong>
          </div>

          <p className="m-0 text-right text-[11px] tracking-[0.14em] text-cyan-300/70">
            {statusLabel}
          </p>
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

        <div className="border-t border-cyan-300/10 pt-3">
          <div className="mb-2 flex items-center justify-between text-[10px] tracking-[0.18em] text-cyan-300/55">
            <span>
              {resolveText(t, "puzzle.satellite.lockProgress", "LOCK PROGRESS")}
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
                "puzzle.satellite.holdSignalHint",
                "ALIGN ALL AXES ABOVE LOCK THRESHOLD"
              )}
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        disabled={isSubmitting || !isSatelliteReady}
        onClick={handleSubmit}
        className="mt-3 w-full border border-emerald-300/45 bg-emerald-950/20 px-4 py-3 text-[11px] tracking-[0.22em] text-emerald-200 transition hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isSubmitting
          ? resolveText(t, "puzzle.common.submitting", "...")
          : isSatelliteReady
            ? submitLabel
            : resolveText(t, "puzzle.satellite.stabilizing", "STABILIZING...")}
      </button>
    </div>
  );
}
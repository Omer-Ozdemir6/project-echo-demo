export default function SignalOverlay({ status }) {
  if (!status) return null;

  const isLost = status.type === "lost";
  const isRestored = status.type === "restored";

  return (
    <div className="pointer-events-none fixed inset-0 z-[80] flex items-center justify-center">
      <div
        className={[
          "absolute inset-0",
          isLost
            ? "bg-rose-950/15"
            : isRestored
              ? "bg-emerald-950/10"
              : "bg-cyan-950/10"
        ].join(" ")}
      />

      <div
        className={[
          "relative",
          "border",
          "px-8 py-6",
          "backdrop-blur-sm",
          "shadow-[0_0_40px_rgba(0,0,0,0.45)]",
          "animate-pulse",
          isLost
            ? "border-rose-400/70 bg-rose-950/75 text-rose-300"
            : "",
          isRestored
            ? "border-emerald-300/70 bg-emerald-950/75 text-emerald-200"
            : "",
          !isLost && !isRestored
            ? "border-cyan-300/70 bg-slate-950/80 text-cyan-300"
            : ""
        ].join(" ")}
      >
        <div className="text-center">
          <div className="mb-2 text-[10px] tracking-[0.35em] opacity-60">
            TRANSMISSION STATUS
          </div>

          <p className="text-center text-sm tracking-[0.3em] sm:text-base">
            {status.message}
          </p>
        </div>
      </div>
    </div>
  );
}
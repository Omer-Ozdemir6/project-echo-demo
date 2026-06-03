export default function LogoScreen({ gameTitle }) {
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
            SIGNAL ACQUIRED
          </p>

          <div className="mt-4 h-[2px] w-48 overflow-hidden bg-cyan-300/10">
            <div className="h-full w-full animate-[pulse_1.5s_linear_infinite] bg-cyan-300" />
          </div>
        </div>
      </div>
    </main>
  );
}
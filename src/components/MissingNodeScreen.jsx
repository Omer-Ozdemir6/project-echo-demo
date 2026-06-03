export default function MissingNodeScreen({ nodeId, onReset }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-950 p-4">
      <section className="w-full max-w-2xl border border-rose-400/35 bg-slate-950/95 p-6 shadow-[0_0_40px_rgba(251,113,133,0.12)]">
        <div className="mb-6 flex items-center justify-between gap-4 border-b border-rose-400/20 pb-4">
          <div>
            <p className="text-xs tracking-[0.3em] text-rose-400/70">
              CRITICAL ERROR
            </p>

            <h1 className="mt-2 text-lg tracking-[0.2em] text-rose-400 sm:text-xl">
              STORY NODE FAILURE
            </h1>
          </div>

          <button
            type="button"
            onClick={onReset}
            className="border border-rose-400/50 px-4 py-2 text-xs tracking-[0.2em] text-rose-300 transition hover:bg-rose-400/10"
          >
            RESET
          </button>
        </div>

        <div className="border border-rose-400/25 bg-rose-950/20 p-4">
          <p className="text-sm leading-7 text-rose-300 sm:text-base">
            STORY NODE NOT FOUND
          </p>

          <p className="mt-3 break-all font-mono text-sm text-rose-400 drop-shadow-[0_0_10px_rgba(251,113,133,0.75)]">
            {nodeId}
          </p>
        </div>

        <div className="mt-4 text-xs tracking-[0.15em] text-cyan-50/40">
          Narrative engine failed to resolve requested node.
        </div>
      </section>
    </main>
  );
}
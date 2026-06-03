export default function FileViewerModal({ file, onClose }) {
  if (!file) return null;

  const isImage = file.type === "image" || Boolean(file.src);

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center overflow-hidden bg-black/85 p-3 text-cyan-50 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(103,232,249,0.08),transparent_42%)]" />

      <div className="pointer-events-none fixed inset-0 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.04),rgba(255,255,255,0.04)_1px,transparent_1px,transparent_5px)] opacity-40" />

      <section
        className="relative z-10 flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden border border-cyan-300/35 bg-slate-950/95 shadow-[0_0_60px_rgba(34,211,238,0.12),inset_0_0_36px_rgba(34,211,238,0.05)]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-cyan-300/20 p-4">
          <div className="min-w-0">
            <p className="m-0 text-[11px] tracking-[0.3em] text-cyan-50/55">
              FILE VIEWER
            </p>

            <h2 className="mt-1 truncate text-base tracking-[0.16em] text-cyan-300 sm:text-lg">
              {file.title || "[INCOMING FILE]"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 border border-rose-400/50 px-3 py-2 text-[11px] tracking-[0.2em] text-rose-300 transition hover:bg-rose-400/10"
          >
            CLOSE
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-auto p-3 sm:p-4">
          {isImage ? (
            <div className="border border-cyan-300/20 bg-slate-950 p-2">
              <img
                src={file.src}
                alt={file.caption || file.title || "Recovered file"}
                className="mx-auto max-h-[68dvh] w-full object-contain contrast-125 saturate-75 brightness-90"
              />
            </div>
          ) : (
            <div className="border border-cyan-300/20 bg-slate-900/50 p-4 text-sm leading-7 text-cyan-50/75">
              {file.content || "[NO READABLE CONTENT AVAILABLE]"}
            </div>
          )}

          {file.caption && (
            <p className="mt-3 text-sm leading-6 text-cyan-50/65">
              {file.caption}
            </p>
          )}

          {file.source && (
            <p className="mt-3 text-[10px] tracking-[0.2em] text-emerald-200/55">
              SOURCE: {file.source}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
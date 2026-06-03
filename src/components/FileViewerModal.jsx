import {
  TransformComponent,
  TransformWrapper
} from "react-zoom-pan-pinch";

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
        className="relative z-10 flex h-[92dvh] w-full max-w-4xl flex-col overflow-hidden border border-cyan-300/35 bg-slate-950/95 shadow-[0_0_60px_rgba(34,211,238,0.12),inset_0_0_36px_rgba(34,211,238,0.05)]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-cyan-300/20 p-4">
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

        <div className="min-h-0 flex-1 overflow-hidden p-3 sm:p-4">
          {isImage ? (
            <TransformWrapper
              initialScale={1}
              minScale={1}
              maxScale={8}
              centerOnInit
              limitToBounds={false}
              wheel={{ step: 0.2 }}
              pinch={{ step: 8 }}
              doubleClick={{ mode: "zoomIn", step: 1.4 }}
              panning={{ velocityDisabled: true }}
            >
              {({ zoomIn, zoomOut, resetTransform, state }) => (
                <div className="flex h-full min-h-0 flex-col overflow-hidden border border-cyan-300/20 bg-black">
                  <div className="flex shrink-0 items-center justify-between gap-3 border-b border-cyan-300/15 bg-slate-950/90 p-2">
                    <span className="text-[10px] tracking-[0.18em] text-cyan-50/45">
                      ZOOM {Math.round(state.scale * 100)}%
                    </span>

                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => zoomOut()}
                        className="border border-cyan-300/30 px-3 text-cyan-200 transition hover:bg-cyan-400/10"
                      >
                        −
                      </button>

                      <button
                        type="button"
                        onClick={() => zoomIn()}
                        className="border border-cyan-300/30 px-3 text-cyan-200 transition hover:bg-cyan-400/10"
                      >
                        +
                      </button>

                      <button
                        type="button"
                        onClick={() => resetTransform()}
                        className="border border-cyan-300/30 px-3 text-[10px] tracking-[0.14em] text-cyan-200 transition hover:bg-cyan-400/10"
                      >
                        RESET
                      </button>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-hidden">
                    <TransformComponent
                      wrapperStyle={{
                        width: "100%",
                        height: "100%"
                      }}
                      contentStyle={{
                        width: "100%",
                        height: "100%"
                      }}
                    >
                      <img
                        src={file.src}
                        alt={file.caption || file.title || "Recovered file"}
                        className="h-full w-full object-contain contrast-125 saturate-75 brightness-90"
                        draggable={false}
                      />
                    </TransformComponent>
                  </div>
                </div>
              )}
            </TransformWrapper>
          ) : (
            <div className="terminal-scrollbar h-full overflow-y-auto border border-cyan-300/20 bg-slate-900/50 p-4 text-sm leading-7 text-cyan-50/75 whitespace-pre-wrap">
              {file.content || "[NO READABLE CONTENT AVAILABLE]"}
            </div>
          )}
        </div>

        {(file.caption || file.source) && (
          <footer className="terminal-scrollbar max-h-28 shrink-0 overflow-y-auto border-t border-cyan-300/15 p-3 sm:p-4">
            {file.caption && (
              <p className="text-sm leading-6 text-cyan-50/65">
                {file.caption}
              </p>
            )}

            {file.source && (
              <p className="mt-2 text-[10px] tracking-[0.2em] text-emerald-200/55">
                SOURCE: {file.source}
              </p>
            )}
          </footer>
        )}
      </section>
    </div>
  );
}
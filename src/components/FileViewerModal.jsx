import { useTranslation } from "react-i18next";
import {
  TransformComponent,
  TransformWrapper
} from "react-zoom-pan-pinch";

function resolveText(t, key, fallback = "") {
  if (key && typeof t === "function") {
    const translated = t(key);

    if (translated && translated !== key) {
      return translated;
    }
  }

  return fallback;
}

export default function FileViewerModal({ file, onClose }) {
  const { t } = useTranslation();

  if (!file) return null;

  const isImage = file.type === "image" || Boolean(file.src);

  const title = resolveText(
    t,
    file.titleKey,
    file.title || "[GELEN BULGU / DOSYA]"
  );

  const caption = resolveText(
    t,
    file.captionKey,
    file.caption || ""
  );

  const content = resolveText(
    t,
    file.contentKey,
    file.content || ""
  );

  const source = resolveText(
    t,
    file.sourceKey,
    file.source || ""
  );

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center overflow-hidden bg-black/90 p-3 text-stone-200 backdrop-blur-xs sm:p-6 font-mono select-none"
      onClick={onClose}
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.02),transparent_50%)]" />

      <div className="pointer-events-none fixed inset-0 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.01),rgba(255,255,255,0.01)_1px,transparent_1px,transparent_5px)] opacity-25" />

      <section
        className="relative z-10 flex h-[92dvh] w-full max-w-4xl flex-col overflow-hidden border border-stone-900 bg-neutral-950 shadow-[0_0_40px_rgba(0,0,0,0.85)] rounded-xs"
        onClick={(event) => event.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-stone-900 p-4">
          <div className="min-w-0">
            <p className="m-0 text-[9px] tracking-[0.3em] text-stone-500 font-black uppercase">
              {t("fileViewer.title", "BULGU GÖRÜNTÜLEYİCİ")}
            </p>

            <h2 className="mt-1 truncate text-xs sm:text-sm tracking-[0.16em] text-amber-500 font-bold uppercase">
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 border border-stone-800 bg-stone-900/20 px-4 py-2 text-[9px] tracking-[0.2em] font-bold text-stone-400 transition hover:bg-rose-950/20 hover:text-rose-500 hover:border-rose-900 rounded-xs"
          >
            {t("common.close", "[KAPAT]")}
          </button>
        </header>

        {/* MODAL MERKEZ İÇERİK ALANI */}
        <div className="min-h-0 flex-1 overflow-hidden p-3 sm:p-4">
          {isImage ? (
            <TransformWrapper
              initialScale={1}
              minScale={1}
              maxScale={8}
              centerOnInit
              limitToBounds={false}
              wheel={{ step: 0.15 }}
              pinch={{ step: 6 }}
              doubleClick={{ mode: "zoomIn", step: 1.5 }}
              panning={{ velocityDisabled: true }}
            >
              {({ zoomIn, zoomOut, resetTransform, state }) => (
                <div className="flex h-full min-h-0 flex-col overflow-hidden border border-stone-900 bg-black rounded-xs">
                  {/* Fotoğraf Yakınlaştırma Araç Çubuğu */}
                  <div className="flex shrink-0 items-center justify-between gap-3 border-b border-stone-900 bg-stone-950 p-2 text-[9px] font-bold tracking-widest text-stone-500 uppercase">
                    <span>
                      {t("fileViewer.zoom", "ÖLÇEK:")}{" "}
                      <span className="text-stone-300 font-mono font-bold">{Math.round(state.scale * 100)}%</span>
                    </span>

                    <div className="flex shrink-0 gap-1.5 font-mono">
                      <button
                        type="button"
                        onClick={() => zoomOut()}
                        className="border border-stone-800 px-3 py-1 text-stone-400 hover:bg-stone-900 hover:text-stone-200 transition rounded-xs"
                      >
                        −
                      </button>

                      <button
                        type="button"
                        onClick={() => zoomIn()}
                        className="border border-stone-800 px-3 py-1 text-stone-400 hover:bg-stone-900 hover:text-stone-200 transition rounded-xs"
                      >
                        +
                      </button>

                      <button
                        type="button"
                        onClick={() => resetTransform()}
                        className="border border-stone-800 px-3 py-1 text-[9px] tracking-[0.12em] text-stone-400 hover:bg-stone-900 hover:text-stone-200 transition rounded-xs uppercase"
                      >
                        {t("common.reset", "SIFIRLA")}
                      </button>
                    </div>
                  </div>

                  {/* Görsel Katmanı */}
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
                        alt={
                          caption ||
                          title ||
                          t("fileViewer.recoveredFile", "Kurtarılan kurtarma dosyası")
                        }
                        className="h-full w-full object-contain contrast-115 saturate-50 brightness-75"
                        draggable={false}
                      />
                    </TransformComponent>
                  </div>
                </div>
              )}
            </TransformWrapper>
          ) : (
            /* Metin Bulguları Katmanı (Yazıtlar, Günlük Notları) */
            <div className="terminal-scrollbar h-full overflow-y-auto border border-stone-900 bg-stone-950/40 p-4 text-xs leading-relaxed tracking-wide text-stone-400 whitespace-pre-wrap font-mono rounded-xs">
              {content ||
                t(
                  "fileViewer.noReadableContent",
                  "[OKUNABİLİR VERİ KAYDI MEVCUT DEĞİL]"
                )}
            </div>
          )}
        </div>

        {/* MODAL PANEL FOOTER (AÇIKLAMA VE KAYNAK) */}
        {(caption || source) && (
          <footer className="terminal-scrollbar max-h-28 shrink-0 overflow-y-auto border-t border-stone-900 p-3 sm:p-4 bg-stone-950/30">
            {caption && (
              <p className="text-xs leading-relaxed tracking-wide text-stone-400 font-mono m-0">
                {caption}
              </p>
            )}

            {source && (
              <p className="mt-2 text-[9px] tracking-[0.18em] text-amber-600/60 font-bold uppercase m-0">
                {t("fileViewer.source", "KAYNAK BLOK")}: {source}
              </p>
            )}
          </footer>
        )}
      </section>
    </div>
  );
}
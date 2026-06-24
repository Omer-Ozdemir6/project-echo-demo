import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const CATEGORIES = [
  {
    id: "all",
    labelKey: "dataBank.categories.all",
    fallback: "TÜMÜ"
  },
  {
    id: "log",
    labelKey: "dataBank.categories.logs",
    fallback: "GÜNLÜKLER"
  },
  {
    id: "archive",
    labelKey: "dataBank.categories.archive",
    fallback: "YAZITLAR"
  },
  {
    id: "personnel",
    labelKey: "dataBank.categories.personnel",
    fallback: "EKİP"
  }
];

function resolveText(t, key, fallback = "") {
  if (key && typeof t === "function") {
    const translated = t(key);

    if (translated && translated !== key) {
      return translated;
    }
  }

  return fallback;
}

function getFileTypeLabel(type, t) {
  if (type === "image") return resolveText(t, "dataBank.types.image", "FOTO");
  if (type === "log") return resolveText(t, "dataBank.types.log", "NOT");
  if (type === "map") return resolveText(t, "dataBank.types.map", "HARİTA");
  if (type === "crew") return resolveText(t, "dataBank.types.crew", "EKİP");

  return resolveText(t, "dataBank.types.file", "BLOK");
}

function getCategoryCount(files, categoryId) {
  if (categoryId === "all") return files.length;
  return files.filter((file) => file.type === categoryId).length;
}

export default function DataBankModal({
  files = [],
  onOpenFile,
  onFileRead,
  onClose
}) {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredFiles = useMemo(() => {
    const sortedFiles = [...files].sort((a, b) => {
      const aTime = a.collectedAt ? new Date(a.collectedAt).getTime() : 0;
      const bTime = b.collectedAt ? new Date(b.collectedAt).getTime() : 0;

      return bTime - aTime;
    });

    if (activeCategory === "all") {
      return sortedFiles;
    }

    return sortedFiles.filter((file) => file.type === activeCategory);
  }, [files, activeCategory]);

  function handleOpenFile(file) {
    onFileRead?.(file.id);
    onOpenFile(file);
  }

  function getFileTitle(file) {
    return resolveText(
      t,
      file.titleKey,
      file.title || resolveText(t, "dataBank.unknownFile", "BİLİNMEYEN BULGU")
    );
  }

  function getFileCaption(file) {
    return resolveText(t, file.captionKey, file.caption || "");
  }

  function getFileSource(file) {
    return resolveText(t, file.sourceKey, file.source || "");
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/90 p-3 text-stone-200 backdrop-blur-xs sm:p-6 font-mono select-none">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.02),transparent_55%)]" />

      <section className="relative z-10 flex max-h-[88dvh] w-full max-w-3xl flex-col overflow-hidden border border-stone-900 bg-neutral-950 shadow-[0_0_50px_rgba(0,0,0,0.85)] animate-[modalScaleIn_0.25s_ease-out_both] rounded-xs">
        
        {/* MODAL HEADER */}
        <header className="flex items-start justify-between gap-4 border-b border-stone-900 p-4">
          <div className="min-w-0">
            <p className="m-0 text-[9px] tracking-[0.3em] text-stone-500 font-black uppercase">
              {resolveText(t, "dataBank.title", "BULGU BANKASI")}
            </p>

            <h2 className="mt-1 truncate text-base tracking-[0.2em] text-amber-500 font-bold uppercase">
              {resolveText(t, "dataBank.archiveTitle", "ARKEOLOJİK ARŞİV")}
            </h2>

            <p className="mt-1.5 text-[9px] tracking-[0.15em] text-stone-600 font-bold uppercase">
              {t("dataBank.filesRecovered", {
                count: files.length,
                defaultValue: "{{count}} KANIT ARŞİVLEDİ"
              })}
            </p>
          </div>

          <button
            type="button"
            className="shrink-0 border border-stone-800 bg-stone-900/20 px-4 py-2 text-[9px] tracking-[0.2em] font-bold text-stone-400 transition hover:bg-rose-950/20 hover:text-rose-500 hover:border-rose-900 rounded-xs"
            onClick={onClose}
          >
            {resolveText(t, "common.close", "[KAPAT]")}
          </button>
        </header>

        {/* KATEGORİ SEÇİCİ PANEL */}
        <div className="grid grid-cols-2 gap-2 border-b border-stone-900 bg-black p-3 sm:grid-cols-4 font-mono">
          {CATEGORIES.map((category) => {
            const isActive = activeCategory === category.id;
            const count = getCategoryCount(files, category.id);
            const label = resolveText(t, category.labelKey, category.fallback);

            return (
              <button
                key={category.id}
                type="button"
                className={[
                  "border px-2 py-2 text-[9px] tracking-[0.15em] font-bold transition uppercase rounded-xs",
                  isActive
                    ? "border-amber-600/50 bg-amber-950/10 text-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.05)]"
                    : "border-stone-900 bg-stone-950/40 text-stone-600 hover:border-stone-800 hover:text-stone-300"
                ].join(" ")}
                onClick={() => setActiveCategory(category.id)}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>

        {/* BOŞ ARŞİV DURUMU */}
        {filteredFiles.length === 0 && (
          <div className="grid min-h-[260px] flex-1 place-items-center p-6 text-center">
            <div>
              <p className="m-0 tracking-[0.2em] text-stone-600 font-bold uppercase text-xs">
                {resolveText(t, "dataBank.noDataFound", "HİÇBİR VERİ BULUNAMADI")}
              </p>

              <span className="mt-2 block text-[11px] text-stone-600 font-mono tracking-wide">
                {files.length === 0
                  ? resolveText(
                      t,
                      "dataBank.emptyArchiveHint",
                      "Jones'un telsiz hattından aktaracağı bulgular burada arşivlenecektir."
                    )
                  : resolveText(
                      t,
                      "dataBank.emptyCategoryHint",
                      "Bu kategoride ayrıştırılmış bir bulgu henüz mevcut değil."
                    )}
              </span>
            </div>
          </div>
        )}

        {/* ARŞİV LİSTESİ */}
        {filteredFiles.length > 0 && (
          <div className="terminal-scrollbar flex-1 space-y-2 overflow-y-auto p-3">
            {filteredFiles.map((file, index) => {
              const fileTitle = getFileTitle(file);
              const fileCaption = getFileCaption(file);
              const fileSource = getFileSource(file);
              const typeLabel = getFileTypeLabel(file.type, t);

              return (
                <button
                  key={file.id || `${fileTitle}-${index}`}
                  type="button"
                  className={[
                    "group relative flex w-full items-start gap-3 rounded-xs",
                    "border border-stone-900 bg-stone-950/40 p-3",
                    "text-left text-stone-300 transition",
                    "animate-[messageIn_0.35s_ease-out_both]",
                    "hover:translate-x-1 hover:border-amber-900/40 hover:bg-amber-950/5"
                  ].join(" ")}
                  style={{ animationDelay: `${index * 60}ms` }}
                  onClick={() => handleOpenFile(file)}
                >
                  {file.isNew && (
                    <span className="absolute right-3 top-3 text-[8px] tracking-[0.15em] text-amber-500 font-bold animate-pulse uppercase">
                      {resolveText(t, "common.new", "YENİ")}
                    </span>
                  )}

                  <span className="grid h-10 min-w-10 place-items-center border border-stone-900 text-[9px] tracking-[0.1em] text-stone-500 font-black uppercase bg-black">
                    {typeLabel}
                  </span>

                  <span className="flex min-w-0 flex-col gap-1 pr-10">
                    <strong className="truncate text-xs uppercase text-stone-200 font-bold tracking-wide">
                      {fileTitle}
                    </strong>

                    <small className="text-[9px] tracking-[0.12em] text-stone-600 font-bold uppercase">
                      {resolveText(t, "dataBank.type", "KATMAN TÜRÜ")}: {typeLabel}
                    </small>

                    {fileCaption && (
                      <small className="line-clamp-2 text-[11px] leading-relaxed text-stone-500 font-mono mt-0.5">
                        {fileCaption}
                      </small>
                    )}

                    {fileSource && (
                      <em className="mt-1 text-[9px] not-italic tracking-[0.15em] text-amber-600/50 font-bold uppercase">
                        {resolveText(t, "dataBank.source", "DİZİN")}:{" "}
                        {fileSource}
                      </em>
                    )}

                    {file.collectedAt && (
                      <em className="text-[9px] not-italic tracking-[0.15em] text-stone-600 font-bold uppercase">
                        {resolveText(t, "dataBank.recovered", "AKTARIM TI")}:{" "}
                        {new Date(file.collectedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </em>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
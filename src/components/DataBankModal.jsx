import { useMemo, useState } from "react";

const CATEGORIES = [
  { id: "all", label: "ALL" },
  { id: "image", label: "IMAGES" },
  { id: "log", label: "LOGS" },
  { id: "map", label: "MAPS" },
  { id: "crew", label: "CREW" },
  { id: "file", label: "FILES" }
];

function getFileTypeLabel(type) {
  if (type === "image") return "IMG";
  if (type === "log") return "LOG";
  if (type === "map") return "MAP";
  if (type === "crew") return "CREW";
  return "FILE";
}

function getCategoryCount(files, categoryId) {
  if (categoryId === "all") return files.length;
  return files.filter((file) => file.type === categoryId).length;
}

export default function DataBankModal({ files = [], onOpenFile, onClose }) {
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredFiles = useMemo(() => {
    if (activeCategory === "all") return files;
    return files.filter((file) => file.type === activeCategory);
  }, [files, activeCategory]);

  function handleOpenFile(file) {
    onOpenFile(file);
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/75 p-3 text-cyan-50 backdrop-blur-sm sm:p-6">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.08),transparent_55%)]" />

      <section className="relative z-10 flex max-h-[88dvh] w-full max-w-3xl flex-col overflow-hidden border border-cyan-300/35 bg-slate-950/95 shadow-[0_0_60px_rgba(34,211,238,0.16),inset_0_0_36px_rgba(34,211,238,0.05)] animate-[modalScaleIn_0.25s_ease-out_both]">
        <header className="flex items-start justify-between gap-4 border-b border-cyan-300/20 p-4">
          <div className="min-w-0">
            <p className="m-0 text-[11px] tracking-[0.3em] text-cyan-50/55">
              DATA BANK
            </p>

            <h2 className="mt-1 truncate text-lg tracking-[0.2em] text-cyan-300">
              EVIDENCE ARCHIVE
            </h2>

            <p className="mt-1 text-[10px] tracking-[0.18em] text-cyan-50/40">
              {files.length} FILES RECOVERED
            </p>
          </div>

          <button
            type="button"
            className="shrink-0 border border-rose-400/50 px-3 py-2 text-[11px] tracking-[0.2em] text-rose-300 transition hover:bg-rose-400/10"
            onClick={onClose}
          >
            CLOSE
          </button>
        </header>

        <div className="grid grid-cols-3 gap-2 border-b border-cyan-300/15 bg-slate-950/60 p-3 sm:grid-cols-6">
          {CATEGORIES.map((category) => {
            const isActive = activeCategory === category.id;
            const count = getCategoryCount(files, category.id);

            return (
              <button
                key={category.id}
                type="button"
                className={[
                  "border px-2 py-2 text-[10px] tracking-[0.14em] transition",
                  isActive
                    ? "border-emerald-300/45 bg-emerald-950/35 text-emerald-200 shadow-[0_0_12px_rgba(134,239,172,0.08)]"
                    : "border-cyan-300/15 bg-slate-900/70 text-cyan-50/55 hover:border-cyan-300/35 hover:bg-cyan-400/10 hover:text-cyan-50"
                ].join(" ")}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.label} ({count})
              </button>
            );
          })}
        </div>

        {filteredFiles.length === 0 && (
          <div className="grid min-h-[260px] flex-1 place-items-center p-6 text-center">
            <div>
              <p className="m-0 tracking-[0.2em] text-cyan-300">
                NO DATA FOUND
              </p>

              <span className="mt-2 block text-sm text-cyan-50/50">
                {files.length === 0
                  ? "Incoming evidence will be archived here."
                  : "No recovered files in this category."}
              </span>
            </div>
          </div>
        )}

        {filteredFiles.length > 0 && (
          <div className="echo-scrollbar flex-1 space-y-2 overflow-y-auto p-3">
            {filteredFiles.map((file, index) => (
              <button
                key={file.id || `${file.title}-${index}`}
                type="button"
                className={[
                  "group relative flex w-full items-start gap-3",
                  "border border-cyan-300/15 bg-slate-900/55 p-3",
                  "text-left text-cyan-50 transition",
                  "animate-[messageIn_0.35s_ease-out_both]",
                  "hover:translate-x-1 hover:border-cyan-300/35 hover:bg-cyan-400/10"
                ].join(" ")}
                style={{ animationDelay: `${index * 70}ms` }}
                onClick={() => handleOpenFile(file)}
              >
                {file.isNew && (
                  <span className="absolute right-3 top-3 text-[9px] tracking-[0.18em] text-emerald-300 animate-pulse">
                    NEW
                  </span>
                )}

                <span className="grid h-11 min-w-11 place-items-center border border-cyan-300/25 text-[10px] tracking-[0.12em] text-cyan-300">
                  {getFileTypeLabel(file.type)}
                </span>

                <span className="flex min-w-0 flex-col gap-1 pr-10">
                  <strong className="truncate text-sm uppercase text-cyan-50">
                    {file.title || "UNKNOWN FILE"}
                  </strong>

                  <small className="text-[10px] tracking-[0.12em] text-cyan-50/40">
                    TYPE: {getFileTypeLabel(file.type)}
                  </small>

                  {file.caption && (
                    <small className="line-clamp-2 text-xs leading-5 text-cyan-50/55">
                      {file.caption}
                    </small>
                  )}

                  {file.source && (
                    <em className="mt-1 text-[10px] not-italic tracking-[0.12em] text-cyan-300/45">
                      SOURCE: {file.source}
                    </em>
                  )}

                  {file.collectedAt && (
                    <em className="text-[10px] not-italic tracking-[0.12em] text-emerald-200/55">
                      RECOVERED:{" "}
                      {new Date(file.collectedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </em>
                  )}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
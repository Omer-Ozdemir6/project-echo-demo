import { useMemo, useState } from "react";

function resolveText(t, key, fallback = "") {
  if (key && typeof t === "function") {
    const translated = t(key);

    if (translated && translated !== key) return translated;
  }

  return fallback;
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function resolveItemLabel(item, t) {
  if (typeof item === "string") return item;

  return resolveText(t, item?.labelKey, item?.label || item?.id || "");
}

export default function MatchingPuzzleInput({
  puzzle,
  attempts = 0,
  onSubmit,
  t
}) {
  const [selectedLeftId, setSelectedLeftId] = useState(null);
  const [matches, setMatches] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const leftItems = Array.isArray(puzzle?.leftItems) ? puzzle.leftItems : [];
  const rightItems = Array.isArray(puzzle?.rightItems) ? puzzle.rightItems : [];
  const pairs = Array.isArray(puzzle?.pairs) ? puzzle.pairs : [];

  const title = resolveText(
    t,
    puzzle?.titleKey,
    puzzle?.title || "BULGU İLİŞKİLENDİRME PANELİ"
  );

  const description = resolveText(
    t,
    puzzle?.descriptionKey,
    puzzle?.description || ""
  );

  const submitLabel = resolveText(
    t,
    puzzle?.submitLabelKey,
    puzzle?.submitLabel || "KORELASYONU DOĞRULA"
  );

  const progressText = useMemo(() => {
    const matchedCount = Object.keys(matches).length;
    return `${matchedCount}/${leftItems.length}`;
  }, [matches, leftItems.length]);

  function handleLeftClick(leftId) {
    setSelectedLeftId((prev) => (prev === leftId ? null : leftId));
  }

  function handleRightClick(rightId) {
    if (!selectedLeftId) return;

    setMatches((prev) => ({
      ...prev,
      [selectedLeftId]: rightId
    }));

    setSelectedLeftId(null);
  }

  function removeMatch(leftId) {
    setMatches((prev) => {
      const next = { ...prev };
      delete next[leftId];
      return next;
    });
  }

  function isSolved() {
    if (Object.keys(matches).length !== pairs.length) return false;

    return pairs.every((pair) => {
      const leftId = pair.leftId || pair.left;
      const rightId = pair.rightId || pair.right;

      return normalize(matches[leftId]) === normalize(rightId);
    });
  }

  function handleSubmit() {
    if (isSubmitting) return;

    setIsSubmitting(true);

    const answer = isSolved()
      ? String(puzzle?.acceptedAnswers?.[0] || "MATCH_CONFIRMED")
      : `matching:${JSON.stringify(matches)}`;

    onSubmit(answer);

    setTimeout(() => {
      setIsSubmitting(false);
    }, puzzle?.submitCooldownMs || 500);
  }

  return (
    <div className="mt-4 border border-stone-900 bg-neutral-950 p-4 shadow-[0_0_30px_rgba(0,0,0,0.6)] font-mono rounded-xs select-none">
      
      {/* ÜST PANEL DURUM BAŞLIĞI */}
      <div className="mb-3 flex items-start justify-between gap-4 border-b border-stone-900 pb-3">
        <div>
          <p className="m-0 text-[9px] tracking-[0.25em] text-stone-600 font-black uppercase">
            {resolveText(t, "puzzle.matching.moduleActive", "ANALOG KORELASYON MODÜLÜ AKTİF")}
          </p>

          <h3 className="mt-1 text-xs tracking-[0.24em] text-amber-500 font-bold uppercase">
            {title}
          </h3>
        </div>

        <div className="text-right font-bold uppercase">
          <p className="m-0 text-[9px] tracking-[0.15em] text-stone-500">
            {resolveText(t, "puzzle.matching.progress", "BAĞLANTILAR")}: <span className="text-amber-600">{progressText}</span>
          </p>

          {attempts > 0 && (
            <p className="m-0 mt-1 text-[9px] tracking-[0.15em] text-rose-600">
              {resolveText(t, "puzzle.common.attempts", "DENEME")}: {attempts}
            </p>
          )}
        </div>
      </div>

      {description && (
        <p className="mb-3 text-[11px] leading-relaxed text-stone-500 text-justify font-mono">
          {description}
        </p>
      )}

      {/* REZONANS KILAVUZ SATIRI */}
      <div className="mb-4 border border-stone-900 bg-black p-3 text-[11px] tracking-wide text-stone-400 font-bold rounded-xs">
        &gt; {resolveText(
          t,
          "puzzle.matching.instructions",
          "SOL KOLONDAN BİR VERİ SEÇİN, ARDINDAN SAĞ KOLONDAKİ DOĞRU ANALİZ SEÇENEĞİYLE EŞLEŞTİRİN."
        )}
      </div>

      {/* MATRİS KOLONLARI */}
      <div className="grid gap-4 sm:grid-cols-2">
        
        {/* SOL KOLON: BULGULAR */}
        <div className="space-y-2">
          <p className="text-[9px] tracking-widest text-stone-600 font-black uppercase border-b border-stone-900 pb-1">
            {resolveText(t, "puzzle.matching.leftColumn", "KAZI BULGULARI / VERİLER")}
          </p>

          {leftItems.map((item) => {
            const id = item.id || item.value || item.label;
            const label = resolveItemLabel(item, t);
            const isSelected = selectedLeftId === id;
            const matchedRightId = matches[id];

            return (
              <button
                key={id}
                type="button"
                onClick={() => handleLeftClick(id)}
                className={[
                  "w-full border p-3 text-left text-xs leading-relaxed tracking-wide transition font-mono font-bold rounded-xs",
                  isSelected
                    ? "border-amber-600 bg-amber-950/10 text-amber-500 shadow-[inset_0_0_8px_rgba(245,158,11,0.1)]"
                    : matchedRightId
                      ? "border-stone-800 bg-stone-900/40 text-stone-300"
                      : "border-stone-900 bg-black/40 text-stone-500 hover:border-stone-700 hover:text-stone-400"
                ].join(" ")}
              >
                <span className="block">{label}</span>

                {matchedRightId && (
                  <span className="mt-2 block text-[10px] tracking-wide text-amber-600 font-black uppercase">
                    ➔ {resolveItemLabel(
                      rightItems.find((right) => (right.id || right.value || right.label) === matchedRightId),
                      t
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* SAĞ KOLON: ANALİZ / ETKİLER */}
        <div className="space-y-2">
          <p className="text-[9px] tracking-widest text-stone-600 font-black uppercase border-b border-stone-900 pb-1">
            {resolveText(t, "puzzle.matching.rightColumn", "ANLAMSAL EŞLEŞMELER")}
          </p>

          {rightItems.map((item) => {
            const id = item.id || item.value || item.label;
            const label = resolveItemLabel(item, t);
            const isUsed = Object.values(matches).includes(id);

            return (
              <button
                key={id}
                type="button"
                disabled={!selectedLeftId}
                onClick={() => handleRightClick(id)}
                className={[
                  "w-full border p-3 text-left text-xs leading-relaxed tracking-wide transition font-mono font-bold rounded-xs",
                  isUsed
                    ? "border-stone-800 bg-stone-900/20 text-stone-600 opacity-40"
                    : "border-stone-900 bg-black/40 text-stone-400 hover:border-stone-700 hover:text-stone-300",
                  !selectedLeftId ? "cursor-not-allowed opacity-40" : ""
                ].join(" ")}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* MEVCUT BAĞLAR LİSTESİ PANELİ */}
      {Object.keys(matches).length > 0 && (
        <div className="mt-4 border border-stone-900 bg-black p-3 rounded-xs">
          <p className="mb-2 text-[9px] tracking-widest text-stone-600 font-black uppercase">
            {resolveText(t, "puzzle.matching.currentLinks", "AKTİF KORELASYON HATLARI")}
          </p>

          <div className="space-y-2">
            {Object.entries(matches).map(([leftId, rightId]) => {
              const leftItem = leftItems.find(
                (item) => (item.id || item.value || item.label) === leftId
              );

              const rightItem = rightItems.find(
                (item) => (item.id || item.value || item.label) === rightId
              );

              return (
                <button
                  key={`${leftId}-${rightId}`}
                  type="button"
                  onClick={() => removeMatch(leftId)}
                  className="block w-full border border-stone-900 bg-neutral-950 p-2 text-left text-[11px] tracking-wide text-stone-400 font-bold font-mono transition hover:border-rose-900 hover:text-rose-600 rounded-xs"
                >
                  {resolveItemLabel(leftItem, t)} ➔ {resolveItemLabel(rightItem, t)}
                </button>
              );
            })}
          </div>

          <p className="mt-2.5 text-[9px] tracking-wide text-stone-600 font-bold uppercase">
            {resolveText(t, "puzzle.matching.removeHint", "BAĞLANTIYI KOPARMAK İÇİN ÜZERİNE TIKLAYIN.")}
          </p>
        </div>
      )}

      {/* DOĞRULAMA AKSİYON BUTONU */}
      <button
        type="button"
        disabled={isSubmitting || Object.keys(matches).length < pairs.length}
        onClick={handleSubmit}
        className="mt-4 w-full border border-stone-800 bg-stone-900/20 px-4 py-3 text-[10px] tracking-widest text-stone-400 font-black uppercase transition hover:border-amber-900 hover:bg-amber-950/10 hover:text-amber-500 disabled:cursor-not-allowed disabled:opacity-20 rounded-xs"
      >
        {isSubmitting
          ? resolveText(t, "puzzle.common.submitting", "...")
          : submitLabel}
      </button>
    </div>
  );
}
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
    puzzle?.title || "EVIDENCE MATCHING"
  );

  const description = resolveText(
    t,
    puzzle?.descriptionKey,
    puzzle?.description || ""
  );

  const submitLabel = resolveText(
    t,
    puzzle?.submitLabelKey,
    puzzle?.submitLabel || "CONFIRM MATCHES"
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
    <div className="mt-4 border border-cyan-300/35 bg-cyan-950/10 p-4 shadow-[0_0_24px_rgba(34,211,238,0.1)]">
      <div className="mb-3 flex items-start justify-between gap-4 border-b border-cyan-300/20 pb-3">
        <div>
          <p className="m-0 text-[10px] tracking-[0.25em] text-cyan-300/60">
            {resolveText(t, "puzzle.matching.moduleActive", "CORRELATION MODULE ACTIVE")}
          </p>

          <h3 className="mt-1 text-xs tracking-[0.24em] text-cyan-200">
            {title}
          </h3>
        </div>

        <div className="text-right">
          <p className="m-0 text-[10px] tracking-[0.18em] text-cyan-50/45">
            {resolveText(t, "puzzle.matching.progress", "MATCHES")}: {progressText}
          </p>

          {attempts > 0 && (
            <p className="m-0 mt-1 text-[10px] tracking-[0.18em] text-rose-300">
              {resolveText(t, "puzzle.common.attempts", "ATTEMPTS")}: {attempts}
            </p>
          )}
        </div>
      </div>

      {description && (
        <p className="mb-3 text-xs leading-5 text-cyan-50/55">
          {description}
        </p>
      )}

      <div className="mb-3 border border-cyan-300/15 bg-black/35 p-3 text-[11px] tracking-[0.14em] text-cyan-100/60">
        &gt; {resolveText(
          t,
          "puzzle.matching.instructions",
          "SELECT ONE ITEM ON THE LEFT, THEN MATCH IT WITH ONE ITEM ON THE RIGHT."
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="text-[10px] tracking-[0.22em] text-cyan-300/50">
            {resolveText(t, "puzzle.matching.leftColumn", "EVIDENCE")}
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
                  "w-full border p-3 text-left text-xs leading-5 tracking-[0.08em] transition",
                  isSelected
                    ? "border-emerald-300/60 bg-emerald-950/25 text-emerald-100"
                    : matchedRightId
                      ? "border-cyan-300/35 bg-cyan-950/20 text-cyan-100"
                      : "border-cyan-300/15 bg-slate-950/60 text-cyan-50/65 hover:border-cyan-300/35 hover:bg-cyan-400/10"
                ].join(" ")}
              >
                <span className="block">{label}</span>

                {matchedRightId && (
                  <span className="mt-2 block text-[10px] tracking-[0.12em] text-emerald-300/70">
                    → {resolveItemLabel(
                      rightItems.find((right) => (right.id || right.value || right.label) === matchedRightId),
                      t
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="space-y-2">
          <p className="text-[10px] tracking-[0.22em] text-cyan-300/50">
            {resolveText(t, "puzzle.matching.rightColumn", "CORRELATION")}
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
                  "w-full border p-3 text-left text-xs leading-5 tracking-[0.08em] transition",
                  isUsed
                    ? "border-emerald-300/35 bg-emerald-950/15 text-emerald-100"
                    : "border-cyan-300/15 bg-slate-950/60 text-cyan-50/65 hover:border-cyan-300/35 hover:bg-cyan-400/10",
                  !selectedLeftId ? "cursor-not-allowed opacity-60" : ""
                ].join(" ")}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {Object.keys(matches).length > 0 && (
        <div className="mt-3 border border-cyan-300/15 bg-slate-950/45 p-3">
          <p className="mb-2 text-[10px] tracking-[0.2em] text-cyan-300/55">
            {resolveText(t, "puzzle.matching.currentLinks", "CURRENT LINKS")}
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
                  className="block w-full border border-cyan-300/10 bg-black/25 p-2 text-left text-[11px] tracking-[0.1em] text-cyan-50/65 transition hover:border-rose-300/40 hover:text-rose-200"
                >
                  {resolveItemLabel(leftItem, t)} → {resolveItemLabel(rightItem, t)}
                </button>
              );
            })}
          </div>

          <p className="mt-2 text-[10px] tracking-[0.12em] text-cyan-50/35">
            {resolveText(t, "puzzle.matching.removeHint", "CLICK A LINK TO REMOVE IT.")}
          </p>
        </div>
      )}

      <button
        type="button"
        disabled={isSubmitting || Object.keys(matches).length < pairs.length}
        onClick={handleSubmit}
        className="mt-3 w-full border border-emerald-300/45 bg-emerald-950/20 px-4 py-3 text-[11px] tracking-[0.22em] text-emerald-200 transition hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isSubmitting
          ? resolveText(t, "puzzle.common.submitting", "...")
          : submitLabel}
      </button>
    </div>
  );
}
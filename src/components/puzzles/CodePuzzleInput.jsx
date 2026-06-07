import { useMemo, useState } from "react";

function resolveText(t, key, fallback = "") {
  if (key && typeof t === "function") {
    const translated = t(key);

    if (translated && translated !== key) {
      return translated;
    }
  }

  return fallback;
}

function resolveHintText(hint, index, t) {
  if (typeof hint === "string") return hint;

  if (hint && typeof hint === "object") {
    return resolveText(t, hint.textKey, hint.text || `HINT ${index + 1}`);
  }

  return `HINT ${index + 1}`;
}

function buildPanelLines(puzzle, t) {
  const accessLevel = resolveText(
    t,
    puzzle?.accessLevelKey,
    puzzle?.accessLevel || "REMOTE"
  );

  const panelStatus = resolveText(
    t,
    puzzle?.panelStatusKey,
    puzzle?.panelStatus || "LOCKED"
  );

  const expectedFormat = resolveText(
    t,
    puzzle?.expectedFormatKey,
    puzzle?.expectedFormat || ""
  );

  const lines = [
    `${resolveText(t, "puzzle.code.accessLevel", "[ACCESS LEVEL]")} ${accessLevel}`,
    `${resolveText(t, "puzzle.code.panelStatus", "[PANEL STATUS]")} ${panelStatus}`
  ];

  if (expectedFormat) {
    lines.push(
      `${resolveText(t, "puzzle.code.expectedFormat", "[EXPECTED FORMAT]")} ${expectedFormat}`
    );
  }

  lines.push(resolveText(t, "puzzle.code.statusInputRequired", "[STATUS] INPUT REQUIRED"));

  return lines;
}

export default function CodePuzzleInput({
  puzzle,
  attempts = 0,
  onSubmit,
  t
}) {
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visibleHints, setVisibleHints] = useState(0);
  const [verifyStep, setVerifyStep] = useState(null);

  const maxLength = puzzle?.maxLength || undefined;
  const inputMode = puzzle?.inputMode || "text";
  const hints = Array.isArray(puzzle?.hints) ? puzzle.hints : [];
  const visibleHintList = hints.slice(0, visibleHints);
  const canRevealHint = visibleHints < hints.length && !isSubmitting;

  const panelLines = useMemo(() => buildPanelLines(puzzle, t), [puzzle, t]);

  const title = resolveText(
    t,
    puzzle?.titleKey,
    puzzle?.title || "[REMOTE ACCESS PANEL]"
  );

  const description = resolveText(
    t,
    puzzle?.descriptionKey,
    puzzle?.description || ""
  );

  const prompt = resolveText(
    t,
    puzzle?.promptKey,
    puzzle?.prompt || "INPUT REQUIRED"
  );

  const placeholder = resolveText(
    t,
    puzzle?.placeholderKey,
    puzzle?.placeholder || ""
  );

  const submitLabel = resolveText(
    t,
    puzzle?.submitLabelKey,
    puzzle?.submitLabel || "TRANSMIT"
  );

  function revealHint() {
    if (!canRevealHint) return;
    setVisibleHints((prev) => prev + 1);
  }

  function handleChange(e) {
    const rawValue = e.target.value;

    if (puzzle?.uppercaseInput ?? true) {
      setValue(rawValue.toUpperCase());
      return;
    }

    setValue(rawValue);
  }

  function handleSubmit(e) {
    e.preventDefault();

    const normalizedValue = value.trim();

    if (!normalizedValue || isSubmitting) return;

    setIsSubmitting(true);
    setVerifyStep(
      resolveText(t, "puzzle.code.validatingInput", "VALIDATING INPUT...")
    );

    setTimeout(() => {
      setVerifyStep(
        resolveText(t, "puzzle.code.checkingAccessTable", "CHECKING ACCESS TABLE...")
      );
    }, 500);

    setTimeout(() => {
      setVerifyStep(
        resolveText(t, "puzzle.code.sendingRemoteCommand", "SENDING REMOTE COMMAND...")
      );
    }, 1000);

    setTimeout(() => {
      onSubmit(normalizedValue);
      setValue("");
      setVerifyStep(null);
      setIsSubmitting(false);
    }, 1500);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 border border-emerald-300/30 bg-emerald-950/15 p-4 shadow-[0_0_24px_rgba(134,239,172,0.08)]"
    >
      <div className="mb-3 flex items-start justify-between gap-4 border-b border-emerald-300/20 pb-3">
        <div>
          <p className="m-0 text-[10px] tracking-[0.25em] text-emerald-300/55">
            {resolveText(
              t,
              "puzzle.code.remoteInputRequired",
              "REMOTE INPUT REQUIRED"
            )}
          </p>

          <h3 className="mt-1 text-xs tracking-[0.24em] text-emerald-200">
            {title}
          </h3>
        </div>

        {attempts > 0 && (
          <span className="shrink-0 text-[10px] tracking-[0.18em] text-rose-300">
            {resolveText(t, "puzzle.common.attempts", "ATTEMPTS")}: {attempts}
          </span>
        )}
      </div>

      {description && (
        <p className="mb-3 text-xs leading-5 text-cyan-50/55">
          {description}
        </p>
      )}

      <div className="mb-3 border border-emerald-300/15 bg-black/35 p-3">
        {panelLines.map((line) => (
          <p
            key={line}
            className="m-0 mb-1 text-[11px] tracking-[0.14em] text-emerald-100/65 last:mb-0"
          >
            &gt; {line}
          </p>
        ))}
      </div>

      {visibleHintList.length > 0 && (
        <div className="mb-3 border border-amber-300/20 bg-amber-950/10 p-3">
          {visibleHintList.map((hint, index) => (
            <p
              key={`${resolveHintText(hint, index, t)}-${index}`}
              className="m-0 mb-1 text-[11px] tracking-[0.12em] text-amber-200/80 last:mb-0"
            >
              &gt; {resolveText(t, "puzzle.code.hint", "HINT")} {index + 1}:{" "}
              {resolveHintText(hint, index, t)}
            </p>
          ))}
        </div>
      )}

      {hints.length > 0 && (
        <button
          type="button"
          disabled={!canRevealHint}
          onClick={revealHint}
          className="mb-3 w-full border border-amber-300/30 bg-amber-950/10 px-3 py-2 text-[10px] tracking-[0.2em] text-amber-200 transition hover:bg-amber-400/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {visibleHints >= hints.length
            ? resolveText(t, "puzzle.code.noMoreHints", "NO MORE HINTS")
            : resolveText(t, "puzzle.code.requestHint", "REQUEST HINT")}
        </button>
      )}

      {verifyStep && (
        <div className="mb-3 border border-emerald-300/20 bg-emerald-950/10 p-3 text-[11px] tracking-[0.16em] text-emerald-200">
          &gt; {verifyStep}
        </div>
      )}

      <div className="mb-3 border border-cyan-300/15 bg-slate-950/45 p-3 text-xs leading-5 tracking-[0.12em] text-cyan-100 sm:text-sm">
        {prompt}
      </div>

      <div className="flex items-center gap-2 border border-cyan-300/20 bg-slate-950/70 p-2">
        <span className="shrink-0 text-cyan-300/70">&gt;</span>

        <input
          autoFocus
          value={value}
          maxLength={maxLength}
          inputMode={inputMode}
          placeholder={placeholder}
          disabled={isSubmitting}
          onChange={handleChange}
          className="min-w-0 flex-1 bg-transparent px-2 py-2 text-base tracking-[0.16em] text-cyan-50 outline-none placeholder:text-cyan-50/25 disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={!value.trim() || isSubmitting}
          className="shrink-0 border border-emerald-300/40 px-3 py-2 text-[11px] tracking-[0.18em] text-emerald-200 transition hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting
            ? resolveText(t, "puzzle.common.submitting", "...")
            : submitLabel}
        </button>
      </div>
    </form>
  );
}
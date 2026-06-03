import { useMemo, useState } from "react";

function getPuzzleTheme(puzzleType) {
  if (puzzleType === "decrypt") {
    return {
      kicker: "DECRYPTION MODULE ACTIVE",
      border: "border-cyan-300/35",
      glow: "shadow-[0_0_24px_rgba(34,211,238,0.1)]",
      title: "text-cyan-200",
      accent: "text-cyan-300/60",
      button: "border-cyan-300/40 text-cyan-200 hover:bg-cyan-400/10"
    };
  }

  return {
    kicker: "REMOTE INPUT REQUIRED",
    border: "border-emerald-300/30",
    glow: "shadow-[0_0_24px_rgba(134,239,172,0.08)]",
    title: "text-emerald-200",
    accent: "text-emerald-300/55",
    button: "border-emerald-300/40 text-emerald-200 hover:bg-emerald-400/10"
  };
}

function buildDecryptLines(puzzle) {
  const seed = puzzle?.seed || "ECHO";
  const target = puzzle?.targetFrequency || "417";

  return [
    `[SOURCE] ${seed}`,
    "[PACKET] FRAGMENTED",
    "[CIPHER] ROTATIONAL SIGNAL MASK",
    `[TARGET FREQUENCY] ${target}`,
    "[STATUS] INPUT REQUIRED"
  ];
}

export default function PuzzleInput({ puzzle, attempts = 0, onSubmit }) {
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const puzzleType = puzzle?.type || "code";
  const theme = getPuzzleTheme(puzzleType);

  const maxLength = puzzle?.maxLength || undefined;
  const inputMode = puzzle?.inputMode || "text";
  const placeholder = puzzle?.placeholder || "";
  const submitLabel = puzzle?.submitLabel || "TRANSMIT";

  const decryptLines = useMemo(() => {
    if (puzzleType !== "decrypt") return [];
    return buildDecryptLines(puzzle);
  }, [puzzleType, puzzle]);

  function handleSubmit(e) {
    e.preventDefault();

    const normalizedValue = value.trim();

    if (!normalizedValue || isSubmitting) return;

    setIsSubmitting(true);
    onSubmit(normalizedValue);
    setValue("");

    setTimeout(() => {
      setIsSubmitting(false);
    }, puzzle?.submitCooldownMs || 300);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={[
        "mt-4 bg-slate-950/70 p-4",
        "border",
        theme.border,
        theme.glow
      ].join(" ")}
    >
      <div
        className={[
          "mb-3 flex items-start justify-between gap-4 border-b pb-3",
          puzzleType === "decrypt"
            ? "border-cyan-300/20"
            : "border-emerald-300/20"
        ].join(" ")}
      >
        <div>
          <p
            className={[
              "m-0 text-[10px] tracking-[0.25em]",
              theme.accent
            ].join(" ")}
          >
            {puzzle?.kicker || theme.kicker}
          </p>

          <h3
            className={[
              "mt-1 text-xs tracking-[0.24em]",
              theme.title
            ].join(" ")}
          >
            {puzzle?.title || "[REMOTE ACCESS PANEL]"}
          </h3>
        </div>

        {attempts > 0 && (
          <span className="shrink-0 text-[10px] tracking-[0.18em] text-rose-300">
            ATTEMPTS: {attempts}
          </span>
        )}
      </div>

      {puzzle?.description && (
        <p className="mb-3 text-xs leading-5 text-cyan-50/55">
          {puzzle.description}
        </p>
      )}

      {puzzleType === "decrypt" && (
        <div className="mb-3 border border-cyan-300/15 bg-black/35 p-3">
          {decryptLines.map((line) => (
            <p
              key={line}
              className="m-0 mb-1 last:mb-0 text-[11px] tracking-[0.14em] text-cyan-100/65"
            >
              &gt; {line}
            </p>
          ))}
        </div>
      )}

      <div className="mb-3 border border-cyan-300/15 bg-slate-950/45 p-3 text-xs leading-5 tracking-[0.12em] text-cyan-100 sm:text-sm">
        {puzzle?.prompt || "INPUT REQUIRED"}
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
          onChange={(e) => setValue(e.target.value)}
          className="min-w-0 flex-1 bg-transparent px-2 py-2 text-base tracking-[0.16em] text-cyan-50 outline-none placeholder:text-cyan-50/25 disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={!value.trim() || isSubmitting}
          className={[
            "shrink-0 border px-3 py-2 text-[11px] tracking-[0.18em] transition",
            "disabled:cursor-not-allowed disabled:opacity-40",
            theme.button
          ].join(" ")}
        >
          {isSubmitting ? "..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
import { useMemo, useState } from "react";

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

export default function DecryptPuzzleInput({ puzzle, attempts = 0, onSubmit }) {
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const decryptLines = useMemo(() => buildDecryptLines(puzzle), [puzzle]);

  const maxLength = puzzle?.maxLength || undefined;
  const inputMode = puzzle?.inputMode || "text";
  const placeholder = puzzle?.placeholder || "";
  const submitLabel = puzzle?.submitLabel || "DECRYPT";

  function handleSubmit(e) {
    e.preventDefault();

    const normalizedValue = value.trim();

    if (!normalizedValue || isSubmitting) return;

    setIsSubmitting(true);
    onSubmit(normalizedValue);
    setValue("");

    setTimeout(() => {
      setIsSubmitting(false);
    }, puzzle?.submitCooldownMs || 500);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 border border-cyan-300/35 bg-cyan-950/10 p-4 shadow-[0_0_24px_rgba(34,211,238,0.1)]"
    >
      <div className="mb-3 flex items-start justify-between gap-4 border-b border-cyan-300/20 pb-3">
        <div>
          <p className="m-0 text-[10px] tracking-[0.25em] text-cyan-300/60">
            DECRYPTION MODULE ACTIVE
          </p>

          <h3 className="mt-1 text-xs tracking-[0.24em] text-cyan-200">
            {puzzle?.title || "DECRYPTION MODULE"}
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

      <div className="mb-3 border border-cyan-300/15 bg-black/35 p-3">
        {decryptLines.map((line) => (
          <p
            key={line}
            className="m-0 mb-1 text-[11px] tracking-[0.14em] text-cyan-100/65 last:mb-0"
          >
            &gt; {line}
          </p>
        ))}
      </div>

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
          className="shrink-0 border border-cyan-300/40 px-3 py-2 text-[11px] tracking-[0.18em] text-cyan-200 transition hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? "..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
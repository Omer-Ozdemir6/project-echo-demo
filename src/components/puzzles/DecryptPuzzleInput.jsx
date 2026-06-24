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

function buildDecryptLines(puzzle, t) {
  const seed = puzzle?.seed || "REZONANS";
  const target = puzzle?.targetFrequency || "417.2";

  return [
    `${resolveText(t, "puzzle.decrypt.source", "[SİNYAL KAYNAĞI]")} ${seed}`,
    resolveText(t, "puzzle.decrypt.packetFragmented", "[PAKET] PARÇALANMIŞ SİSMİK VERİ"),
    resolveText(
      t,
      "puzzle.decrypt.cipherRotationalSignalMask",
      "[KRİPTO] SİSMİK REZONANS MASKESİ"
    ),
    `${resolveText(t, "puzzle.decrypt.targetFrequency", "[HEDEF FREKANS]")} ${target} MHz`,
    resolveText(
      t,
      "puzzle.decrypt.statusInputRequired",
      "[DURUM] MANUEL VERİ GİRİŞİ BEKLENİYOR"
    )
  ];
}

function resolveHintText(hint, index, t) {
  if (typeof hint === "string") return hint;

  if (hint && typeof hint === "object") {
    return resolveText(
      t,
      hint.textKey,
      hint.text || `İPUCU ${index + 1}`
    );
  }

  return `İPUCU ${index + 1}`;
}

export default function DecryptPuzzleInput({
  puzzle,
  attempts = 0,
  onSubmit,
  t
}) {
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visibleHints, setVisibleHints] = useState(0);
  const [verifyStep, setVerifyStep] = useState(null);

  const decryptLines = useMemo(
    () => buildDecryptLines(puzzle, t),
    [puzzle, t]
  );

  const hints = Array.isArray(puzzle?.hints) ? puzzle.hints : [];
  const visibleHintList = hints.slice(0, visibleHints);
  const canRevealHint = visibleHints < hints.length && !isSubmitting;

  const maxLength = puzzle?.maxLength || undefined;
  const inputMode = puzzle?.inputMode || "text";

  const title = resolveText(
    t,
    puzzle?.titleKey,
    puzzle?.title || "DEŞİFRE MODÜLÜ"
  );

  const description = resolveText(
    t,
    puzzle?.descriptionKey,
    puzzle?.description || ""
  );

  const prompt = resolveText(
    t,
    puzzle?.promptKey,
    puzzle?.prompt || "KOMBİNASYON GİRİŞİ GEREKLİ"
  );

  const placeholder = resolveText(
    t,
    puzzle?.placeholderKey,
    puzzle?.placeholder || ""
  );

  const submitLabel = resolveText(
    t,
    puzzle?.submitLabelKey,
    puzzle?.submitLabel || "DEŞİFRE ET"
  );

  const expectedFormat = resolveText(
    t,
    puzzle?.expectedFormatKey,
    puzzle?.expectedFormat || ""
  );

  const knownFragment = resolveText(
    t,
    puzzle?.knownFragmentKey,
    puzzle?.knownFragment || ""
  );

  function revealHint() {
    if (!canRevealHint) return;
    setVisibleHints((prev) => prev + 1);
  }

  function handleSubmit(e) {
    e.preventDefault();

    const normalizedValue = value.trim();
    if (!normalizedValue || isSubmitting) return;

    setIsSubmitting(true);
    setVerifyStep(
      resolveText(t, "puzzle.decrypt.verifyingInput", "SİNYAL REZONANSI ANALİZ EDİLİYOR...")
    );

    setTimeout(() => {
      setVerifyStep(
        resolveText(
          t,
          "puzzle.decrypt.checkingArchiveHash",
          "ANTİK VERİ KATMANI TARANIYOR..."
        )
      );
    }, 500);

    setTimeout(() => {
      setVerifyStep(
        resolveText(
          t,
          "puzzle.decrypt.comparingPersonnelIndex",
          "EKSPEDİSYON GÜNLÜKLERİ EŞLEŞTİRİLİYOR..."
        )
      );
    }, 1000);

    setTimeout(() => {
      onSubmit(normalizedValue);
      setValue("");
      setVerifyStep(null);
      setIsSubmitting(false);
    }, 1600);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 border border-stone-900 bg-neutral-950 p-4 shadow-[0_0_30px_rgba(0,0,0,0.6)] font-mono rounded-xs"
    >
      {/* ÜST MODÜL BAŞLIĞI */}
      <div className="mb-3 flex items-start justify-between gap-4 border-b border-stone-900 pb-3">
        <div>
          <p className="m-0 text-[9px] tracking-[0.25em] text-stone-600 font-black uppercase">
            {resolveText(
              t,
              "puzzle.decrypt.moduleActive",
              "ANALOG KRİPTO DEŞİFRE MODÜLÜ AKTİF"
            )}
          </p>

          <h3 className="mt-1 text-xs tracking-[0.2em] font-bold text-amber-500 uppercase">
            {title}
          </h3>
        </div>

        {attempts > 0 && (
          <span className="shrink-0 text-[9px] tracking-[0.15em] text-rose-600 font-bold uppercase">
            {resolveText(t, "puzzle.common.attempts", "DENEME")}: {attempts}
          </span>
        )}
      </div>

      {description && (
        <p className="mb-3 text-[11px] leading-relaxed text-stone-500 text-justify">
          {description}
        </p>
      )}

      {/* KRİPTO ANALİZ SATIRLARI */}
      <div className="mb-3 border border-stone-900 bg-black p-3 rounded-xs">
        {decryptLines.map((line) => (
          <p
            key={line}
            className="m-0 mb-1 text-[11px] tracking-wide text-stone-400 font-mono font-bold last:mb-0"
          >
            &gt; {line}
          </p>
        ))}
      </div>

      {/* EK BİLGİ FORMAT KATMANI */}
      {(expectedFormat || knownFragment) && (
        <div className="mb-3 border border-stone-900 bg-stone-950/30 p-3 rounded-xs">
          {expectedFormat && (
            <p className="m-0 mb-1 text-[11px] tracking-wide text-stone-500 font-bold">
              &gt;{" "}
              {resolveText(
                t,
                "puzzle.decrypt.expectedFormat",
                "BEKLENEN BİÇİM"
              )}
              : <span className="text-stone-300 font-mono">{expectedFormat}</span>
            </p>
          )}

          {knownFragment && (
            <p className="m-0 text-[11px] tracking-wide text-stone-500 font-bold">
              &gt;{" "}
              {resolveText(
                t,
                "puzzle.decrypt.knownFragment",
                "BİLİNEN PARÇA"
              )}
              : <span className="text-stone-300 font-mono">{knownFragment}</span>
            </p>
          )}
        </div>
      )}

      {/* TELSİZ İPUÇLARI PANELİ */}
      {visibleHintList.length > 0 && (
        <div className="mb-3 border border-amber-950/40 bg-amber-950/5 p-3 rounded-xs">
          {visibleHintList.map((hint, index) => (
            <p
              key={`${resolveHintText(hint, index, t)}-${index}`}
              className="m-0 mb-1 text-[11px] tracking-wide text-amber-600 font-bold last:mb-0"
            >
              &gt;{" "}
              {resolveText(t, "puzzle.decrypt.hint", "İPUCU")} {index + 1}:{" "}
              {resolveHintText(hint, index, t)}
            </p>
          ))}
        </div>
      )}

      {/* İPUCU İSTEK BUTONU */}
      {hints.length > 0 && (
        <button
          type="button"
          disabled={!canRevealHint}
          onClick={revealHint}
          className="mb-3 w-full border border-stone-900 bg-stone-950/40 px-3 py-2 text-[9px] tracking-[0.2em] text-stone-500 font-bold uppercase transition hover:border-amber-900/40 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-20 rounded-xs"
        >
          {visibleHints >= hints.length
            ? resolveText(t, "puzzle.decrypt.noMoreHints", "EK İPUCU VERİSİ YOK")
            : resolveText(t, "puzzle.decrypt.requestHint", "TELSİZDEN REZONANS İPUCU TALEP ET")}
        </button>
      )}

      {/* ANLIK MATRİS DOĞRULAMA ADIMI */}
      {verifyStep && (
        <div className="mb-3 border border-stone-900 bg-black p-3 text-[11px] tracking-wide text-amber-600 font-bold animate-pulse rounded-xs">
          &gt; {verifyStep}
        </div>
      )}

      {/* AKTİF PROMPT METNİ */}
      <div className="mb-3 border border-stone-900 bg-stone-950/20 p-3 text-xs leading-relaxed text-stone-400 font-bold rounded-xs">
        {prompt}
      </div>

      {/* VERİ ETİKET GİRİŞ ALANI VE AKSİYON BUTONU */}
      <div className="flex items-center gap-2 border border-stone-900 bg-black p-2 rounded-xs">
        <span className="shrink-0 text-stone-700 font-bold ml-1 select-none">&gt;</span>

        <input
          autoFocus
          value={value}
          maxLength={maxLength}
          inputMode={inputMode}
          placeholder={placeholder}
          disabled={isSubmitting}
          onChange={(e) => setValue(e.target.value)}
          className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-sm tracking-widest text-stone-200 font-mono font-bold outline-none placeholder:text-stone-800 disabled:opacity-40"
        />

        <button
          type="submit"
          disabled={!value.trim() || isSubmitting}
          className="shrink-0 border border-stone-800 bg-stone-900/20 px-4 py-2 text-[10px] tracking-widest text-stone-400 font-bold uppercase transition hover:border-amber-900 hover:bg-amber-950/10 hover:text-amber-500 disabled:cursor-not-allowed disabled:opacity-20 rounded-xs"
        >
          {isSubmitting
            ? resolveText(t, "puzzle.common.submitting", "...")
            : submitLabel}
        </button>
      </div>
    </form>
  );
}
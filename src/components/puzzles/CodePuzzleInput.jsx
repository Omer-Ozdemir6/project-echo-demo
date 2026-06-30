import { useMemo, useState, useEffect, useRef } from "react";

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
    return resolveText(t, hint.textKey, hint.text || `REKUPERE İPUCU ${index + 1}`);
  }
  return `REKUPERE İPUCU ${index + 1}`;
}

function buildPanelLines(puzzle, t) {
  const accessLevel = resolveText(
    t,
    puzzle?.accessLevelKey,
    puzzle?.accessLevel || "TELSİZ REZONANS HATTI"
  );

  const panelStatus = resolveText(
    t,
    puzzle?.panelStatusKey,
    puzzle?.panelStatus || "KİLİTLİ / MÜHÜRLÜ"
  );

  const expectedFormat = resolveText(
    t,
    puzzle?.expectedFormatKey,
    puzzle?.expectedFormat || ""
  );

  const lines = [
    `${resolveText(t, "puzzle.code.accessLevel", "[ERİŞİM KADEMESİ]")} ${accessLevel}`,
    `${resolveText(t, "puzzle.code.panelStatus", "[MÜHÜR DURUMU]")} ${panelStatus}`
  ];

  if (expectedFormat) {
    lines.push(
      `${resolveText(t, "puzzle.code.expectedFormat", "[BEKLENEN FREKANS]")} ${expectedFormat}`
    );
  }

  lines.push(resolveText(t, "puzzle.code.statusInputRequired", "[SİNYAL MODU] MANUEL DALGA GİRİŞİ BEKLENİYOR"));

  return lines;
}

export default function CodePuzzleInput({ puzzle, attempts = 0, onSubmit, t }) {
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visibleHints, setVisibleHints] = useState(0);
  const [verifyStep, setVerifyStep] = useState(null);

  const timeoutsRef = useRef([]);

  const maxLength = puzzle?.maxLength || undefined;
  const inputMode = puzzle?.inputMode || "text";
  const hints = Array.isArray(puzzle?.hints) ? puzzle.hints : [];
  const visibleHintList = hints.slice(0, visibleHints);
  const canRevealHint = visibleHints < hints.length && !isSubmitting;

  const panelLines = useMemo(() => buildPanelLines(puzzle, t), [puzzle, t]);

  useEffect(() => {
    setValue("");
    setIsSubmitting(false);
    setVisibleHints(0);
    setVerifyStep(null);

    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, [puzzle?.id, puzzle?.titleKey]);

  const title = resolveText(t, puzzle?.titleKey, puzzle?.title || "[SAHA REZONANS PANELİ]");
  const description = resolveText(t, puzzle?.descriptionKey, puzzle?.description || "");
  const prompt = resolveText(t, puzzle?.promptKey, puzzle?.prompt || "AKUSTİK FREKANS GİRİŞİ GEREKLİ");
  const placeholder = resolveText(t, puzzle?.placeholderKey, puzzle?.placeholder || "");
  const submitLabel = resolveText(t, puzzle?.submitLabelKey, puzzle?.submitLabel || "SİNYALİ AKTAR");

  function revealHint() {
    if (!canRevealHint) return;
    setVisibleHints((prev) => prev + 1);
  }

  function handleChange(e) {
    const rawValue = e.target.value;
    if (puzzle?.uppercaseInput ?? true) {
      setValue(rawValue.toLocaleUpperCase("tr-TR"));
      return;
    }
    setValue(rawValue);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const normalizedValue = value.trim();
    if (!normalizedValue || isSubmitting) return;

    setIsSubmitting(true);
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    setVerifyStep(resolveText(t, "puzzle.code.validatingInput", "AKUSTİK YANKI DOĞRULANIYOR..."));

    const t1 = setTimeout(() => {
      setVerifyStep(resolveText(t, "puzzle.code.checkingAccessTable", "KADİM KATMAN VERİSİ SORGULANIYOR..."));
    }, 500);

    const t2 = setTimeout(() => {
      setVerifyStep(resolveText(t, "puzzle.code.sendingRemoteCommand", "SİSMİK DALGA FREKANSI AKTARILIYOR..."));
    }, 1000);

    const t3 = setTimeout(() => {
      onSubmit(normalizedValue);
      setValue("");
      setVerifyStep(null);
      setIsSubmitting(false);
    }, 1500);

    timeoutsRef.current = [t1, t2, t3];
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`relative mt-4 border p-5 font-mono rounded-xs select-none overflow-hidden transition-all duration-300 bg-gradient-to-b from-neutral-950 to-stone-950 shadow-[0_0_40px_rgba(0,0,0,0.95)] ${
        attempts > 0 
          ? "border-rose-950/60 shadow-[inset_0_0_30px_rgba(244,63,94,0.02)]" 
          : "border-stone-900/80 shadow-[inset_0_0_25px_rgba(217,119,6,0.02)]"
      }`}
    >
      {/* KÖŞE TAŞ KESİM BRAKETLERİ (STRÜKTÜREL TUTARLILIK) */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-stone-800" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-stone-800" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-stone-800" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-stone-800" />

      {/* ANALOG DONANIM PANELİ ÜST BAŞLIĞI */}
      <div className="flex justify-between items-center border-b border-stone-900 pb-3 mb-4 gap-4">
        <div>
          <p className="m-0 text-[8px] tracking-[0.2em] text-stone-600 font-black uppercase flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
            {resolveText(t, "puzzle.code.remoteInputRequired", "AKUSTİK TELSİZ TELEMETRİSİ")}
          </p>
          <h3 className="mt-1 text-xs tracking-[0.15em] font-bold text-amber-600 uppercase m-0">
            {title}
          </h3>
        </div>

        {/* RETRO SAHA ALICISI ANALOG LED GÖSTERGELERİ */}
        <div className="flex items-center gap-3 bg-black/50 px-2.5 py-1.5 border border-stone-900/60 rounded-xs shrink-0 select-none">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[6px] text-stone-600 font-black tracking-widest">PWR</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600/80 shadow-[0_0_4px_rgba(16,185,129,0.3)]" />
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[6px] text-stone-600 font-black tracking-widest">RESO</span>
            <span className={`w-1.5 h-1.5 rounded-full ${isSubmitting ? 'bg-amber-600 animate-ping' : 'bg-amber-600/70 shadow-[0_0_4px_rgba(217,119,6,0.3)]'}`} />
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[6px] text-stone-600 font-black tracking-widest">SEAL</span>
            <span className={`w-1.5 h-1.5 rounded-full ${attempts > 0 ? 'bg-rose-700 animate-pulse shadow-[0_0_5px_#be123c]' : 'bg-stone-800'}`} />
          </div>
        </div>
      </div>

      {/* LORE / SAHA NOTU AÇIKLAMASI */}
      {description && (
        <p className="mb-4 text-[11px] leading-relaxed text-stone-500 text-justify select-text selection:bg-amber-950/40 selection:text-amber-300 border-l border-stone-900/60 pl-2.5 m-0">
          {description}
        </p>
      )}

      {/* TELSİZ SİNYAL VE FREKANS AKIŞ PANELİ */}
      <div className="mb-4 border border-stone-950 bg-black p-3 rounded-xs shadow-[inset_0_0_15px_rgba(0,0,0,0.95)] relative">
        <div className="absolute right-3 top-2.5 text-[7px] font-black text-stone-700 tracking-widest hidden sm:inline">
          REZONANS_AKISI // v2.0.26
        </div>
        {panelLines.map((line, idx) => (
          <p
            key={`line-${idx}`}
            className="m-0 mb-1.5 text-[11px] tracking-wide text-stone-400 font-bold last:mb-0 flex items-start"
          >
            <span className="text-amber-700/50 font-black mr-2 select-none">&gt;</span>
            <span className="flex-1 text-stone-400">{line}</span>
          </p>
        ))}
      </div>

      {/* REKUPERE EDİLEN İPUÇLARI PANELİ */}
      {visibleHintList.length > 0 && (
        <div className="mb-4 border border-amber-950/20 bg-amber-950/[0.01] p-3 rounded-xs space-y-1.5 animate-[fadeIn_0.2s_both] shadow-inner">
          {visibleHintList.map((hint, index) => (
            <p
              key={`hint-${index}`}
              className="m-0 text-[11px] tracking-wide text-amber-600 font-bold select-text flex items-start"
            >
              <span className="text-amber-900/50 mr-2 font-black select-none">// [{index + 1}]</span>
              <span className="text-amber-500/90 drop-shadow-[0_0_4px_rgba(217,119,6,0.08)]">
                {resolveHintText(hint, index, t)}
              </span>
            </p>
          ))}
        </div>
      )}

      {/* TELSİZDEN İPUCU TALEP ETME BUTONU */}
      {hints.length > 0 && (
        <button
          type="button"
          disabled={!canRevealHint}
          onClick={revealHint}
          className="mb-4 w-full border border-stone-900 bg-stone-950/40 px-3 py-2 text-[9px] tracking-[0.18em] text-stone-500 font-black uppercase transition hover:border-amber-900/50 hover:bg-amber-950/[0.02] hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-10 rounded-xs outline-none"
        >
          {visibleHints >= hints.length
            ? `[${hints.length}/${hints.length}] ` + resolveText(t, "puzzle.code.noMoreHints", "EK İPUCU MEVCUT DEĞİL")
            : `[${visibleHints}/${hints.length}] ` + resolveText(t, "puzzle.code.requestHint", "TELSİZDEN İPUCU TALEP ET")}
        </button>
      )}

      {/* DOĞRULAMA SÜRECİ VE FREKANS ANALİZ LOGU */}
      {verifyStep && (
        <div className="mb-4 border border-amber-950 bg-black p-3 text-[11px] tracking-widest text-amber-500 font-black rounded-xs shadow-md flex items-center gap-2 relative">
          <span className="inline-block w-1.5 h-1.5 bg-amber-600 rounded-2xs animate-ping" />
          <span className="animate-pulse">{verifyStep}</span>
          <span className="animate-[pulse_0.6s_infinite] ml-auto font-black text-stone-800">_</span>
        </div>
      )}

      {/* GİRİŞ PANELİ İNDİKATÖRÜ VE KAZI DENEME SAYACI */}
      <div className="mb-3 flex justify-between items-center border border-stone-950 bg-stone-950/20 px-3 py-2.5 rounded-xs">
        <span className="text-[9px] tracking-wider text-stone-500 font-black uppercase">
          {prompt}
        </span>
        {attempts > 0 && (
          <span className="text-[8px] tracking-[0.15em] text-rose-500 font-black uppercase bg-rose-950/20 border border-rose-900/40 px-2 py-0.5 rounded-2xs animate-pulse">
            {resolveText(t, "puzzle.common.attempts", "KAZI_DENEME")}: {attempts}
          </span>
        )}
      </div>

      {/* SİSMİK SİNYAL GÜCÜ METRESİ */}
      <div className="mb-2 flex items-center justify-between text-[8px] font-black tracking-widest text-stone-700 px-1 select-none">
        <span>SİSMİK_SİNYAL_GÜCÜ:</span>
        <span className="font-mono text-stone-600 tracking-normal">
          {isSubmitting ? "[||||||||||||||||]" : attempts > 2 ? "[||||||......]" : "[||||||||||||...]"}
        </span>
      </div>

      {/* KOMUT SATIRI GİRİŞ KUTUSU VE AKSİYON BUTONU */}
      <div className="flex items-center gap-2 border border-stone-950 bg-black p-2 rounded-xs focus-within:border-amber-950/50 transition-all shadow-[inset_0_0_10px_rgba(0,0,0,0.85)]">
        <span className="shrink-0 text-stone-700 font-black ml-1 select-none animate-[pulse_1s_infinite]">&gt;</span>

        <div className="relative flex-1 min-w-0 flex items-center">
          <input
            autoFocus
            value={value}
            maxLength={maxLength}
            inputMode={inputMode}
            placeholder={placeholder}
            disabled={isSubmitting}
            onChange={handleChange}
            className="w-full bg-transparent px-1.5 py-1 text-xs tracking-widest text-stone-300 font-bold outline-none placeholder:text-stone-800 disabled:opacity-40 uppercase"
          />
          
          {!value && !isSubmitting && (
            <span className="absolute left-3 text-xs font-bold text-stone-800 animate-[pulse_0.8s_infinite] pointer-events-none">_</span>
          )}
        </div>

        {/* Karakter Sayaç Hücresi */}
        {maxLength && !isSubmitting && (
          <span className="text-[8px] text-stone-600 font-black tracking-wider px-1.5 py-0.5 bg-neutral-950 rounded-2xs border border-stone-900/60 select-none">
            {value.length}/{maxLength}
          </span>
        )}

        {/* Hızlı Temizleme Düğmesi */}
        {value && !isSubmitting && (
          <button
            type="button"
            onClick={() => setValue("")}
            className="text-[9px] font-black px-1.5 text-stone-700 hover:text-rose-700 transition-colors duration-150 outline-none"
            title="Temizle"
          >
            ✕
          </button>
        )}

        <button
          type="submit"
          disabled={!value.trim() || isSubmitting}
          className="shrink-0 border border-stone-900 bg-stone-900/30 px-4 py-2 text-[10px] tracking-widest text-stone-500 font-black uppercase transition-all duration-200 hover:border-amber-900/60 hover:bg-amber-950/10 hover:text-amber-500 disabled:cursor-not-allowed disabled:opacity-10 rounded-2xs outline-none"
        >
          {isSubmitting
            ? resolveText(t, "puzzle.common.submitting", "...")
            : submitLabel}
        </button>
      </div>
    </form>
  );
}
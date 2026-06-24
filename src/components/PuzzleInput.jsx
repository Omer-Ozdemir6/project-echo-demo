import { useState, useMemo } from "react";

function getPuzzleTheme(puzzleType) {
  // 1 — Deşifre ve Yazıt Çözme Teması (Yoğun Kehribar)
  if (puzzleType === "decrypt" || puzzleType === "inscription") {
    return {
      kicker: "DEŞİFRE MODÜLÜ AKTİF",
      border: "border-amber-900/50",
      glow: "shadow-[0_0_24px_rgba(245,158,11,0.04)]",
      title: "text-amber-500",
      accent: "text-amber-600/70",
      button: "border-amber-900 text-amber-500 hover:bg-amber-950/10"
    };
  }

  // 2 — Eko Haritası ve Sismik Navigasyon Teması (Pas Kırmızısı Hatlar)
  if (puzzleType === "echo_map" || puzzleType === "echo_isolation") {
    return {
      kicker: "SİSMİK REZONANS ANALİZİ",
      border: "border-rose-950/40",
      glow: "shadow-[0_0_24px_rgba(220,38,38,0.02)]",
      title: "text-rose-600",
      accent: "text-rose-700/60",
      button: "border-rose-950 text-rose-500 hover:bg-rose-950/10"
    };
  }

  // 3 — Standart Mekanik Kilit Girişi (Taş Rengi)
  return {
    kicker: "UZAKTAN VERİ GİRİŞİ",
    border: "border-stone-800",
    glow: "shadow-[0_0_24px_rgba(120,113,108,0.02)]",
    title: "text-stone-300",
    accent: "text-stone-500",
    button: "border-stone-800 text-stone-300 hover:bg-stone-900/40"
  };
}

function buildDecryptLines(puzzle) {
  const seed = puzzle?.seed || "KATMAN_KODU";
  const target = puzzle?.targetFrequency || "417.2";

  return [
    `[KAYNAK] ${seed}`,
    "[PACKET] PARÇALANMIŞ SİNYAL",
    "[KRİPTO] SİSMİK REZONANS MASKESİ",
    `[HEDEF FREKANS] ${target} MHz`,
    "[DURUM] VERİ GİRİŞİ BEKLENİYOR"
  ];
}

export default function PuzzleInput({ puzzle, attempts = 0, onSubmit, hideHeader = false }) {
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const puzzleType = puzzle?.type || "code";
  const theme = getPuzzleTheme(puzzleType);

  const maxLength = puzzle?.maxLength || undefined;
  const inputMode = puzzle?.inputMode || "text";
  const placeholder = puzzle?.placeholder || "Kodu giriniz...";
  const submitLabel = puzzle?.submitLabel || "SİNYALİ_GÖNDER";

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
        "mt-4 bg-neutral-950 p-4 border rounded-xs",
        theme.border,
        theme.glow
      ].join(" ")}
    >
      {/* HEADER ALANI: Eğer üst sarmalayıcı modül (Örn: Vibration) kendi başlığını çiziyorsa burası gizlenir */}
      {!hideHeader && (
        <div
          className={[
            "mb-3 flex items-start justify-between gap-4 border-b pb-3",
            puzzleType === "decrypt" || puzzleType === "inscription"
              ? "border-amber-950/40"
              : "border-stone-900"
          ].join(" ")}
        >
          <div>
            <p className={["m-0 text-[9px] tracking-[0.25em] font-bold uppercase", theme.accent].join(" ")}>
              {puzzle?.kicker || theme.kicker}
            </p>

            <h3 className={["mt-1 text-xs tracking-[0.2em] font-bold uppercase", theme.title].join(" ")}>
              {puzzle?.title || "[MÜHÜR KONTROL PANELİ]"}
            </h3>
          </div>

          {attempts > 0 && (
            <span className="shrink-0 text-[9px] tracking-[0.15em] text-rose-500 font-bold uppercase">
              DENEME: {attempts}
            </span>
          )}
        </div>
      )}

      {/* AÇIKLAMA KATMANI */}
      {!hideHeader && puzzle?.description && (
        <p className="mb-3 text-[11px] leading-5 text-stone-500 font-mono">
          {puzzle.description}
        </p>
      )}

      {/* DEŞİFRE AKIŞ SATIRLARI */}
      {puzzleType === "decrypt" && (
        <div className="mb-3 border border-amber-950/20 bg-black/40 p-3 rounded-xs">
          {decryptLines.map((line) => (
            <p
              key={line}
              className="m-0 mb-1 last:mb-0 text-[11px] tracking-[0.12em] text-amber-600/80 font-mono font-bold"
            >
              &gt; {line}
            </p>
          ))}
        </div>
      )}

      {/* ANLIK PROMPT METNİ */}
      <div className="mb-3 border border-stone-900 bg-stone-950/50 p-3 text-xs leading-5 tracking-[0.1em] text-stone-300 font-bold rounded-xs">
        {puzzle?.prompt || "MANUEL REZONANS GİRİŞİ GEREKLİ"}
      </div>

      {/* INPUT VE AKSİYON BUTONU */}
      <div className="flex items-center gap-2 border border-stone-900 bg-black p-2 rounded-xs">
        <span className="shrink-0 text-stone-600 font-mono font-bold select-none ml-1">&gt;</span>

        <input
          autoFocus
          value={value}
          maxLength={maxLength}
          inputMode={inputMode}
          placeholder={placeholder}
          disabled={isSubmitting}
          onChange={(e) => setValue(e.target.value)}
          className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm tracking-[0.15em] text-stone-200 font-mono outline-none placeholder:text-stone-700 disabled:opacity-40"
        />

        <button
          type="submit"
          disabled={!value.trim() || isSubmitting}
          className={[
            "shrink-0 border px-4 py-2 text-[10px] tracking-[0.15em] font-bold uppercase transition rounded-xs",
            "disabled:cursor-not-allowed disabled:opacity-20",
            theme.button
          ].join(" ")}
        >
          {isSubmitting ? "..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
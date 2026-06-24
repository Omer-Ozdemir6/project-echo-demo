import { useState } from "react";

export default function InscriptionPuzzleInput({ puzzle, attempts = 0, onSubmit, t }) {
  const [inputValue, setInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("ÇEVİRİ_BEKLENİYOR");
  const [feedbackColor, setFeedbackColor] = useState("text-stone-600");

  // Örnek data yapısı: Eğer veri düğümden (node) eksik gelirse atmosferik fallbackler
  const glyphsToDecode = puzzle?.glyphsToDecode || ["🔺", "🔶"];
  const lexicon = puzzle?.lexicon || [
    { glyph: "🔺", meaning: "IŞIK" },
    { glyph: "🔶", meaning: "TEHLİKE" },
    { glyph: "🜁", meaning: "KORUNMA" },
    { glyph: "🜃", meaning: "DERİNLİK" }
  ];
  
  const placeholder = puzzle?.placeholder || "Çeviriyi giriniz (Örn: IŞIK TEHLİKE)...";

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const normalized = inputValue.trim().toUpperCase();

    if (!normalized || isSubmitting) return;

    setIsSubmitting(true);

    // Düğüm motorundaki kabul edilen cevaplarla (acceptedAnswers) eşleştirme
    // Örn: "IŞIK TEHLİKE" veya "ISIK TEHLIKE"
    const isCorrect = puzzle?.acceptedAnswers?.some(
      (ans) => ans.trim().toUpperCase() === normalized
    );

    if (isCorrect) {
      setFeedback("✓ YAZIT_DEŞİFRE_EDİLDİ");
      setFeedbackColor("text-amber-500 font-black drop-shadow-[0_0_8px_#f59e0b]");
      setTimeout(() => {
        onSubmit(normalized);
        setIsSubmitting(false);
      }, 800);
    } else {
      setFeedback("⚡ HATALI_ANLAMSAL_EŞLEŞME");
      setFeedbackColor("text-rose-600 font-bold animate-pulse");
      setTimeout(() => {
        onSubmit(normalized); // Yanlış cevabı da motora gönderir, motor attempts sayısını artırır
        setIsSubmitting(false);
      }, 800);
    }
  };

  return (
    <div className="border border-stone-900 bg-neutral-950 p-5 rounded-xs space-y-5 font-mono max-w-md mx-auto animate-[fadeIn_0.3s_both] select-none">
      
      {/* ÜST BİLGİ ALANI */}
      <div className="border-b border-stone-900 pb-3 flex items-start justify-between">
        <div>
          <span className="text-[8px] tracking-[0.25em] text-stone-600 font-black uppercase block">
            DİZİN // ANLAMSAL ARKEOLOJİ
          </span>
          <h3 className="text-xs tracking-[0.18em] text-amber-500 font-bold uppercase mt-1">
            {puzzle?.title || "ANTİK YAZIT DEŞİFRESİ"}
          </h3>
        </div>
        <div className="text-right text-[9px] text-stone-600 font-bold">
          DÖNGÜ_DENEME: {attempts}
        </div>
      </div>

      {/* BULMACA LORE AÇIKLAMASI */}
      {puzzle?.description && (
        <p className="text-[11px] leading-relaxed text-stone-500 text-justify m-0">
          {puzzle.description}
        </p>
      )}

      {/* SOL PANEL: TABLETTEKİ GİZEMLİ GLİFLER */}
      <div className="border border-stone-900 bg-black p-4 text-center rounded-xs">
        <span className="text-[8px] tracking-widest text-stone-600 uppercase font-black block mb-2">
          TABLET ÜZERİNDEKİ SIRA
        </span>
        <div className="flex justify-center gap-4 py-2 text-2xl filter drop-shadow-[0_0_8px_rgba(245,158,11,0.2)] animate-pulse">
          {glyphsToDecode.map((glyph, index) => (
            <span key={`g-${index}`} className="select-none bg-stone-900/40 px-3 py-1.5 border border-stone-900 rounded-xs">
              {glyph}
            </span>
          ))}
        </div>
      </div>

      {/* SAĞ PANEL: REFERANS SÖZLÜK (MANTIK YÜRÜTME ALANI) */}
      <div className="border border-stone-900 bg-stone-950/50 p-3 rounded-xs space-y-2">
        <span className="text-[8px] tracking-widest text-stone-600 font-black uppercase block border-b border-stone-900/60 pb-1.5 mb-2">
          REKUPERE EDİLEN SÖZLÜK PARÇALARI
        </span>
        <div className="grid grid-cols-2 gap-2 text-[10px] font-bold tracking-wider font-mono">
          {lexicon.map((item, idx) => (
            <div key={`lex-${idx}`} className="flex items-center gap-2 bg-black/30 p-1.5 border border-stone-900/50 rounded-xs">
              <span className="text-sm select-none">{item.glyph}</span>
              <span className="text-stone-500 font-black">=</span>
              <span className="text-stone-400 uppercase">{item.meaning}</span>
            </div>
          ))}
        </div>
      </div>

      {/* GİRİŞ ALANI VE FORM SİSTEMİ */}
      <form onSubmit={handleFormSubmit} className="space-y-3">
        <div className="mb-1 border border-stone-900 bg-stone-950/40 p-2.5 text-[10px] font-bold tracking-widest text-stone-500 uppercase rounded-xs">
          {puzzle?.prompt || "KOMBİNASYONUN ANLAMINI GİRİN:"}
        </div>

        <div className="flex items-center gap-2 border border-stone-900 bg-black p-2 rounded-xs">
          <span className="shrink-0 text-stone-600 font-mono font-bold ml-1 select-none">&gt;</span>
          <input
            autoFocus
            type="text"
            value={inputValue}
            disabled={isSubmitting}
            placeholder={placeholder}
            onChange={(e) => setInputValue(e.target.value)}
            className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-xs tracking-widest text-stone-200 font-mono font-bold uppercase outline-none placeholder:text-stone-800 disabled:opacity-40"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isSubmitting}
            className="shrink-0 border border-stone-800 bg-stone-900/20 px-4 py-2 text-[10px] tracking-widest text-stone-400 font-bold uppercase transition hover:border-amber-900 hover:bg-amber-950/10 hover:text-amber-500 disabled:opacity-20 disabled:cursor-not-allowed rounded-xs"
          >
            {isSubmitting ? "..." : "ÇÖZ"}
          </button>
        </div>
      </form>

      {/* GERİ BİLDİRİM PANELİ */}
      <div className="border border-stone-900 bg-black/60 p-2.5 rounded-xs text-center h-9 flex items-center justify-center">
        <span className={`text-[9px] tracking-widest uppercase ${feedbackColor}`}>
          {feedback}
        </span>
      </div>

    </div>
  );
}
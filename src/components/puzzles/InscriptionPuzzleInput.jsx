import { useState, useEffect, useRef } from "react";

export default function InscriptionPuzzleInput({ puzzle, attempts = 0, onSubmit, t }) {
  const [inputValue, setInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("ÇEVİRİ_BEKLENİYOR");
  const [feedbackColor, setFeedbackColor] = useState("text-stone-600 font-bold");
  
  const timeoutRef = useRef(null);

  // Fallback / Lore verileri
  const glyphsToDecode = puzzle?.glyphsToDecode || ["🔺", "🔶"];
  const lexicon = puzzle?.lexicon || [
    { glyph: "🔺", meaning: "IŞIK" },
    { glyph: "🔶", meaning: "TEHLİKE" },
    { glyph: "🜁", meaning: "KORUNMA" },
    { glyph: "🜃", meaning: "DERİNLİK" }
  ];
  
  const placeholder = puzzle?.placeholder || "Çeviriyi giriniz (Örn: IŞIK TEHLİKE)...";

  // Bulmaca veya Konum değiştiğinde panel hafızasını temizle
  useEffect(() => {
    setInputValue("");
    setFeedback("ÇEVİRİ_BEKLENİYOR");
    setFeedbackColor("text-stone-600 font-bold");
    
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [puzzle?.id, puzzle?.title]);

  // Türkçe karakter duyarlı, esnek metin eşleştirme fonksiyonu
  const normalizeText = (str) => {
    if (!str) return "";
    return str
      .trim()
      .toLocaleUpperCase("tr-TR")
      .replace(/İ/g, "I")
      .replace(/Ş/g, "S")
      .replace(/Ç/g, "C")
      .replace(/Ğ/g, "G")
      .replace(/Ö/g, "O")
      .replace(/Ü/g, "U");
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const playerAnswerClean = normalizeText(inputValue);

    const isCorrect = puzzle?.acceptedAnswers?.some(
      (ans) => normalizeText(ans) === playerAnswerClean
    );

    if (isCorrect) {
      setFeedback("✓ KADİM_YAZIT_ÇÖZÜLDÜ");
      setFeedbackColor("text-amber-500 font-black drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]");
      
      timeoutRef.current = setTimeout(() => {
        onSubmit(inputValue.trim().toUpperCase());
        setIsSubmitting(false);
      }, 800);
    } else {
      setFeedback("⚠ REZONANS_UYUŞMAZLIĞI");
      setFeedbackColor("text-rose-700 font-black animate-pulse");
      
      timeoutRef.current = setTimeout(() => {
        onSubmit(inputValue.trim().toUpperCase());
        setIsSubmitting(false);
      }, 800);
    }
  };

  // Sözlük parçasına tıklandığında kelimeyi otomatik input'a ekleme fonksiyonu
  const handleLexiconClick = (meaning) => {
    if (isSubmitting) return;
    setInputValue((prev) => {
      const current = prev.trim();
      return current ? `${current} ${meaning}` : meaning;
    });
  };

  return (
    <div className="relative border border-stone-900/80 bg-gradient-to-b from-stone-950 to-neutral-950 p-5 rounded-xs space-y-5 font-mono max-w-md mx-auto animate-[fadeIn_0.3s_both] select-none shadow-[0_0_50px_rgba(0,0,0,0.95)]">
      
      {/* ANA PANEL KÖŞE TAŞ KESİM DETAYLARI */}
      <div className="absolute -top-0.5 -left-0.5 h-2.5 w-2.5 border-t-2 border-l-2 border-stone-800 bg-transparent" />
      <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 border-t-2 border-r-2 border-stone-800 bg-transparent" />
      <div className="absolute -bottom-0.5 -left-0.5 h-2.5 w-2.5 border-b-2 border-l-2 border-stone-800 bg-transparent" />
      <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 border-b-2 border-r-2 border-stone-800 bg-transparent" />

      {/* ÜST EKİPMAN BİLGİ ŞERİDİ */}
      <div className="border-b border-stone-900 pb-3 flex items-start justify-between">
        <div>
          <span className="text-[8px] tracking-[0.2em] text-stone-600 font-black uppercase block">
            EKİPMAN // YAZIT ANALİZÖRÜ
          </span>
          <h3 className="text-xs tracking-[0.15em] text-amber-600 font-bold uppercase mt-1 m-0">
            {puzzle?.title || "ANTİK KATMAN DEŞİFRESİ"}
          </h3>
        </div>
        <div className="text-right text-[8px] tracking-wider text-stone-500 font-black bg-stone-900/40 px-2 py-0.5 border border-stone-900/60 rounded-2xs">
          KAZI_DENEME: {attempts}
        </div>
      </div>

      {/* BULMACA LORE AÇIKLAMASI */}
      {puzzle?.description && (
        <p className="text-[11px] leading-relaxed text-stone-500 text-justify m-0 select-text selection:bg-amber-950/40 selection:text-amber-300">
          {puzzle.description}
        </p>
      )}

      {/* ANTİK TABLET GÖRÜNÜM HÜCRESİ */}
      <div className="relative border border-stone-950 bg-black p-4 text-center rounded-xs shadow-[inset_0_0_15px_rgba(0,0,0,0.95)]">
        {/* Tablet Köşe Çatlak Detayları */}
        <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-stone-900" />
        <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-stone-900" />
        
        <span className="text-[7px] tracking-[0.25em] text-stone-600 uppercase font-black block mb-2.5">
          TABLET ÜZERİNDEKİ SIRA
        </span>
        
        <div className="flex justify-center gap-4 py-1.5 text-2xl filter drop-shadow-[0_0_6px_rgba(217,119,6,0.15)]">
          {glyphsToDecode.map((glyph, index) => (
            <span 
              key={`g-${index}`} 
              className="select-none bg-stone-950/80 px-3 py-1.5 border border-stone-900/70 rounded-2xs transition-transform hover:scale-105 duration-200"
            >
              {glyph}
            </span>
          ))}
        </div>
      </div>

      {/* ETKİLEŞİMLİ SÖZLÜK PANELİ */}
      <div className="border border-stone-950 bg-stone-950/30 p-3 rounded-xs space-y-2">
        <div className="flex justify-between items-center border-b border-stone-900/50 pb-2 mb-2.5">
          <span className="text-[7px] tracking-[0.18em] text-stone-600 font-black uppercase block">
            REKUPERE EDİLEN SÖZLÜK PARÇALARI
          </span>
          <span className="text-[7px] text-amber-700/60 font-black tracking-widest animate-pulse hidden sm:inline">
            [HIZLI_EKLE]
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-[10px] font-bold tracking-wider">
          {lexicon.map((item, idx) => (
            <button
              key={`lex-${idx}`}
              type="button"
              disabled={isSubmitting}
              onClick={() => handleLexiconClick(item.meaning)}
              className="flex items-center gap-2 bg-black/40 p-2 border border-stone-900/50 rounded-2xs text-left cursor-pointer hover:bg-stone-900/30 hover:border-amber-900/50 hover:text-amber-500 hover:shadow-[0_0_15px_rgba(245,158,11,0.03)] transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed group w-full outline-none focus:border-stone-800"
            >
              <span className="text-sm select-none group-hover:scale-110 transition-transform">{item.glyph}</span>
              <span className="text-stone-700 font-black select-none">=</span>
              <span className="text-stone-400 uppercase tracking-[0.12em] font-medium">{item.meaning}</span>
            </button>
          ))}
        </div>
      </div>

      {/* GİRİŞ SİSTEMİ FORM ALANI */}
      <form onSubmit={handleFormSubmit} className="space-y-3">
        <div className="border border-stone-950 bg-neutral-950/60 p-2.5 text-[8px] font-black tracking-[0.18em] text-stone-600 uppercase rounded-2xs">
          {puzzle?.prompt || "KOMBİNASYONUN ANLAMINI GİRİN:"}
        </div>

        <div className="flex items-center gap-2 border border-stone-950 bg-black p-2 rounded-xs focus-within:border-amber-950 transition-all shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]">
          <span className="shrink-0 text-stone-700 font-black ml-1 select-none">&gt;</span>
          <input
            autoFocus
            type="text"
            value={inputValue}
            disabled={isSubmitting}
            placeholder={placeholder}
            onChange={(e) => setInputValue(e.target.value)}
            className="min-w-0 flex-1 bg-transparent px-1.5 py-1 text-xs tracking-widest text-stone-300 font-bold uppercase outline-none placeholder:text-stone-800 disabled:opacity-40"
          />
          
          {inputValue && !isSubmitting && (
            <button
              type="button"
              onClick={() => setInputValue("")}
              className="text-[9px] font-black px-1.5 text-stone-800 hover:text-rose-700 transition-colors mr-1 outline-none"
              title="Temizle"
            >
              ✕
            </button>
          )}

          <button
            type="submit"
            disabled={!inputValue.trim() || isSubmitting}
            className="shrink-0 border border-stone-900 bg-stone-900/30 px-4 py-2 text-[10px] tracking-widest text-stone-500 font-black uppercase transition hover:border-amber-900/60 hover:bg-amber-950/10 hover:text-amber-500 disabled:opacity-10 disabled:cursor-not-allowed rounded-2xs outline-none"
          >
            {isSubmitting ? "..." : "ÇÖZ"}
          </button>
        </div>
      </form>

      {/* GERİ BİLDİRİM PANELİ */}
      <div className="border border-stone-950 bg-black p-2.5 rounded-2xs text-center h-9 flex items-center justify-center shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]">
        <span className={`text-[9px] tracking-[0.15em] uppercase transition-all duration-150 ${feedbackColor}`}>
          {feedback}
        </span>
      </div>

    </div>
  );
}
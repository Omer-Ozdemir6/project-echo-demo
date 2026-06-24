import { useState, useEffect, useRef } from "react";

export default function VibrationPuzzleInput({ puzzle, attempts = 0, onSubmit, t }) {
  const [targetHits, setTargetHits] = useState(puzzle?.targetHits || 4);
  const [successCount, setSuccessCount] = useState(0);
  const [failureCount, setFailureCount] = useState(0);
  
  // Dalganın pozisyonu (%0 ile %100 arası akış)
  const [wavePosition, setWavePosition] = useState(0);
  const [waveDirection, setWaveDirection] = useState(1);
  const [feedback, setFeedback] = useState("SİNYAL_BEKLENİYOR");
  const [feedbackColor, setFeedbackColor] = useState("text-stone-500");

  const requestRef = useRef();
  const lastUpdateTimeRef = useRef(Date.now());

  // Zorluk derecesine göre dalga hızı (puzzle.speedMultiplier)
  const speed = (puzzle?.speedMultiplier || 1.0) * 0.15; 
  // İsabet alanı aralığı (%45 ile %55 arası tam merkezdir)
  const TARGET_MIN = 44;
  const TARGET_MAX = 56;

  // 1. Analog Dalga Hareketi (Animation Loop)
  useEffect(() => {
    const updateWave = () => {
      const now = Date.now();
      const delta = now - lastUpdateTimeRef.current;
      lastUpdateTimeRef.current = now;

      setWavePosition((prev) => {
        let next = prev + waveDirection * speed * delta;
        
        if (next >= 100) {
          next = 100;
          setWaveDirection(-1);
        } else if (next <= 0) {
          next = 0;
          setWaveDirection(1);
        }
        return next;
      });

      requestRef.current = requestAnimationFrame(updateWave);
    };

    requestRef.current = requestAnimationFrame(updateWave);
    return () => cancelAnimationFrame(requestRef.current);
  }, [waveDirection, speed]);

  // 2. Ritim Vuruş Tetikleyicisi Kontrolü
  const handleTrigger = () => {
    const isHit = wavePosition >= TARGET_MIN && wavePosition <= TARGET_MAX;

    if (isHit) {
      const nextSuccess = successCount + 1;
      setSuccessCount(nextSuccess);
      setFeedback("✓ REZONANS_YAKALANDI");
      setFeedbackColor("text-amber-500 font-black drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]");

      // Hedef isabet sayısına ulaşıldıysa başarılı olarak bitir
      if (nextSuccess >= targetHits) {
        setTimeout(() => {
          onSubmit(puzzle?.acceptedAnswers?.[0] || true);
        }, 500);
      }
    } else {
      const nextFail = failureCount + 1;
      setFailureCount(nextFail);
      setFeedback("⚡ SİSMİK_KAYMA");
      setFeedbackColor("text-rose-600 font-bold animate-pulse");

      // Çok fazla başarısızlık sismik çöküş veya Karaltı saldırısı tetikler
      if (nextFail >= (puzzle?.maxFailures || 5)) {
        setTimeout(() => {
          onSubmit(false); // Düğüm motorunda başarısızlık hattına yönlendirir
        }, 500);
      }
    }
  };

  // Klavye Boşluk (Space) tuşu dinleyicisi
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        handleTrigger();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [wavePosition, successCount, failureCount]);

  // Görsel dalga çizgisini string olarak oluşturma (Retro görünüm için)
  const renderVisualBar = () => {
    const totalSlots = 24;
    const currentSlot = Math.round((wavePosition / 100) * (totalSlots - 1));
    const targetSlotMin = Math.round((TARGET_MIN / 100) * (totalSlots - 1));
    const targetSlotMax = Math.round((TARGET_MAX / 100) * (totalSlots - 1));

    let barStr = "";
    for (let i = 0; i < totalSlots; i++) {
      if (i === currentSlot) {
        barStr += "█"; // Hareket eden sismik dalga başlığı
      } else if (i >= targetSlotMin && i <= targetSlotMax) {
        barStr += "░"; // Hedef rezonans mühür alanı
      } else {
        barStr += "─"; // Boş rezonans hattı
      }
    }
    return barStr;
  };

  return (
    <div className="border border-stone-900 bg-neutral-950 p-5 rounded-xs space-y-6 font-mono max-w-md mx-auto animate-[fadeIn_0.3s_both]">
      
      {/* BAŞLIK ALANI */}
      <div className="border-b border-stone-900 pb-3 flex items-start justify-between">
        <div>
          <span className="text-[8px] tracking-[0.25em] text-stone-600 font-black uppercase block">
            PROSEDÜR // AKUSTİK KİLİTLEME
          </span>
          <h3 className="text-xs tracking-[0.18em] text-amber-500 font-bold uppercase mt-1">
            {puzzle?.title || "TİTREŞİM RİTMİ SAKLASI"}
          </h3>
        </div>
        <div className="text-right text-[9px] text-stone-600 font-bold">
          DÖNGÜ_DENEME: {attempts}
        </div>
      </div>

      {/* LORE AÇIKLAMASI */}
      <p className="text-[11px] leading-relaxed text-stone-500 text-justify">
        {puzzle?.description || 
          "Jones duvara sismik aralıklarla vuruyor. Sinyal dalgası mühür bölgesine kilitlendiğinde [SPACE] tuşuna basarak antik düzeneği rezonansa ulaştırın."}
      </p>

      {/* İLERLEME SAYAÇLARI */}
      <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-bold uppercase tracking-widest">
        <div className="border border-stone-900 bg-stone-950/40 p-2 rounded-xs">
          <span className="text-stone-600 block mb-1">BAĞLANTI_KİLİDİ</span>
          <span className="text-amber-500 text-sm">{successCount} / {targetHits}</span>
        </div>
        <div className="border border-stone-900 bg-stone-950/40 p-2 rounded-xs">
          <span className="text-stone-600 block mb-1">SİSMİK_PARAZİT</span>
          <span className="text-rose-600 text-sm">{failureCount} / {puzzle?.maxFailures || 5}</span>
        </div>
      </div>

      {/* REZONANS DALGA GRAFİĞİ (ANALOG GÖRÜNÜM) */}
      <div className="border border-stone-900 bg-black p-4 text-center rounded-xs relative overflow-hidden">
        <div className="text-[9px] tracking-widest text-stone-600 uppercase font-black mb-2 flex justify-between px-1">
          <span>HİZALAMA_SOL</span>
          <span className="text-amber-600/60 animate-pulse">[ MÜHÜR MERKEZİ ]</span>
          <span>HİZALAMA_SAĞ</span>
        </div>

        {/* Canlı Çizilen Grafik Şeridi */}
        <div className="text-stone-400 font-mono text-base tracking-[0.15em] py-2 bg-stone-950/50 border border-stone-900/40 rounded-xs select-none">
          {renderVisualBar()}
        </div>

        {/* Anlık Geri Bildirim Durum Metni */}
        <div className="mt-4 h-4 flex items-center justify-center">
          <span className={`text-[10px] tracking-widest uppercase ${feedbackColor}`}>
            {feedback}
          </span>
        </div>
      </div>

      {/* BUTON / PEDAL (MOBİL VE FARE DESTEĞİ İÇİN) */}
      <button
        type="button"
        onClick={handleTrigger}
        disabled={successCount >= targetHits || failureCount >= (puzzle?.maxFailures || 5)}
        className="w-full border border-stone-800 bg-stone-900/20 py-3.5 text-[10px] tracking-[0.25em] text-stone-400 font-bold uppercase transition hover:border-amber-900 hover:bg-amber-950/10 hover:text-amber-500 active:scale-[0.99] rounded-xs"
      >
        [ SİSMİK PEDALA BAS // SPACE ]
      </button>
    </div>
  );
}
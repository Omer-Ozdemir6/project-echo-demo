import { useState, useEffect } from "react";

export default function EchoMapPuzzleInput({ puzzle, attempts = 0, onSubmit, t }) {
  // Varsayılan 4x4 Sismik Harita Izgarası
  // 0: Keşfedilmemiş, 1: Taş (Dolu), 2: Geçit (Hedef/Boşluk), 3: Karaltı (Tehlike)
  const defaultGrid = [
    [1, 1, 3, 1],
    [1, 0, 1, 1],
    [1, 0, 0, 2], // (2,3) koordinatı çıkış kapısı
    [3, 1, 1, 1]
  ];

  const gridData = puzzle?.gridData || defaultGrid;
  const targetCoords = puzzle?.targetCoords || { r: 2, c: 3 }; // Geçidin olduğu yer

  // Hücrelerin durumunu tutan matris ('hidden', 'stone', 'void', 'echo')
  const [cellStates, setCellStates] = useState(() => 
    Array(gridData.length).fill(null).map(() => Array(gridData[0].length).fill("hidden"))
  );

  const [feedback, setFeedback] = useState("SİSMİK_TARAMA_HAZIR");
  const [feedbackColor, setFeedbackColor] = useState("text-stone-500");
  const [scansLeft, setScansLeft] = useState(puzzle?.maxScans || 6);

  // Hücreye Akustik Vuruş Yapma (Tarama)
  const handleCellScan = (r, c) => {
    if (cellStates[r][c] !== "hidden" || scansLeft <= 0) return;

    const cellValue = gridData[r][c];
    let newState = "stone";
    let message = "";
    let color = "";

    if (cellValue === 1) {
      newState = "stone";
      message = `[${r},${c}] -> 180ms // DOLU TAŞ (YOL KAPALI)`;
      color = "text-stone-400";
    } else if (cellValue === 0 || cellValue === 2) {
      newState = "void";
      message = `[${r},${c}] -> 820ms // AKUSTİK BOŞLUK (GEÇİT HATTI)`;
      color = "text-amber-500 font-bold";
    } else if (cellValue === 3) {
      newState = "echo";
      message = `[${r},${c}] -> PARAZİT // UYARI: KARALTI SİNYALİ!`;
      color = "text-rose-600 font-black animate-pulse";
    }

    // Matris state güncellemesi
    const updatedStates = [...cellStates];
    updatedStates[r][c] = newState;
    setCellStates(updatedStates);
    
    setFeedback(message);
    setFeedbackColor(color);
    setScansLeft((prev) => prev - 1);
  };

  // Keşfedilen Boşluğa (Geçide) Jones'u Yönlendirme (Son Karar)
  const handleNavigate = (r, c) => {
    if (cellStates[r][c] === "hidden") {
      setFeedback("ÖNCE O BÖLGEYE SES DALGASI GÖNDERMELİSİNİZ.");
      setFeedbackColor("text-rose-500");
      return;
    }

    if (r === targetCoords.r && c === targetCoords.c) {
      setFeedback("✓ GEÇİT BULUNDU! JONES GÜVENLİ BÖLGEYE İLERLİYOR.");
      setFeedbackColor("text-amber-500 font-black drop-shadow-[0_0_8px_#f59e0b]");
      setTimeout(() => {
        onSubmit(puzzle?.acceptedAnswers?.[0] || `${r},${c}`);
      }, 1000);
    } else {
      setFeedback("⚡ HATA: JONES DOLU TAŞA VEYA ÇIKMAZ DEHLİZE ÇARPTI!");
      setFeedbackColor("text-rose-600 font-bold animate-pulse");
      setTimeout(() => {
        onSubmit("WRONG_WAY"); // Yanlış yönlendirme motor tetikler
      }, 1000);
    }
  };

  return (
    <div className="border border-stone-900 bg-neutral-950 p-5 rounded-xs space-y-5 font-mono max-w-md mx-auto animate-[fadeIn_0.3s_both] select-none">
      
      {/* ÜST BİLGİ PANELİ */}
      <div className="border-b border-stone-900 pb-3 flex items-start justify-between">
        <div>
          <span className="text-[8px] tracking-[0.25em] text-stone-600 font-black uppercase block">
            RADAR // EKO NAVİGASYONU
          </span>
          <h3 className="text-xs tracking-[0.18em] text-amber-500 font-bold uppercase mt-1">
            {puzzle?.title || "SİSMİK EKO HARİTASI"}
          </h3>
        </div>
        <div className="text-right text-[9px] text-stone-600 font-bold">
          TARAMA_HAKKI: {scansLeft}
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-stone-500 text-justify m-0">
        Karanlık odaların akustik haritasını çıkarmak için hücrelere tıklayarak eko sinyali gönderin. Boşluk (Geçit) bulduğunuzda, Jones'u oraya yönlendirmek için hücrenin altındaki butona basın.
      </p>

      {/* SİSMİK IZGARA (GRID) */}
      <div className="grid grid-cols-4 gap-2 bg-black p-3 border border-stone-900 rounded-xs">
        {gridData.map((row, rIdx) =>
          row.map((_, cIdx) => {
            const state = cellStates[rIdx][cIdx];
            return (
              <div key={`${rIdx}-${cIdx}`} className="flex flex-col gap-1">
                {/* Tarama Butonu */}
                <button
                  type="button"
                  onClick={() => handleCellScan(rIdx, cIdx)}
                  disabled={scansLeft <= 0 && state === "hidden"}
                  className={[
                    "h-12 border text-[10px] font-mono flex items-center justify-center transition font-black rounded-xs",
                    state === "hidden" ? "border-stone-900 bg-stone-950 text-stone-800 hover:border-stone-700 hover:text-stone-500" :
                    state === "stone" ? "border-stone-900 bg-stone-900 text-stone-600" :
                    state === "void" ? "border-amber-900 bg-amber-950/10 text-amber-500 shadow-[inset_0_0_8px_rgba(245,158,11,0.1)]" :
                    "border-rose-950 bg-rose-950/20 text-rose-600"
                  ].join(" ")}
                >
                  {state === "hidden" ? "░" : state === "stone" ? "█" : state === "void" ? "🜃" : "☠"}
                </button>
                
                {/* Yönlendirme Tetikleyicisi */}
                <button
                  type="button"
                  onClick={() => handleNavigate(rIdx, cIdx)}
                  className="text-[7px] border border-stone-950 bg-stone-950/40 text-stone-600 hover:text-stone-400 py-0.5 rounded-2xs font-bold tracking-tighter uppercase"
                >
                  YÖNLENDİR
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* KOORDİNAT GÖSTERGE SÜSLERİ */}
      <div className="flex justify-between text-[8px] text-stone-600 font-bold uppercase tracking-widest px-1">
        <span>Semboller: ░ Taranmamış | █ Dolu Taş | 🜃 Boşluk Girdabı</span>
      </div>

      {/* GERİ BİLDİRİM EKRANI */}
      <div className="border border-stone-900 bg-black p-2.5 rounded-xs text-center h-10 flex items-center justify-center">
        <span className={`text-[10px] tracking-wide uppercase ${feedbackColor}`}>
          {feedback}
        </span>
      </div>

    </div>
  );
}
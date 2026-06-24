import { useEffect, useState } from "react";

export default function CreditsScreen({ onClose }) {
  const [started, setStarted] = useState(false);
  const [canClose, setCanClose] = useState(false);

  // 1. Yazıların kayma animasyonunun başlama zamanlayıcısı (2.5 saniye ortada bekler)
  useEffect(() => {
    const timer = setTimeout(() => {
      setStarted(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // 2. Tıklama koruması zamanlayıcısı
  useEffect(() => {
    const timer = setTimeout(() => {
      setCanClose(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // 3. Kapatma listener'ları
  useEffect(() => {
    if (!canClose) return;

    const handleClose = (e) => {
      if (e.type === "click" || e.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("click", handleClose);
    window.addEventListener("keydown", handleClose);

    return () => {
      window.removeEventListener("click", handleClose);
      window.removeEventListener("keydown", handleClose);
    };
  }, [canClose, onClose]);

  return (
    <main className="fixed inset-0 overflow-hidden bg-black text-stone-300 font-mono z-50 select-none">
      {/* Tarama Çizgileri Perdesi */}
      <div className="pointer-events-none absolute inset-0 z-50 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.01),rgba(255,255,255,0.01)_2px,transparent_2px,transparent_5px)] opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black pointer-events-none z-10" />

      {/* DIŞ KAPSAYICI: Yazıları yatayda her zaman ekranın tam ortasında (X ekseninde) sabitler */}
      <div className="absolute top-0 inset-x-0 mx-auto flex flex-col items-center max-w-4xl w-full pt-[35vh]">
        
        {/* İÇ KAPSAYICI: Zamanlayıcı dolduğunda animasyon sınıfını alır */}
        <div
          className={
            started 
              ? "w-full text-center credits-scroll-active" 
              : "w-full text-center transform translate-y-0"
          }
        >
          {/* Sığınak Kapısı Simgesi / Logo alanı */}
          <div className="mx-auto mb-16 w-12 h-12 border-2 border-dashed border-amber-900/40 rounded-full flex items-center justify-center text-amber-600/40 font-black text-xs select-none">
            🜁
          </div>

          <h1 className="mb-28 text-2xl tracking-[0.4em] font-bold text-stone-100 sm:text-3xl uppercase">
            PROJECT ECHO
          </h1>

          <div className="space-y-24 text-xs sm:text-sm tracking-wide">
            <section>
              <h2 className="mb-3 text-amber-600/80 tracking-[0.25em] text-[10px] font-black uppercase">CREATOR</h2>
              <p className="text-stone-200 font-bold">Sahip Özdemir</p>
            </section>

            <section>
              <h2 className="mb-3 text-amber-600/80 tracking-[0.25em] text-[10px] font-black uppercase">GAME DESIGN</h2>
              <p className="text-stone-200 font-bold">Sahip Özdemir</p>
            </section>

            <section>
              <h2 className="mb-3 text-amber-600/80 tracking-[0.25em] text-[10px] font-black uppercase">NARRATIVE DESIGN</h2>
              <p className="text-stone-200 font-bold">Sahip Özdemir</p>
            </section>

            <section>
              <h2 className="mb-3 text-amber-600/80 tracking-[0.25em] text-[10px] font-black uppercase">SYSTEM DESIGN</h2>
              <p className="text-stone-200 font-bold">Sahip Özdemir</p>
            </section>

            <section className="space-y-1">
              <h2 className="mb-3 text-amber-600/80 tracking-[0.25em] text-[10px] font-black uppercase">TERMINAL INTERFACE</h2>
              <p className="text-stone-400 font-mono">React</p>
              <p className="text-stone-400 font-mono">Vite</p>
              <p className="text-stone-400 font-mono">TailwindCSS</p>
            </section>

            <section>
              <h2 className="mb-3 text-amber-600/80 tracking-[0.25em] text-[10px] font-black uppercase">SPECIAL THANKS</h2>
              <p className="text-stone-400">Every player who tuned into the radio bridge.</p>
            </section>

            <section className="space-y-1">
              <h2 className="mb-3 text-amber-600/80 tracking-[0.25em] text-[10px] font-black uppercase">IN MEMORY OF</h2>
              <p className="text-stone-400 italic">The versions of ourselves</p>
              <p className="text-stone-400 italic">that never made it out of the deep layers.</p>
            </section>

            <section className="pt-28 pb-96">
              <p className="text-amber-500 tracking-[0.3em] text-[10px] font-black uppercase animate-pulse">
                // SİNYAL KESİLDİ // TRANSMISSION_END
              </p>
            </section>
          </div>
        </div>

      </div>

      {/* Geri dönüş alt uyarısı */}
      <div
        className={[
          "fixed bottom-6 left-0 w-full text-center text-[9px] tracking-[0.2em] font-black uppercase transition-opacity duration-500 z-50 text-stone-600",
          canClose ? "opacity-60" : "opacity-0 pointer-events-none"
        ].join(" ")}
      >
        KAPATMAK VE BAŞA DÖNMEK İÇİN TIKLAYIN VEYA ESC TUŞUNA BASIN
      </div>
    </main>
  );
}
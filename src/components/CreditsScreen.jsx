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

  // 2. Click koruması zamanlayıcısı
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
    <main className="fixed inset-0 overflow-hidden bg-black text-white font-mono z-50 select-none">
      <div className="absolute inset-0 bg-black" />

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
          <img
            src="/red-door-logo.jpg"
            alt="Red Door"
            className="mx-auto mb-20 w-40 opacity-95"
            draggable={false}
          />

          <h1 className="mb-28 text-3xl tracking-[0.5em] text-cyan-200 sm:text-4xl">
            PROJECT ECHO
          </h1>

          <div className="space-y-24 text-sm sm:text-base">
            <section>
              <h2 className="mb-4 text-cyan-400 tracking-[0.3em] text-xs sm:text-sm">CREATOR</h2>
              <p>Sahip Özdemir</p>
            </section>

            <section>
              <h2 className="mb-4 text-cyan-400 tracking-[0.3em] text-xs sm:text-sm">GAME DESIGN</h2>
              <p>Sahip Özdemir</p>
            </section>

            <section>
              <h2 className="mb-4 text-cyan-400 tracking-[0.3em] text-xs sm:text-sm">NARRATIVE DESIGN</h2>
              <p>Sahip Özdemir</p>
            </section>

            <section>
              <h2 className="mb-4 text-cyan-400 tracking-[0.3em] text-xs sm:text-sm">SYSTEM DESIGN</h2>
              <p>Sahip Özdemir</p>
            </section>

            <section>
              <h2 className="mb-4 text-cyan-400 tracking-[0.3em] text-xs sm:text-sm">TERMINAL INTERFACE</h2>
              <p>React</p>
              <p>Vite</p>
              <p>TailwindCSS</p>
            </section>

            <section>
              <h2 className="mb-4 text-cyan-400 tracking-[0.3em] text-xs sm:text-sm">SPECIAL THANKS</h2>
              <p>Every player who entered the link.</p>
            </section>

            <section>
              <h2 className="mb-4 text-cyan-400 tracking-[0.3em] text-xs sm:text-sm">IN MEMORY OF</h2>
              <p>The versions of ourselves</p>
              <p>that never made it out.</p>
            </section>

            <section className="pt-28 pb-96">
              <p className="text-cyan-300 tracking-[0.25em] text-xs sm:text-sm">END OF TRANSMISSION</p>
            </section>
          </div>
        </div>

      </div>

      {/* Kapatma uyarısı */}
      <div
        className={[
          "fixed bottom-6 left-0 w-full text-center text-xs tracking-[0.2em] transition-opacity duration-500 z-50",
          canClose ? "opacity-40" : "opacity-0 pointer-events-none"
        ].join(" ")}
      >
        PRESS ESC OR CLICK TO RETURN
      </div>
    </main>
  );
}
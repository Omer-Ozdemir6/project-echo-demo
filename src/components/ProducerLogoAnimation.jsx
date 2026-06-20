import { useEffect, useState } from "react";

const STYLE_ID = "pl-styles";

function injectStyles() {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;

  const el = document.createElement("style");
  el.id = STYLE_ID;
  
  el.textContent = `
    @keyframes plIn { 
      0% { opacity: 0; filter: blur(12px) brightness(0); } 
      100% { opacity: 1; filter: blur(0) brightness(1); } 
    }
    @keyframes plOut { 
      0% { opacity: 1; filter: blur(0) brightness(1); } 
      100% { opacity: 0; filter: blur(15px) brightness(0); } 
    }
    
    /* Sert ve tekinsiz yatay/dikey yırtılma efekti */
    @keyframes plShatterGlitch {
      0%, 100% { transform: translate(0, 0) scale(1); }
      10% { transform: translate(-8px, -2px) scale(1.03); clip-path: inset(20% 0 60% 0); }
      13% { transform: translate(10px, 3px) scale(0.97); clip-path: inset(55% 0 10% 0); }
      25% { transform: translate(0, 0) scale(1); clip-path: inset(0 0 0 0); }
      68% { transform: translate(-3px, 4px); clip-path: inset(85% 0 5% 0); }
      70% { transform: translate(7px, -5px) scale(1.05); filter: brightness(1.8); }
      72% { transform: translate(-12px, 2px); clip-path: inset(10% 0 75% 0); }
      75% { transform: translate(0, 0); }
    }

    @keyframes plFlicker {
      0%, 12%, 14%, 18%, 24%, 85%, 100% { opacity: 1; }
      13%, 19%, 86%, 89% { opacity: 0; } /* Sistem çökme simülasyonu ani karartılar */
      15% { opacity: 0.3; }
      25% { opacity: 0.85; }
      90% { opacity: 0.05; }
    }

    /* Senkronize RGB Split Bozulmaları */
    @keyframes plRedSplit {
      0%, 100% { clip-path: inset(0 0 100% 0); transform: translate(0, 0); }
      20% { clip-path: inset(10% 0 40% 0); transform: translate(-12px, -3px); }
      40% { clip-path: inset(60% 0 5% 0); transform: translate(9px, 4px); }
      70% { clip-path: inset(30% 0 50% 0); transform: translate(-7px, -2px); }
    }
    @keyframes plCyanSplit {
      0%, 100% { clip-path: inset(0 0 100% 0); transform: translate(0, 0); }
      18% { clip-path: inset(45% 0 15% 0); transform: translate(10px, 2px); }
      38% { clip-path: inset(5% 0 80% 0); transform: translate(-9px, -4px); }
      72% { clip-path: inset(75% 0 10% 0); transform: translate(8px, 3px); }
    }
  `;
  document.head.appendChild(el);
}

export default function ProducerLogoAnimation({ 
  src = "/red-door-logo.jpg", 
  alt = "", 
  onComplete 
}) {
  const [isReady, setIsReady] = useState(false);
  const [glitchActive, setGlitchActive] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    injectStyles();

    // İlk saniyedeki tekinsiz boşluk zamanlayıcısı
    const tStart = setTimeout(() => setIsReady(true), 400);

    // Sinematik akış süreleri
    const t1 = setTimeout(() => setGlitchActive(false), 2200);
    const t2 = setTimeout(() => setLeaving(true), 2800);
    const t3 = setTimeout(() => {
      if (onComplete) onComplete();
    }, 3500);

    return () => {
      clearTimeout(tStart);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  // Arka plan rengi her durumda tamamen saf siyah kalacak
  if (!isReady) {
    return <main className="min-h-dvh bg-black font-mono" />;
  }

  const outerAnim = leaving ? "plOut 0.6s ease-in forwards" : "plIn 0.5s ease-out forwards";
  const innerAnim = glitchActive ? "plShatterGlitch 0.5s steps(1) infinite, plFlicker 2.2s ease-out forwards" : "";

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-black font-mono select-none">
      
      {/* CRT Ekran Grid Dokusu */}
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-20 mix-blend-overlay"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, #ffffff 2px, #ffffff 4px)"
        }}
        aria-hidden="true"
      />

      {/* Ana Animasyon Gövdesi */}
      <div style={{ animation: outerAnim }} className="z-10">
        <div
          className="relative w-56 sm:w-72"
          style={{ animation: innerAnim || undefined }}
        >
          {/* RGB Split: Kırmızı Yırtılma Katmanı */}
          {glitchActive && (
            <img
              src={src}
              className="absolute inset-0 w-full object-contain pointer-events-none mix-blend-screen opacity-75"
              style={{
                filter: "sepia(1) saturate(12) hue-rotate(330deg) brightness(1.8)",
                animation: "plRedSplit 0.4s steps(1) infinite"
              }}
              draggable={false}
              aria-hidden="true"
            />
          )}

          {/* RGB Split: Camgöbeği (Cyan) Yırtılma Katmanı */}
          {glitchActive && (
            <img
              src={src}
              className="absolute inset-0 w-full object-contain pointer-events-none mix-blend-screen opacity-75"
              style={{
                filter: "sepia(1) saturate(12) hue-rotate(160deg) brightness(1.8)",
                animation: "plCyanSplit 0.4s steps(1) infinite"
              }}
              draggable={false}
              aria-hidden="true"
            />
          )}

          {/* Temel Logo Görseli */}
          <img
            src={src}
            alt={alt}
            className={`relative w-full object-contain transition-all duration-300 ${
              glitchActive ? "brightness-110 contrast-125 saturate-110" : "brightness-90 contrast-100"
            }`}
            draggable={false}
          />
        </div>
      </div>
    </main>
  );
}
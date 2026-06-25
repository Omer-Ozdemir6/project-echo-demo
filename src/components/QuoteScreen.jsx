import { useEffect, useMemo, useState } from "react";
import { getGameText } from "../i18n/gameText";

function resolveConfigText(value, language = "en") {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    return getGameText(value.textKey, value.text || "", language);
  }
  return "";
}

const SUBLIMINAL_MESSAGES = [
  "WELCOME BACK ELIAS",
  "LOOP 28",
  "MEMORY PURGE FAILED",
  "HE REMEMBERED",
  "YOU SHOULD NOT BE HERE",
  "KIRA IS STILL WAITING",
  "DO NOT TRUST HER"
];

const ScanlineOverlay = () => (
  <div className="pointer-events-none fixed inset-0 z-50 bg-[repeating-linear-gradient(to_bottom,rgba(0,0,0,0.15),rgba(0,0,0,0.15)_1px,transparent_1px,transparent_4px)] opacity-20" />
);

export default function QuoteScreen({ quote, onComplete, language = "en" }) {
  const [step, setStep] = useState("quote");
  const [lineVisible, setLineVisible] = useState([false, false, false]);
  const [authorVisible, setAuthorVisible] = useState(false);
  const [authorBlowAway, setAuthorBlowAway] = useState(false); // 🚀 Rüzgar efekti tetikleyicisi
  const [sceneOpacity, setSceneOpacity] = useState(1);
  const [flashMessage] = useState(
    () => SUBLIMINAL_MESSAGES[Math.floor(Math.random() * SUBLIMINAL_MESSAGES.length)]
  );

  const author = getGameText(quote?.authorKey, quote?.author || "", language);

  useEffect(() => {
    if (step !== "quote") return;

    setLineVisible([false, false, false]);
    setAuthorVisible(false);
    setAuthorBlowAway(false);
    setSceneOpacity(1);

    const timers = [
      // ─── EKRANA GELİŞ TEMPOSU ──────────────────────────────
      setTimeout(() => setLineVisible(([, b, c]) => [true, b, c]), 1500),
      setTimeout(() => setLineVisible(([a, , c]) => [a, true, c]), 5000),
      setTimeout(() => setLineVisible(([a, b]) => [a, b, true]), 8500),
      setTimeout(() => setAuthorVisible(true), 10000),
      
      // ─── METİNLERİN SİLİNİŞ TEMPOSU ────────────────────────────
      setTimeout(() => setLineVisible(([, b, c]) => [false, b, c]), 16000),
      setTimeout(() => setLineVisible(([a, , c]) => [a, false, c]), 19000),
      setTimeout(() => setLineVisible(([a, b]) => [a, b, false]), 22000),
      
      // 🚀 24. saniyede yazar ismine rüzgar vurur ve uçuşma başlar
      setTimeout(() => setAuthorBlowAway(true), 24000),
      
      // ─── KARARMA VE GEÇİŞ ──────────────────────────────
      setTimeout(() => setSceneOpacity(0), 26000),
      setTimeout(() => setStep("blackout"), 30000),
    ];

    return () => timers.forEach(clearTimeout);
  }, [step]);

  useEffect(() => {
    if (step !== "blackout") return;
    const t = setTimeout(() => setStep("subliminalFlash"), 5000);
    return () => clearTimeout(t);
  }, [step]);

  useEffect(() => {
    if (step !== "subliminalFlash") return;
    const t = setTimeout(() => {
      onComplete?.();
    }, 80);
    return () => clearTimeout(t);
  }, [step, onComplete]);

  if (step === "quote") {
    const lines = quote?.lines || [];
    return (
      <main
        className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-black px-8 py-16 text-amber-500/90 select-none"
        style={{
          opacity: sceneOpacity,
          transition: sceneOpacity < 1 ? "opacity 2000ms ease-in-out" : undefined,
        }}
      >
        {/* CSS Enjeksiyonu: Üfleme ve Rüzgarda Küle Dönüşerek Uçuşma Efekti */}
        <style>{`
          @keyframes windBlowAway {
            0% {
              opacity: 1;
              filter: blur(0px);
              transform: translate(0, 0) scale(1) skewX(0deg);
              mask-image: linear-gradient(to right, rgba(0,0,0,1) 100%, rgba(0,0,0,1) 100%);
              -webkit-mask-image: linear-gradient(to right, rgba(0,0,0,1) 100%, rgba(0,0,0,1) 100%);
            }
            30% {
              filter: blur(0.5px);
              /* Rüzgarın ilk vurduğu an hafifçe yukarı dalgalanma */
              transform: translate(30px, -8px) scale(0.98) skewX(-10deg);
              opacity: 0.9;
            }
            60% {
              filter: blur(2px);
              /* Sağa doğru savrulurken yerçekimsiz dağılma etkisi */
              transform: translate(120px, 4px) scale(0.92) skewX(-25deg);
              opacity: 0.5;
            }
            100% {
              opacity: 0;
              filter: blur(6px);
              /* Tamamen rüzgarda yok oluş */
              transform: translate(250px, -15px) scale(0.85) skewX(-40deg);
              
              /* Soldan sağa doğru eriyerek/silinerek gitmesini sağlayan gradyan maskesi */
              mask-image: linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%);
              -webkit-mask-image: linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%);
            }
          }

          .wind-particles {
            /* 1.8 saniye boyunca akıcı ve organik bir rüzgar ivmesi (cubic-bezier) */
            animation: windBlowAway 1800ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
            display: inline-block;
          }
        `}</style>

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.03),transparent_70%)]" />
        <ScanlineOverlay />

        <section className="relative z-10 w-full max-w-3xl space-y-12 text-center font-serif italic">
          {lines.map((line, idx) => {
            const text = resolveConfigText(line, language);
            return (
              <p
                key={idx}
                className="text-xl font-normal leading-relaxed tracking-wide sm:text-2xl md:text-3xl text-amber-500/85 drop-shadow-[0_0_15px_rgba(245,158,11,0.25)]"
                style={{
                  opacity: lineVisible[idx] ? 1 : 0,
                  transform: lineVisible[idx] ? "translateY(0)" : "translateY(14px)",
                  filter: lineVisible[idx] ? "blur(0px)" : "blur(3px)",
                  transition: "opacity 2500ms ease, transform 2500ms ease, filter 2500ms ease",
                }}
              >
                "{text}"
              </p>
            );
          })}

{author && (
            <div
              className="mt-16 text-right text-sm font-normal tracking-[0.2em] text-amber-600/60 uppercase not-italic font-mono transition-all duration-[2500ms]"
              style={{
                opacity: authorVisible ? 1 : 0,
                transform: authorVisible ? "translateX(0)" : "translateX(-10px)",
                filter: authorVisible ? "blur(0px)" : "blur(3px)",
              }}
            >
              — {author}
            </div>
          )}
        </section>
      </main>
    );
  }

  if (step === "blackout") {
    return (
      <main className="fixed inset-0 bg-black z-50 grid place-items-center select-none font-mono">
        <ScanlineOverlay />
        <span className="text-[10px] tracking-[0.6em] text-amber-700/20 animate-pulse uppercase">
          [ SEARCHING FOR INTERFACE RESPONSE... ]
        </span>
      </main>
    );
  }

  if (step === "subliminalFlash") {
    return (
      <main className="fixed inset-0 z-[99999] grid place-items-center bg-black font-mono">
        <span className="text-red-600 tracking-[0.5em] text-xl font-bold font-mono uppercase animate-ping">
          {flashMessage}
        </span>
      </main>
    );
  }

  return null;
}
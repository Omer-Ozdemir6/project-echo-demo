import { useEffect, useState } from "react";
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
  // Akış Durumları: "quote" | "blackout" | "subliminalFlash"
  const [step, setStep] = useState("quote");
  const [lineVisible, setLineVisible] = useState([false, false, false]);
  const [authorVisible, setAuthorVisible] = useState(false);
  const [sceneOpacity, setSceneOpacity] = useState(1);
  const [flashMessage] = useState(
    () => SUBLIMINAL_MESSAGES[Math.floor(Math.random() * SUBLIMINAL_MESSAGES.length)]
  );

  const author = getGameText(quote?.authorKey, quote?.author || "", language);

  // Anlatıcı metinlerinin ekranda kalma süreleri uzatıldı (Daha sinematik tempo)
  useEffect(() => {
    if (step !== "quote") return;

    setLineVisible([false, false, false]);
    const timers = [
      // Satırlar daha geniş aralıklarla ve sindirerek ekrana geliyor
      setTimeout(() => setLineVisible(([, b, c]) => [true, b, c]), 1500),
      setTimeout(() => setLineVisible(([a, , c]) => [a, true, c]), 6500),
      setTimeout(() => setLineVisible(([a, b]) => [a, b, true]), 11500),
      setTimeout(() => setAuthorVisible(true), 17000),
      
      // Yazıların ekrandan zarifçe siliniş temposu
      setTimeout(() => setLineVisible(([, b, c]) => [false, b, c]), 23000),
      setTimeout(() => setLineVisible(([a, , c]) => [a, false, c]), 27500),
      setTimeout(() => setLineVisible(([a, b]) => [a, b, false]), 32000),
      setTimeout(() => setAuthorVisible(false), 36000),
      
      // Sahnenin tamamen kararmaya başlama ve blackout anı
      setTimeout(() => setSceneOpacity(0), 39500),
      setTimeout(() => setStep("blackout"), 41500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [step]);

  // Blackout -> Subliminal Flash Geçişi
  useEffect(() => {
    if (step !== "blackout") return;
    const t = setTimeout(() => setStep("subliminalFlash"), 5000);
    return () => clearTimeout(t);
  }, [step]);

  // Subliminal Flash -> Tamamlandı ve Terminale Sızma Başladı
  useEffect(() => {
    if (step !== "subliminalFlash") return;
    const t = setTimeout(() => {
      onComplete?.();
    }, 80);
    return () => clearTimeout(t);
  }, [step, onComplete]);

  // ANLATICI SATIRLARI RENDER
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
        {/* Sıcak turuncu/kehribar tonlarında loş bir mum ışığı arka plan parlaması */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.03),transparent_70%)]" />
        <ScanlineOverlay />

        {/* 🚀 GÜNCELLEME: font-serif ve italic ile klasik el yazısı/roman estetiği */}
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
              className="mt-16 text-right text-sm font-normal tracking-[0.2em] text-amber-600/60 uppercase not-italic font-mono"
              style={{
                opacity: authorVisible ? 1 : 0,
                transform: authorVisible ? "translateX(0)" : "translateX(-10px)",
                transition: "opacity 2000ms ease, transform 2000ms ease",
              }}
            >
              — {author}
            </div>
          )}
        </section>
      </main>
    );
  }

  // BLACKOUT SAHNESİ RENDER
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

  // SUBLIMINAL FLASH SAHNESİ RENDER (80ms)
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
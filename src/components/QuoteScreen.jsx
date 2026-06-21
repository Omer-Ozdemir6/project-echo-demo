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

export default function OperatorBriefing({ quote, onComplete, language = "en" }) {
  // Akış Kademeleri: "briefing" | "loading" | "quote" | "blackout" | "subliminalFlash"
  const [step, setStep] = useState("briefing");
  const [briefingStage, setBriefingStage] = useState(0);
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [flashMessage, setFlashMessage] = useState("");

  const author = getGameText(
    quote?.authorKey,
    quote?.author || "",
    language
  );

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * SUBLIMINAL_MESSAGES.length);
    setFlashMessage(SUBLIMINAL_MESSAGES[randomIndex]);
  }, []);

  // 1. ADIM: Outlast Tarzı Brifing Giriş Zamanlayıcıları
  useEffect(() => {
    if (step !== "briefing") return;

    const timers = [
      setTimeout(() => setBriefingStage(1), 500),   // PROJECT ECHO
      setTimeout(() => setBriefingStage(2), 1500),  // // WARNING: CLASSIFIED OPERATIONAL DATA_
      setTimeout(() => setBriefingStage(3), 2500)   // İçerik metni ve buton
    ];

    return () => timers.forEach(clearTimeout);
  }, [step]);

  const handleAcceptBriefing = () => {
    if (isButtonLoading) return;
    setIsButtonLoading(true);

    setTimeout(() => {
      setIsLeaving(true);
    }, 1000);

    setTimeout(() => {
      setStep("loading");
      setIsLeaving(false);
    }, 1600);
  };

  // 2. ADIM: Ara Yükleme (Loading) Süresi
  useEffect(() => {
    if (step !== "loading") return;

    const toQuote = setTimeout(() => {
      setStep("quote");
    }, 3500);

    return () => clearTimeout(toQuote);
  }, [step]);

  // 3. ADIM: Sinematik Zaman Çizelgesi Kontrolü (GÜNCELLENDİ)
  useEffect(() => {
    if (step !== "quote") return;

    const activeTimers = [
      // Yazıların toplam varoluş süresi bittiği an (35. saniyede) blackout aşamasına geçer
      setTimeout(() => {
        setStep("blackout");
      }, 35000)
    ];

    return () => activeTimers.forEach(clearTimeout);
  }, [step]);

  // 4. ADIM: Sahte Donma Efektli Derin Sessizlik (Blackout - Tam 5 Saniye)
  useEffect(() => {
    if (step !== "blackout") return;

    const blackoutTimer = setTimeout(() => {
      setStep("subliminalFlash");
    }, 5000);

    return () => clearTimeout(blackoutTimer);
  }, [step]);

  // 5. ADIM: Subliminal Flash (80ms) ve Boot Ekranına Geçiş
  useEffect(() => {
    if (step !== "subliminalFlash") return;

    const flashTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 80);

    return () => clearTimeout(flashTimer);
  }, [step, onComplete]);

  const crtOverlay = (
    <div className="pointer-events-none fixed inset-0 z-50 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.015),rgba(255,255,255,0.015)_1px,transparent_1px,transparent_5px)] opacity-35" />
  );

  // ==================== SAHNE RENDERS ====================

  // SEYİR A: KLİNİK OPERATÖR BRİFİNGİ
  if (step === "briefing") {
    return (
      <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-black px-6 font-mono select-none text-cyan-50">
        {crtOverlay}
        <section 
          className={[
            "w-full max-w-2xl text-center",
            isLeaving
              ? "animate-[producerLogoFadeOut_1s_ease-in_forwards]"
              : "animate-[producerLogoFadeIn_1.2s_ease-out_forwards]"
          ].join(" ")}
        >
          {briefingStage >= 1 && (
            <h2 className="text-cyan-400 tracking-[0.4em] text-sm font-light">
              PROJECT ECHO
            </h2>
          )}

          {briefingStage >= 2 && (
            <div className="mt-2 text-[10px] tracking-[0.3em] text-rose-500/80 font-bold">
              // WARNING: CLASSIFIED OPERATIONAL DATA_
            </div>
          )}

          {briefingStage >= 3 && (
            <div className="mt-8 space-y-6 text-sm leading-relaxed tracking-wider text-cyan-100/80 animate-[fadeIn_0.8s_ease-out_forwards]">
              <p className="text-justify sm:text-center">
                {getGameText(
                  "brief.line1",
                  "By completing the terminal interface, you acknowledge that you are forcing a direct, unshielded neural intrusion into a severely traumatized consciousness.",
                  language
                )}
              </p>
              
              <p className="font-bold text-rose-500 tracking-[0.15em] uppercase">
                {getGameText("brief.identity", "SUBJECT CONDITION: ACUTE PSYCHOSIS // DESIGNATION: E-17", language)}
              </p>

              <div className="space-y-2 text-cyan-100/40 text-xs pt-2 text-left sm:text-center">
                <p>&gt; {getGameText("brief.rule1", "Neural feedback is volatile. Certain choices cannot be overwritten.", language)}</p>
                <p>&gt; {getGameText("brief.rule2", "Subject cell-death or severe trauma is permanent.", language)}</p>
                <p>&gt; {getGameText("brief.rule3", "In the event of localized containment failure, catastrophic ego-death is not a system error.", language)}</p>
              </div>

              <p className="pt-6 border-t border-cyan-900/30 text-rose-400/90 italic text-xs sm:text-sm">
                {getGameText(
                  "brief.twistHint",
                  "We have simulated this sequence thousands of times. We still do not know who returns when the link breaks. Elias... or whatever is using his skin?",
                  language
                )}
              </p>

              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={handleAcceptBriefing}
                  disabled={isButtonLoading}
                  className={[
                    "w-full max-w-xs border py-3.5 text-xs tracking-[0.3em] font-bold uppercase transition-all duration-300",
                    isButtonLoading
                      ? "border-amber-500/30 bg-amber-950/10 text-amber-400 animate-pulse cursor-not-allowed"
                      : "border-rose-600/40 bg-rose-950/10 text-rose-200 hover:border-rose-400 hover:bg-rose-500/10 hover:shadow-[0_0_20px_rgba(244,63,94,0.15)] active:scale-[0.98]"
                  ].join(" ")}
                >
                  {isButtonLoading 
                    ? getGameText("briefin.connecting", "OVERRIDING COGNITIVE LOCK...", language)
                    : getGameText("brief.action", "AUTHORIZE NEURAL INTRUSION", language)}
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    );
  }

  // SEYİR B: ARA BEYİN DALGASI YÜKLEME EKRANI (Daire Çizen Beyaz Noktalar Sağ Altta)
  if (step === "loading") {
    return (
      <main className="relative min-h-dvh bg-black font-mono select-none text-cyan-50/60">
        {crtOverlay}
        
        {/* Sağ alt köşede konumlandırılan beyaz spinner ve log grubu */}
        <div className="fixed bottom-8 right-8 flex items-center gap-6">
          <span className="text-[11px] tracking-widest text-cyan-50/40">
            SYNCHRONIZING_BRAINWAVES_
          </span>

          {/* Beyaz Noktalardan Oluşan Chaser Spinner */}
          <div className="relative w-7 h-7">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                style={{
                  top: `${50 + 40 * Math.sin((i * Math.PI) / 4)}%`,
                  left: `${50 + 40 * Math.cos((i * Math.PI) / 4)}%`,
                  transform: "translate(-50%, -50%)",
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: "1.2s"
                }}
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  // SEYİR C: GÜNCELLENMİŞ 40 SANİYELİK SİNEMATİK ANLATICI SAHNESİ
  if (step === "quote") {
    return (
      <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-black px-6 py-16 text-white animate-[quoteSceneFadeOut_1.4s_ease_forwards] [animation-delay:33.6s]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.06),transparent_72%)]" />
        {crtOverlay}

        <section className="relative z-10 w-full max-w-4xl">
          <div className="space-y-5">
            {(quote?.lines || []).map((line, index) => {
              const text = resolveConfigText(line, language);

              return (
                <p
                  key={`${text}-${index}`}
                  className={[
                    "opacity-0 text-xl leading-loose tracking-wide text-white/90 sm:text-3xl",
                    "animate-[quoteFadeIn_1.8s_forwards,quoteFadeOut_1.5s_forwards]",
                    index === 0 ? "[animation-delay:1s,18s]" : "",
                    index === 1 ? "[animation-delay:5s,22s]" : "",
                    index === 2 ? "[animation-delay:9s,26s]" : ""
                  ].join(" ")}
                >
                  {text}
                </p>
              );
            })}
          </div>

          <div className="mt-12 text-right text-xs tracking-[0.3em] text-white/65 opacity-0 animate-[quoteFadeIn_1.6s_forwards,quoteFadeOut_1.8s_forwards] [animation-delay:14s,30s] sm:text-sm">
            {author}
          </div>
        </section>
      </main>
    );
  }

  // SEYİR D: %5 OPACITY SAHTE DONMA / TERMİNAL ARAMA EKRANI
  if (step === "blackout") {
    return (
      <main className="fixed inset-0 bg-black z-50 grid place-items-center select-none font-mono">
        {crtOverlay}
        <div className="text-[10px] tracking-[0.5em] text-cyan-400/5 uppercase opacity-35 animate-pulse">
          [ SEARCHING FOR RESPONSE... ]
        </div>
      </main>
    );
  }

  // SEYİR E: SUBLIMINAL SHOCK FLAŞI
  if (step === "subliminalFlash") {
    return (
      <main className="fixed inset-0 z-[99999] grid place-items-center bg-black text-rose-500 font-mono tracking-[0.4em] text-base sm:text-lg font-bold select-none animate-[screenGlitch_0.05s_infinite]">
        {flashMessage}
      </main>
    );
  }

  return null;
}
import { useEffect, useState } from "react";
import { getGameText } from "../i18n/gameText";

export default function OperatorBriefing({ onComplete, language = "en" }) {
  const [stage, setStage] = useState("briefing"); // "briefing" | "loading"
  const [briefingStage, setBriefingStage] = useState(0);
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (stage !== "briefing") return;

    const timers = [
      setTimeout(() => setBriefingStage(1), 500),   // PROJECT ECHO
      setTimeout(() => setBriefingStage(2), 1500),  // // OPERATOR BRIEFING_
      setTimeout(() => setBriefingStage(3), 2500)   // İçerik metni ve buton
    ];

    return () => timers.forEach(clearTimeout);
  }, [stage]);

  const handleAcceptBriefing = () => {
    if (isButtonLoading) return;
    setIsButtonLoading(true);

    setTimeout(() => {
      setIsLeaving(true);
    }, 1000);

    setTimeout(() => {
      setStage("loading");
      setIsLeaving(false);
    }, 1600);
  };

  useEffect(() => {
    if (stage !== "loading") return;

    const toQuote = setTimeout(() => {
      if (onComplete) onComplete();
    }, 3000);

    return () => clearTimeout(toQuote);
  }, [stage, onComplete]);

  const crtOverlay = (
    <div className="pointer-events-none fixed inset-0 z-50 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.015),rgba(255,255,255,0.015)_1px,transparent_1px,transparent_5px)] opacity-35" />
  );

  if (stage === "briefing") {
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

  if (stage === "loading") {
    return (
      <main className="relative min-h-dvh bg-black font-mono select-none text-cyan-50/60">
        {crtOverlay}
        <div className="fixed bottom-8 right-8 text-[11px] tracking-widest opacity-40 flex items-center gap-2">
          <span className="inline-block animate-spin text-rose-500">⚡</span> 
          <span className="text-rose-500/80">SYNCHRONIZING_BRAINWAVES_</span>
        </div>
      </main>
    );
  }

  return null;
}
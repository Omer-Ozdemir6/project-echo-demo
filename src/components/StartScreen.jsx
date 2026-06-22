import { useEffect, useState } from "react";
import SettingsModal from "./SettingsModal";
import { getGameText } from "../i18n/gameText";
import ProducerLogoAnimation from "./ProducerLogoAnimation";

export default function StartScreen({
  gameTitle,
  subtitle,
  onStart,              
  onContinue,           
  hasSavedGame = false, 
  onOpenCredits,        
  settings,
  onChangeSettings,
  onReset
}) {
  const [introStep, setIntroStep] = useState("producerLogo");
  const [briefingStage, setBriefingStage] = useState(0);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isButtonLoading, setIsButtonLoading] = useState(false);

  const language = settings?.language || "en";

  // Yasal Uyarı Zamanlayıcısı
  useEffect(() => {
    if (introStep !== "disclaimer") return;
    const leaveTimer = setTimeout(() => setIsLeaving(true), 3600);
    const nextTimer = setTimeout(() => {
      setIntroStep("initialLoading");
      setIsLeaving(false);
    }, 4800);
    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(nextTimer);
    };
  }, [introStep]);

  // İlk Açılış Ara Yükleme Zamanlayıcısı
  useEffect(() => {
    if (introStep !== "initialLoading") return;
    const menuTimer = setTimeout(() => setIntroStep("start"), 2500);
    return () => clearTimeout(menuTimer);
  }, [introStep]);

  // Paragrafların ekrana sırayla gelme zamanlayıcıları
  useEffect(() => {
    if (introStep !== "briefing") return;
    const timers = [
      setTimeout(() => setBriefingStage(1), 500),
      setTimeout(() => setBriefingStage(2), 2500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [introStep]);

  // Brifing Sonrası Yükleme Ekranı Zamanlayıcısı
  useEffect(() => {
    if (introStep !== "loading") return;
    const t = setTimeout(() => {
      onStart?.(); 
    }, 4000);
    return () => clearTimeout(t);
  }, [introStep, onStart]);

  const handleAcceptBriefing = () => {
    if (isButtonLoading) return;
    setIsButtonLoading(true);
    setTimeout(() => setIsLeaving(true), 1000);
    setTimeout(() => {
      setIntroStep("loading");
      setIsLeaving(false);
    }, 1800);
  };

  // AŞAMA 1: Yapımcı Logosu
  if (introStep === "producerLogo") {
    return (
      <ProducerLogoAnimation
        src="/red-door-logo.jpg"
        alt="Red Door"
        onComplete={() => setIntroStep("disclaimer")}
      />
    );
  }

  // AŞAMA 2: Yasal Uyarı / Disclaimer
  if (introStep === "disclaimer") {
    return (
      <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-black px-6 select-none font-mono">
        <div
          className={[
            "max-w-4xl text-center",
            isLeaving
              ? "opacity-0 transition-opacity duration-1000"
              : "opacity-100 transition-opacity duration-1200"
          ].join(" ")}
        >
          <p className="text-lg leading-relaxed tracking-wide text-zinc-200 sm:text-xl">
            {getGameText("start.disclaimer.line1", "All characters and locations in this game are fictional.", language)}
          </p>
          <p className="mt-4 text-lg leading-relaxed tracking-wide text-zinc-200 sm:text-xl">
            {getGameText("start.disclaimer.line2", "Any resemblance to real people or places is purely coincidental.", language)}
          </p>
        </div>
      </main>
    );
  }

  // AŞAMA 3: Menü Öncesi Ara Yükleme Ekranı (Beyaz Döner Daire)
  if (introStep === "initialLoading") {
    return (
      <main className="relative min-h-dvh bg-black font-mono select-none text-zinc-600">
        <div className="fixed bottom-8 right-8 flex items-center gap-6">
          <span className="text-xs tracking-widest opacity-50">CONNECTING_</span>
          <div className="relative w-6 h-6">
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

  // AŞAMA 4: SADENİN SAFİSİ OUTLAST TİPİ BRİFİNG EKRANI (Aynen Ekran Görüntüsündeki Stil)
  if (introStep === "briefing") {
    return (
      <main className="fixed inset-0 grid place-items-center bg-black px-8 py-16 font-mono select-none text-zinc-200">
        <section
          className="w-full max-w-2xl text-center space-y-12 transition-opacity duration-1000 ease-in-out"
          style={{ opacity: isLeaving ? 0 : 1 }}
        >
          
          {/* Paragraf 1 */}
          {briefingStage >= 1 && (
            <p className="text-base leading-relaxed tracking-wide text-zinc-200/90 max-w-xl mx-auto animate-[startScreenFadeIn_1s_both]">
              Mount Massive Research Facility contains classified medical data, severe neural trauma, and highly restricted system files. Please proceed with caution.
            </p>
          )}

          {/* Paragraf 2 */}
          {briefingStage >= 2 && (
            <div className="space-y-12 animate-[startScreenFadeIn_1s_both]">
              <p className="text-base leading-relaxed tracking-wide text-zinc-200/90 max-w-xl mx-auto">
                You are executing Project Echo, a system clearance routing to authorize Deep Neural Erasure on Subject E-17. Avoid two-way cognitive links. Do not answer questions. Your only choices are to execute, overwrite, or fail.
              </p>

              {/* Ekran görüntüsündeki en altta duran sade "Continue" yapısındaki buton */}
              <div className="pt-8">
                <button
                  type="button"
                  onClick={handleAcceptBriefing}
                  disabled={isButtonLoading}
                  className={[
                    "text-sm tracking-[0.3em] uppercase transition-all duration-300 bg-transparent text-zinc-400 font-normal border-b border-transparent pb-1",
                    isButtonLoading
                      ? "opacity-30 cursor-not-allowed"
                      : "hover:text-white hover:border-white"
                  ].join(" ")}
                >
                  {isButtonLoading ? "LOADING..." : "CONTINUE"}
                </button>
              </div>
            </div>
          )}

        </section>
      </main>
    );
  }

  // AŞAMA 5: GİZLİ YÜKLEME SEKANSI (Beyaz Döner Daire)
  if (introStep === "loading") {
    return (
      <main className="fixed inset-0 flex items-center justify-center bg-black font-mono select-none text-zinc-500">
        <div className="w-full max-w-md text-left px-6 space-y-2 text-xs tracking-widest opacity-60">
          <p>DELETING DATA SEGMENTS [CYCLE 27]...</p>
          <p>RE-WRITING CORE MEMORY CELLS...</p>
          <p className="font-bold text-zinc-300">[ ALERT: UNEXPECTED RESIDUE DETECTED AT SECTOR 7 ]</p>
          <p>STABILIZING TERMINAL SECTOR...</p>
        </div>
        
        <div className="fixed bottom-8 right-8 flex items-center gap-4 text-zinc-400">
          <span className="text-[10px] tracking-wider uppercase font-bold opacity-50">LINKING_</span>
          <div className="relative w-6 h-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-[3px] h-[3px] bg-white rounded-full animate-pulse"
                style={{
                  top: `${50 + 42 * Math.sin((i * Math.PI) / 4)}%`,
                  left: `${50 + 42 * Math.cos((i * Math.PI) / 4)}%`,
                  transform: "translate(-50%,-50%)",
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

  // AŞAMA 6: ANA MENÜ GÖRÜNTÜSÜ
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-6 py-10 text-cyan-50 animate-[startScreenFadeIn_0.9s_ease-out_both] font-mono select-none">
      <img src="/echo-menu-bg.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      <div className="absolute inset-0 bg-black/40" />

      <button
        type="button"
        onClick={() => setIsSettingsOpen(true)}
        className="absolute right-5 top-5 z-20 grid h-10 w-10 place-items-center border border-cyan-300/25 bg-slate-950/45 text-cyan-100 backdrop-blur-sm transition hover:border-cyan-300/50 hover:bg-cyan-400/10"
        aria-label={getGameText("common.openSettings", "Open settings", language)}
      >
        ⚙
      </button>

      <section className="relative z-10 flex w-full max-w-xl flex-col items-center text-center">
        <div className="mb-10 text-center">
          <h1 className="text-5xl font-light tracking-[0.32em] text-cyan-100 drop-shadow-[0_0_26px_rgba(34,211,238,0.65)] sm:text-7xl">
            {gameTitle}
          </h1>
          {subtitle && <p className="mt-3 text-xs tracking-[0.4em] text-cyan-400/70 uppercase">{subtitle}</p>}
          <div className="mx-auto mt-5 h-px w-64 bg-cyan-300/40 shadow-[0_0_20px_rgba(34,211,238,0.65)]" />
        </div>

        <div className="flex w-full max-w-xs flex-col gap-3.5">
          <button
            type="button"
            disabled={!hasSavedGame}
            onClick={onContinue}
            className={[
              "w-full border bg-slate-950/40 px-8 py-3.5 text-sm tracking-[0.28em] backdrop-blur-sm transition-all duration-300",
              hasSavedGame
                ? "border-cyan-300/50 text-cyan-100 hover:border-cyan-300/85 hover:bg-cyan-400/10 hover:shadow-[0_0_30px_rgba(34,211,238,0.2)] active:scale-[0.98]"
                : "border-neutral-800 text-neutral-600 cursor-not-allowed opacity-40 bg-neutral-950/20"
            ].join(" ")}
          >
            {getGameText("start.continueLink", "CONTINUE", language)}
          </button>

          <button
            type="button"
            onClick={() => setIntroStep("briefing")}
            className="w-full border border-cyan-300/40 bg-slate-950/30 px-8 py-3.5 text-sm tracking-[0.28em] text-cyan-200/90 backdrop-blur-sm transition-all duration-300 hover:border-cyan-300/75 hover:bg-cyan-400/10 hover:text-cyan-100 hover:shadow-[0_0_25px_rgba(34,211,238,0.15)] active:scale-[0.98]"
          >
            {getGameText("start.establishLink", "NEW GAME", language)}
          </button>

          <button
            type="button"
            onClick={onOpenCredits}
            className="w-full border border-cyan-300/20 bg-slate-950/15 px-8 py-3.5 text-xs tracking-[0.28em] text-cyan-300/60 backdrop-blur-sm transition-all duration-300 hover:border-cyan-300/50 hover:bg-cyan-400/5 hover:text-cyan-200 active:scale-[0.98]"
          >
            {getGameText("start.creditsLink", "CREDITS", language)}
          </button>
        </div>
      </section>

      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onChangeSettings={onChangeSettings}
          onReset={onReset}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </main>
  );
}
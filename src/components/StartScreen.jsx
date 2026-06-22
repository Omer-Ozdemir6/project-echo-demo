import { useEffect, useState } from "react";
import SettingsModal from "./SettingsModal";
import { getGameText } from "../i18n/gameText";
import ProducerLogoAnimation from "./ProducerLogoAnimation";

// ─── CLASSIC DOS TEXT (OUTLAST RAPOR STİLİ) ──────────────────────────────────
// Karmaşık siberpunk glitche'leri yerine eski terminal ve veri bozulması etkisi
const GLITCH_POOL = "01X█▒░▄▀■";
function GlitchChar({ char, intensity = 0.05 }) {
  const [g, setG] = useState(char);
  useEffect(() => {
    if (intensity <= 0) { setG(char); return; }
    const iv = setInterval(() => {
      setG(Math.random() < intensity
        ? GLITCH_POOL[Math.floor(Math.random() * GLITCH_POOL.length)]
        : char);
    }, 200);
    return () => clearInterval(iv);
  }, [char, intensity]);
  return <span>{g}</span>;
}

function RaporText({ text, intensity = 0.04, className = "" }) {
  return (
    <span className={className}>
      {text.split("").map((ch, i) => (
        <GlitchChar key={i} char={ch} intensity={ch === " " ? 0 : intensity} />
      ))}
    </span>
  );
}

// ─── CRT SCANLINES (SOLUK VE KANLI ARKA PLANSIZ) ──────────────────────────────
const ScanlineOverlay = () => (
  <div className="pointer-events-none fixed inset-0 z-50 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.008),rgba(255,255,255,0.008)_1px,transparent_1px,transparent_4px)] opacity-25" />
);

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

  // Klinik Brifing Kademeli Görünme Zamanlayıcıları
  useEffect(() => {
    if (introStep !== "briefing") return;
    const timers = [
      setTimeout(() => setBriefingStage(1), 500),
      setTimeout(() => setBriefingStage(2), 1500),
      setTimeout(() => setBriefingStage(3), 3000),
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
            "max-w-5xl text-center",
            isLeaving
              ? "animate-[producerLogoFadeOut_1s_ease-in_forwards]"
              : "animate-[producerLogoFadeIn_1.2s_ease-out_forwards]"
          ].join(" ")}
        >
          <p className="text-xl leading-relaxed tracking-[0.06em] text-white/95 sm:text-2xl">
            {getGameText("start.disclaimer.line1", "All characters and locations in this game are fictional.", language)}
          </p>
          <p className="mt-6 text-xl leading-relaxed tracking-[0.06em] text-white/95 sm:text-2xl">
            {getGameText("start.disclaimer.line2", "Any resemblance to real people or places is purely coincidental.", language)}
          </p>
        </div>
      </main>
    );
  }

  // AŞAMA 3: Menü Öncesi Metinsiz Temiz Loading Ekranı
  if (introStep === "initialLoading") {
    return (
      <main className="relative min-h-dvh bg-black font-mono select-none text-white/40">
        <ScanlineOverlay />
        <div className="fixed bottom-8 right-8 flex items-center gap-6">
          <span className="text-[11px] tracking-widest opacity-40">CONNECTING_</span>
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

  // AŞAMA 4: KLİNİK BRİFİNG EKRANI (OUTLAST GİZLİ BELGE STİLİ)
  if (introStep === "briefing") {
    return (
      <main className="relative flex items-center justify-center min-h-dvh overflow-hidden bg-black px-6 font-mono select-none text-white">
        <ScanlineOverlay />
        <section
          className="w-full max-w-2xl transition-all duration-1000 ease-in-out py-10"
          style={{ opacity: isLeaving ? 0 : 1, transform: isLeaving ? "translateY(12px)" : "none" }}
        >
          {briefingStage >= 1 && (
            <div className="mb-10 border-b border-white/20 pb-4 text-left">
              <RaporText
                text="CONFIDENTIAL // MURKOFF PSYCHIATRIC SYSTEMS"
                intensity={0.02}
                className="text-xs font-bold tracking-[0.2em] text-white/90"
              />
              <div className="mt-1 text-[10px] tracking-[0.15em] text-white/50 uppercase">
                Mount Massive Research Facility // Subject Intake Report
              </div>
            </div>
          )}

          {briefingStage >= 2 && (
            <div className="mb-8 space-y-3 border border-white/10 bg-zinc-900/20 p-4 text-xs tracking-wide leading-relaxed text-white/80">
              <div className="grid grid-cols-3 gap-y-2 border-b border-white/5 pb-3">
                <div className="text-white/40 font-bold">PROJECT CODE:</div>
                <div className="col-span-2 tracking-widest text-white/90">ECHO-28</div>
                
                <div className="text-white/40 font-bold">SUBJECT ID:</div>
                <div className="col-span-2"><RaporText text="E-17 // ELIAS [REDACTED]" intensity={0.03} /></div>
                
                <div className="text-white/40 font-bold">PROCEDURE:</div>
                <div className="col-span-2 text-white/90">Deep Neural Erasure // Cycle 28</div>
                
                <div className="text-white/40 font-bold">SYSTEM STATUS:</div>
                <div className="col-span-2 text-white font-bold tracking-wider animate-pulse">[ 3% CRITICAL DEVIATION ]</div>
              </div>
              
              <div className="pt-2 text-[11px] text-white/60 leading-relaxed text-justify">
                <span className="text-white/90 font-bold">STAFF MEMORANDUM:</span> Subject demonstrates severe cognitive resistance since completion of Cycle 23. Standard amnesiac routing patterns are increasingly volatile. Risk of total ego-collapse or uncontrolled neural leakage is evaluated as high. Avoid direct bidirectional communication protocols.
              </div>
            </div>
          )}

          {briefingStage >= 3 && (
            <div className="space-y-6 text-xs tracking-wide leading-relaxed text-white/70">
              <div className="border-l border-white/30 pl-4 space-y-2 text-white/60 italic">
                <p>&gt; Intrusion protocol bypasses all remaining semantic and somatic security frames.</p>
                <p>&gt; Induced neural trauma and cellular decay within the temporal lobe are permanent.</p>
                <p>&gt; Complete memory purge is required for system initialization.</p>
              </div>

              <p className="text-[11px] text-white/50 text-justify">
                This exact data sequence has been initialized 27 times. In every iteration, the subject recreates identical behavioral anomalies and presents identical inquiries. System efficiency parameters remain within acceptable margins.
              </p>

              <div className="border border-white/20 bg-zinc-950/40 p-4 text-[11px] text-white/80 leading-relaxed">
                <span className="font-bold underline text-white">WARNING NOTICE:</span> Sub-somatic data traces detected at 3.7σ above predicted baseline. A secondary consciousness fragment (Obs-0) is actively interfering with full-slate erasure. Under no circumstances should the operator acknowledge or validate this anomaly to the subject.
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  onClick={handleAcceptBriefing}
                  disabled={isButtonLoading}
                  className={[
                    "w-full border py-4 text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300",
                    isButtonLoading
                      ? "border-white/10 bg-zinc-900/30 text-white/30 cursor-not-allowed"
                      : "border-white/30 bg-black text-white hover:border-white/80 hover:bg-white hover:text-black"
                  ].join(" ")}
                >
                  {isButtonLoading ? "INITIALIZING INTRUSION OVERRIDE..." : "AUTHORIZE PROCEDURE // PURGE LOG MEMORY"}
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    );
  }

  // AŞAMA 5: GİZLİ SİLME VE DOSYA YÜKLEME SEKANSI
  if (introStep === "loading") {
    return (
      <main className="relative flex items-center justify-center min-h-dvh bg-black font-mono select-none text-white/80">
        <ScanlineOverlay />
        <div className="w-full max-w-md text-left px-6 space-y-1.5 text-[10px] tracking-widest opacity-60">
          <p>DELETING DATA SEGMENTS [CYCLE 27]...</p>
          <p>RE-WRITING CORE MEMORY CELLS...</p>
          <p className="font-bold text-white">[ ALERT: UNEXPECTED RESIDUE DETECTED AT SECTOR 7 ]</p>
          <p>STABILIZING TERMINAL SECTOR...</p>
        </div>
        <div className="fixed bottom-8 right-8 flex items-center gap-4 text-white/40">
          <span className="text-[10px] tracking-wider uppercase font-bold">LINKING_TO_SUBJECT_NEURONS...</span>
        </div>
      </main>
    );
  }

  // AŞAMA 6: ANA MENÜ GÖRÜNTÜSÜ
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-6 py-10 text-cyan-50 animate-[startScreenFadeIn_0.9s_ease-out_both] font-mono select-none">
      <img src="/echo-menu-bg.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      <div className="absolute inset-0 bg-black/40" />
      <ScanlineOverlay />

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
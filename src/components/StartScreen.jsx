import { useEffect, useState, useRef, useMemo } from "react";
import SettingsModal from "./SettingsModal";
import { getGameText } from "../i18n/gameText";
import ProducerLogoAnimation from "./ProducerLogoAnimation";

const ScanlineOverlay = () => (
  <div className="pointer-events-none fixed inset-0 z-50 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.015),rgba(255,255,255,0.015)_2px,transparent_2px,transparent_5px)] opacity-35 shadow-[inset_0_0_80px_rgba(0,0,0,0.8)]" />
);

export default function StartScreen({
  gameTitle = "ECHO",
  subtitle = "REMOTE COMMAND INCIDENT",
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
  const [menuGlitch, setMenuGlitch] = useState(false);

  const language = settings?.language || "en";

  // 1. Yasal Uyarı Zamanlayıcısı
  useEffect(() => {
    if (introStep !== "disclaimer") return;
    const leaveTimer = setTimeout(() => setIsLeaving(true), 3600);
    const nextTimer = setTimeout(() => {
      setIntroStep("briefing"); 
      setIsLeaving(false);
    }, 4800);
    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(nextTimer);
    };
  }, [introStep]);

  // 2. Brifing Paragraflarının Sırayla Gelme Zamanlayıcısı
  useEffect(() => {
    if (introStep !== "briefing") return;
    const timers = [
      setTimeout(() => setBriefingStage(1), 600),
      setTimeout(() => setBriefingStage(2), 3000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [introStep]);

  // 3. Menü Öncesi Ara Yükleme Zamanlayıcısı
  useEffect(() => {
    if (introStep !== "initialLoading") return;
    const menuTimer = setTimeout(() => setIntroStep("start"), 3000);
    return () => clearTimeout(menuTimer);
  }, [introStep]);

  // 4. 🚀 GÜNCELLEME: Aşama 5 Gizli Yükleme Ekranı (4.5 saniye çalışır ve ardından oyunu başlatır)
  useEffect(() => {
    if (introStep !== "loading") return;
    const t = setTimeout(() => {
      onStart?.(); 
    }, 4500);
    return () => clearTimeout(t);
  }, [introStep, onStart]);

  // 5. Ana Menü Canlı Mikro Glitch Zamanlayıcısı
  useEffect(() => {
    if (introStep !== "start") return;
    const glitchInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        setMenuGlitch(true);
        setTimeout(() => setMenuGlitch(false), 120);
      }
    }, 3000);
    return () => clearInterval(glitchInterval);
  }, [introStep]);

  // 🚀 GÜNCELLEME: Brifing bittiğinde oyuncu direkt Ana Menü'ye (initialLoading üzerinden) aktarılır
  const handleAcceptBriefing = () => {
    if (isButtonLoading) return;
    setIsButtonLoading(true);
    setTimeout(() => setIsLeaving(true), 800);
    setTimeout(() => {
      setIntroStep("initialLoading");
      setIsLeaving(false);
      setIsButtonLoading(false);
    }, 1600);
  };

  // 🚀 GÜNCELLEME: Ana menüden NEW GAME'e basıldığında artık direkt oyun başlamaz,
  // Önce Aşama 5'teki siber temizlik ve çöküş yükleme ekranı (`loading`) tetiklenir!
  const handleNewGameStart = () => {
    setIntroStep("loading"); 
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
        <ScanlineOverlay />
        <div className={`max-w-4xl text-center transition-opacity duration-1000 ${isLeaving ? "opacity-0" : "opacity-100"}`}>
          <p className="text-sm leading-relaxed tracking-[0.2em] text-zinc-400 uppercase">
            {getGameText("start.disclaimer.line1", "All characters and locations in this game are fictional.", language)}
          </p>
          <p className="mt-4 text-xs leading-relaxed tracking-[0.15em] text-zinc-500 uppercase">
            {getGameText("start.disclaimer.line2", "Any resemblance to real people or places is purely coincidental.", language)}
          </p>
        </div>
      </main>
    );
  }

  // AŞAMA 4: BRİFİNG EKRANI (Ana menü öncesi)
  if (introStep === "briefing") {
    return (
      <main className="fixed inset-0 grid place-items-center bg-black px-8 py-16 font-mono select-none text-zinc-300">
        <ScanlineOverlay />
        <section className={`w-full max-w-2xl text-center space-y-10 transition-opacity duration-1000 ${isLeaving ? "opacity-0" : "opacity-100"}`}>
          {briefingStage >= 1 && (
            <p className="text-xs sm:text-sm leading-relaxed tracking-[0.18em] text-zinc-400 max-w-xl mx-auto animate-[startScreenFadeIn_0.8s_both] text-justify border-l border-zinc-800 pl-4">
              Mount Massive Research Facility contains classified medical data, severe neural trauma, and highly restricted system files. Please proceed with caution.
            </p>
          )}

          {briefingStage >= 2 && (
            <div className="space-y-10 animate-[startScreenFadeIn_0.8s_both]">
              <p className="text-xs sm:text-sm leading-relaxed tracking-[0.18em] text-zinc-400 max-w-xl mx-auto text-justify border-r border-zinc-800 pr-4">
                You are executing Project Echo, a system clearance routing to authorize Deep Neural Erasure on Subject E-17. Avoid two-way cognitive links. Do not answer questions. Your only choices are to execute, overwrite, or fail.
              </p>

              <div className="pt-6">
                <button
                  type="button"
                  onClick={handleAcceptBriefing}
                  disabled={isButtonLoading}
                  className={`text-xs tracking-[0.35em] uppercase transition-all duration-300 bg-transparent text-zinc-500 pb-1 border-b border-transparent ${isButtonLoading ? "opacity-30 cursor-not-allowed" : "hover:text-white hover:border-white"}`}
                >
                  {isButtonLoading ? "INITIALIZING LINK..." : "CONNECT TO TERMINAL"}
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    );
  }

  // AŞAMA 3: Menü Öncesi Ara Yükleme Ekranı
  if (introStep === "initialLoading") {
    return (
      <main className="relative min-h-dvh bg-black font-mono select-none text-zinc-600 flex items-center justify-center">
        <ScanlineOverlay />
        <div className="text-center space-y-2 animate-pulse">
          <p className="text-[10px] tracking-[0.4em] text-zinc-500">MNT_MASSIVE_PROXY_RESOLVING</p>
          <p className="text-[9px] tracking-widest text-cyan-700 font-bold">SECURE HANDSHAKE ACTIVE</p>
        </div>
      </main>
    );
  }

  // AŞAMA 5: GİZLİ YÜKLEME SEKANSI (Artık New Game butonuna basıldığı an görünür ve 4.5 saniye kalır)
  if (introStep === "loading") {
    return (
      <main className="fixed inset-0 flex flex-col justify-center bg-black font-mono select-none p-8 text-zinc-500 z-50">
        <ScanlineOverlay />
        <div className="w-full max-w-2xl text-left space-y-3 text-[11px] tracking-widest opacity-70 border-l-2 border-neutral-900 pl-4 animate-[flicker_4s_infinite]">
          <p>&gt; DELETING DATA SEGMENTS [CYCLE 27]...</p>
          <p>&gt; RE-WRITING CORE MEMORY CELLS...</p>
          <p className="font-bold text-rose-500 animate-pulse">[ ALERT: UNEXPECTED COGNITIVE RESIDUE DETECTED AT SECTOR 7 ]</p>
          <p>&gt; OVERRIDING CONSCIOUSNESS INFRASTRUCTURE...</p>
          <p>&gt; STABILIZING TERMINAL SECTOR PROXIMITY...</p>
        </div>
      </main>
    );
  }

  // AŞAMA 6: ANA MENÜ GÖRÜNTÜSÜ
  return (
    <main className={`relative flex min-h-dvh items-center justify-center overflow-hidden px-6 py-10 text-cyan-50 font-mono select-none ${menuGlitch ? 'animate-[screenGlitch_0.1s_infinite]' : 'animate-[flicker_6s_infinite]'}`}>
      <img src="/echo-menu-bg.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" draggable={false} />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/80" />
      <ScanlineOverlay />

      <button
        type="button"
        onClick={() => setIsSettingsOpen(true)}
        className="absolute right-5 top-5 z-20 grid h-10 w-10 place-items-center border border-cyan-300/25 bg-slate-950/45 text-cyan-100 backdrop-blur-sm transition hover:border-cyan-300/50 hover:bg-cyan-400/10 rounded-sm"
        aria-label={getGameText("common.openSettings", "Open settings", language)}
      >
        ⚙
      </button>

      <section className="relative z-10 flex w-full max-w-xl flex-col items-center text-center">
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-black tracking-[0.35em] text-cyan-100 drop-shadow-[0_0_30px_rgba(34,211,238,0.5)] sm:text-7xl uppercase">
            {gameTitle}
          </h1>
          {subtitle && <p className="mt-4 text-[10px] tracking-[0.45em] text-cyan-400/60 uppercase font-bold">{subtitle}</p>}
          <div className="mx-auto mt-6 h-0.5 w-64 bg-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.5)]" />
        </div>

        <div className="flex w-full max-w-xs flex-col gap-4">
          <button
            type="button"
            disabled={!hasSavedGame}
            onClick={onContinue}
            className={[
              "w-full border bg-slate-950/60 px-8 py-4 text-xs tracking-[0.3em] font-bold backdrop-blur-sm transition-all duration-300 rounded-sm",
              hasSavedGame
                ? "border-cyan-500/40 text-cyan-100 hover:border-cyan-400 hover:bg-cyan-500/10 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)] active:scale-[0.99]"
                : "border-neutral-900 text-neutral-700 cursor-not-allowed opacity-30 bg-black/40"
            ].join(" ")}
          >
            {getGameText("start.continueLink", "CONTINUE", language)}
          </button>

          <button
            type="button"
            onClick={handleNewGameStart}
            className="w-full border border-cyan-500/30 bg-slate-950/40 px-8 py-4 text-xs tracking-[0.3em] font-bold text-cyan-300 transition-all duration-300 hover:border-cyan-400 hover:bg-cyan-500/10 hover:text-white hover:shadow-[0_0_25px_rgba(34,211,238,0.15)] active:scale-[0.99] rounded-sm"
          >
            {getGameText("start.establishLink", "NEW GAME", language)}
          </button>

          <button
            type="button"
            onClick={onOpenCredits}
            className="w-full border border-neutral-900 bg-slate-950/15 px-8 py-3.5 text-[10px] tracking-[0.25em] text-neutral-500 transition-all duration-300 hover:border-neutral-800 hover:text-neutral-300 active:scale-[0.99]"
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
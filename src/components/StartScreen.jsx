import { useEffect, useState } from "react";
import SettingsModal from "./SettingsModal";
import { getGameText } from "../i18n/gameText";
import ProducerLogoAnimation from "./ProducerLogoAnimation";

export default function StartScreen({
  gameTitle,
  subtitle,
  onStart, // Orijinal props ismini koruyoruz ki dış katmanda hata vermesin
  settings,
  onChangeSettings,
  onReset
}) {
  // Akış Kademeleri: "producerLogo" | "disclaimer" | "initialLoading" | "start"
  const [introStep, setIntroStep] = useState("producerLogo");
  const [isLeaving, setIsLeaving] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const language = settings?.language || "en";

  // 1. ZAMANLAYICI DÖNGÜSÜ: Yasal Uyarı / Disclaimer Ekranı
  useEffect(() => {
    if (introStep !== "disclaimer") return;

    const leaveTimer = setTimeout(() => {
      setIsLeaving(true);
    }, 3600);

    const nextTimer = setTimeout(() => {
      setIntroStep("initialLoading");
      setIsLeaving(false);
    }, 4800);

    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(nextTimer);
    };
  }, [introStep]);

  // 2. ZAMANLAYICI DÖNGÜSÜ: Menü Öncesi Ara Yükleme (Initial Loading)
  useEffect(() => {
    if (introStep !== "initialLoading") return;

    const menuTimer = setTimeout(() => {
      setIntroStep("start");
    }, 2500);

    return () => clearTimeout(menuTimer);
  }, [introStep]);

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
          <p className="text-xl leading-relaxed tracking-[0.06em] text-white/90 sm:text-3xl">
            {getGameText(
              "start.disclaimer.line1",
              "All characters and locations in this game are fictional.",
              language
            )}
          </p>

          <p className="mt-6 text-xl leading-relaxed tracking-[0.06em] text-white/90 sm:text-3xl">
            {getGameText(
              "start.disclaimer.line2",
              "Any resemblance to real people or places is purely coincidental.",
              language
            )}
          </p>
        </div>
      </main>
    );
  }

  // AŞAMA 3: Menü Öncesi Metinsiz Temiz Loading Ekranı
if (introStep === "initialLoading") {
  return (
    <main className="relative min-h-dvh bg-black font-mono select-none text-cyan-50/60">
      <div className="pointer-events-none fixed inset-0 z-50 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.015),rgba(255,255,255,0.015)_1px,transparent_1px,transparent_5px)] opacity-35" />
      
      {/* Sağ alt köşede konumlandırılan beyaz spinner ve log grubu */}
      <div className="fixed bottom-8 right-8 flex items-center gap-6">
        <span className="text-[11px] tracking-widest opacity-40">
          CONNECTING_
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

  // AŞAMA 4: Ana Menü Görüntüsü
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-6 py-10 text-cyan-50 animate-[startScreenFadeIn_0.9s_ease-out_both] font-mono select-none">
      <img
        src="/echo-menu-bg.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />

      <div className="absolute inset-0 bg-black/40" />

      {/* Atmosferik Grid ve Işık Katmanları */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent,rgba(0,0,0,0.5))]" />
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.015),rgba(255,255,255,0.015)_1px,transparent_1px,transparent_5px)] opacity-35" />

      <button
        type="button"
        onClick={() => setIsSettingsOpen(true)}
        className={[
          "absolute right-5 top-5 z-20",
          "grid h-10 w-10 place-items-center",
          "border border-cyan-300/25 bg-slate-950/45",
          "text-cyan-100 backdrop-blur-sm",
          "transition hover:border-cyan-300/50 hover:bg-cyan-400/10"
        ].join(" ")}
        aria-label={getGameText("common.openSettings", "Open settings", language)}
      >
        ⚙
      </button>

      <section className="relative z-10 flex w-full max-w-xl flex-col items-center text-center">
        <div className="mb-10 text-center">
          <h1 className="text-5xl font-light tracking-[0.32em] text-cyan-100 drop-shadow-[0_0_26px_rgba(34,211,238,0.65)] sm:text-7xl">
            {gameTitle}
          </h1>

          {subtitle && (
            <p className="mt-3 text-xs tracking-[0.4em] text-cyan-400/70 uppercase">
              {subtitle}
            </p>
          )}

          <div className="mx-auto mt-5 h-px w-64 bg-cyan-300/40 shadow-[0_0_20px_rgba(34,211,238,0.65)]" />
        </div>

        {/* BAĞLANTIYI BAŞLAT BUTONU */}
        <button
          type="button"
          onClick={onStart} // Fonksiyon tetiklendiğinde üst katmandaki state brifing sayfasına kırılacak
          className={[
            "w-full max-w-xs border border-cyan-300/50 bg-slate-950/40 px-8 py-4",
            "text-sm tracking-[0.28em] text-cyan-100 backdrop-blur-sm",
            "transition-all duration-300",
            "hover:border-cyan-300/85 hover:bg-cyan-400/10",
            "hover:shadow-[0_0_30px_rgba(34,211,238,0.24)]",
            "active:scale-[0.98]"
          ].join(" ")}
        >
          {getGameText("start.establishLink", "ESTABLISH LINK", language)}
        </button>
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
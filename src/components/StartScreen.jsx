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

  // İlk Açılış Ara Yükleme Zamanlayıcısı (Yer Altı Sinyal Bağlantısı)
  useEffect(() => {
    if (introStep !== "initialLoading") return;
    const menuTimer = setTimeout(() => setIntroStep("start"), 2500);
    return () => clearTimeout(menuTimer);
  }, [introStep]);

  // Brifing Metinlerinin Ekrana Sırayla Gelme Zamanlayıcıları
  useEffect(() => {
    if (introStep !== "briefing") return;
    const timers = [
      setTimeout(() => setBriefingStage(1), 500),
      setTimeout(() => setBriefingStage(2), 2500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [introStep]);

  // Brifing Sonrası Derin Bağlantı Yükleme Ekranı Zamanlayıcısı
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

  // AŞAMA 2: Kültürel ve Kurumsal Yasal Uyarı
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
          <p className="text-base leading-relaxed tracking-wide text-stone-300 sm:text-lg">
            {getGameText("start.disclaimer.line1", "Bu yapıttaki tüm kurumlar, karakterler ve kazı alanları kurgusaldır.", language)}
          </p>
          <p className="mt-4 text-base leading-relaxed tracking-wide text-stone-400 sm:text-lg">
            {getGameText("start.disclaimer.line2", "Gerçek kişi, mekan ve arkeolojik keşiflerle olan benzerlikler tamamen rastlantısaldır.", language)}
          </p>
        </div>
      </main>
    );
  }

  // AŞAMA 3: Menü Öncesi Sinyal Arama Ekranı (Kehribar Rengi Döner Daire)
  if (introStep === "initialLoading") {
    return (
      <main className="relative min-h-dvh bg-neutral-950 font-mono select-none text-stone-600">
        <div className="fixed bottom-8 right-8 flex items-center gap-6">
          <span className="text-[10px] tracking-widest opacity-50 text-amber-600 font-bold">TUNNEL_SIGNAL_SEARCH_</span>
          <div className="relative w-6 h-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-amber-500 rounded-full animate-pulse"
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

  // AŞAMA 4: YERALTI ANOMALİSİ BRİFİNG EKRANI (Yeni Hikaye Temelli)
  if (introStep === "briefing") {
    return (
      <main className="fixed inset-0 grid place-items-center bg-black px-8 py-16 font-mono select-none text-stone-300">
        <section
          className="w-full max-w-2xl text-center space-y-12 transition-opacity duration-1000 ease-in-out"
          style={{ opacity: isLeaving ? 0 : 1 }}
        >
          
          {/* Paragraf 1 */}
          {briefingStage >= 1 && (
            <p className="text-sm leading-relaxed tracking-wide text-stone-300/90 max-w-xl mx-auto animate-[startScreenFadeIn_1s_both]">
              Nevşehir kazı alanı tescilsiz alt katmanları; yüksek frekans bozulmaları, mühürlenmiş antik oda mimarileri ve kayıp ekspedisyon kayıtları barındırmaktadır. Lütfen sinyal takibini dikkatle sürdürün.
            </p>
          )}

          {/* Paragraf 2 */}
          {briefingStage >= 2 && (
            <div className="space-y-12 animate-[startScreenFadeIn_1s_both]">
              <p className="text-sm leading-relaxed tracking-wide text-stone-300/90 max-w-xl mx-auto">
                Şu an Katman Projesi telsiz köprüsünü yürütüyorsunuz. Amacınız yer altı sığınak ağında mahsur kalan Jones Aydın ile bağlantıyı korumak ve mühürlü mırıldanmaları filtrelemektir. Rezonans sapmalarına yanıt vermeyin. Sadece rehberlik edin, fotoğrafları arşivleyin ve Jones'u yüzeye çıkarın.
              </p>

              {/* Devam Et Butonu */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleAcceptBriefing}
                  disabled={isButtonLoading}
                  className={[
                    "text-xs tracking-[0.3em] uppercase transition-all duration-300 bg-transparent text-amber-500 font-bold border-b border-transparent pb-1",
                    isButtonLoading
                      ? "opacity-30 cursor-not-allowed"
                      : "hover:text-white hover:border-white"
                  ].join(" ")}
                >
                  {isButtonLoading ? "BAĞLANTI_KURULUYOR..." : "FREKANSI_BAĞLA"}
                </button>
              </div>
            </div>
          )}

        </section>
      </main>
    );
  }

  // AŞAMA 5: ANTİK ŞİFRE VE SES ANALİZ YÜKLEME SEKANSI
  if (introStep === "loading") {
    return (
      <main className="fixed inset-0 flex items-center justify-center bg-neutral-950 font-mono select-none text-stone-500">
        <div className="w-full max-w-md text-left px-6 space-y-2 text-[11px] tracking-widest opacity-60">
          <p>YERALTI ODALARI AKUSTİK VERİSİ AYRIŞTIRILIYOR...</p>
          <p>DUVAR KAZINTILARI FOTOĞRAF ANALİZİ AKTİF...</p>
          <p className="font-bold text-rose-600">[ UYARI: DERİN KATMANDA BELİRSİZ HAREKETLİLİK TESPİT EDİLDİ ]</p>
          <p>TELSİZ KANALI FREKANS KİLİDİ STABİLİZASYONU...</p>
        </div>
        
        <div className="fixed bottom-8 right-8 flex items-center gap-4 text-stone-400">
          <span className="text-[10px] tracking-wider uppercase font-bold opacity-50 text-amber-500">LINKING_</span>
          <div className="relative w-6 h-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-[3px] h-[3px] bg-amber-500 rounded-full animate-pulse"
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

  // AŞAMA 6: ANA MENÜ GÖRÜNTÜSÜ (Antik Taş Estetiği)
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-6 py-10 text-stone-100 animate-[startScreenFadeIn_0.9s_ease-out_both] font-mono select-none bg-black">
      <img src="/echo-menu-bg.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" draggable={false} />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

      <button
        type="button"
        onClick={() => setIsSettingsOpen(true)}
        className="absolute right-5 top-5 z-20 grid h-10 w-10 place-items-center border border-stone-800 bg-neutral-950/60 text-stone-300 backdrop-blur-xs transition hover:border-amber-900/50 hover:bg-amber-950/20"
        aria-label={getGameText("common.openSettings", "Open settings", language)}
      >
        ⚙
      </button>

      <section className="relative z-10 flex w-full max-w-xl flex-col items-center text-center">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-light tracking-[0.25em] text-stone-200 drop-shadow-[0_0_30px_rgba(245,158,11,0.35)] sm:text-6xl uppercase">
            {gameTitle}
          </h1>
          {subtitle && <p className="mt-4 text-[10px] tracking-[0.45em] text-amber-600/80 uppercase font-bold">{subtitle}</p>}
          <div className="mx-auto mt-6 h-px w-48 bg-stone-800 shadow-[0_0_15px_rgba(245,158,11,0.2)]" />
        </div>

        <div className="flex w-full max-w-xs flex-col gap-3.5">
          <button
            type="button"
            disabled={!hasSavedGame}
            onClick={onContinue}
            className={[
              "w-full border bg-neutral-950/50 px-8 py-3.5 text-xs tracking-[0.28em] backdrop-blur-xs transition-all duration-300",
              hasSavedGame
                ? "border-stone-800 text-stone-200 hover:border-amber-900/50 hover:bg-amber-950/10 active:scale-[0.98]"
                : "border-stone-900 text-stone-700 cursor-not-allowed opacity-30 bg-neutral-950/10"
            ].join(" ")}
          >
            {getGameText("start.continueLink", "KÖPRÜYÜ DEVAM ETTİR", language)}
          </button>

          <button
            type="button"
            onClick={() => setIntroStep("briefing")}
            className="w-full border border-stone-800 bg-neutral-950/30 px-8 py-3.5 text-xs tracking-[0.28em] text-stone-300 font-bold backdrop-blur-xs transition-all duration-300 hover:border-amber-900/40 hover:bg-amber-950/10 hover:text-amber-500 active:scale-[0.98]"
          >
            {getGameText("start.establishLink", "YENİ BAĞLANTI KUR", language)}
          </button>

          <button
            type="button"
            onClick={onOpenCredits}
            className="w-full border border-stone-900/60 bg-neutral-950/10 px-8 py-3.5 text-[11px] tracking-[0.25em] text-stone-500 backdrop-blur-xs transition-all duration-300 hover:border-stone-800 hover:text-stone-400 active:scale-[0.98]"
          >
            {getGameText("start.creditsLink", "KAYITLAR // KÜNYE", language)}
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
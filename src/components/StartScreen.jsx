import { useEffect, useState, useRef } from "react";
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
  
  // YENİ EKLENEN STATELER
  const [warningStage, setWarningStage] = useState(0);
  const [connMsg, setConnMsg] = useState("");
  const [isTitleFading, setIsTitleFading] = useState(false); // Başlık fade out kontrolü

  // Müzik için referans - En üst seviyede tanımlı (Component mount oldukça yaşamaya devam eder)
  const audioRef = useRef(null);

  const language = settings?.language || "en";

  // MÜZİK YÖNETİMİ: titleReveal anında başlar, sadece oyun başlatılınca durur.
  useEffect(() => {
    if (introStep === "titleReveal" && !audioRef.current) {
      audioRef.current = new Audio("/audio/echo-protocol-main-theme.mp3");
      audioRef.current.loop = true;
      audioRef.current.play().catch(err => console.log("Müzik başlatılamadı:", err));
    }
  }, [introStep]);

  // Oyun başladığında müziği durduran temizleyici
  const stopMusic = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  // YENİ EKLENEN: Uyarılar Zamanlayıcısı (Fade In/Out)
  useEffect(() => {
    if (introStep !== "warnings") return;
    const t1 = setTimeout(() => setWarningStage(1), 3000);
    const t2 = setTimeout(() => setIntroStep("disclaimer"), 6000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [introStep]);

  // ORİJİNAL: Yasal Uyarı Zamanlayıcısı
  useEffect(() => {
    if (introStep !== "disclaimer") return;
    const leaveTimer = setTimeout(() => setIsLeaving(true), 3600);
    const nextTimer = setTimeout(() => { setIntroStep("initialLoading"); setIsLeaving(false); }, 4800);
    return () => { clearTimeout(leaveTimer); clearTimeout(nextTimer); };
  }, [introStep]);

  // ORİJİNAL: İlk Açılış Ara Yükleme Zamanlayıcısı -> Doğrudan Sistem Bağlantısına Geçiş
  useEffect(() => {
    if (introStep !== "initialLoading") return;
    const menuTimer = setTimeout(() => setIntroStep("systemConnection"), 2500);
    return () => clearTimeout(menuTimer);
  }, [introStep]);

  // YENİ EKLENEN: Sistem Bağlantısı Zamanlayıcısı (Jones konuşmadan terminal stili)
  useEffect(() => {
    if (introStep !== "systemConnection") return;
    const msgs = [
      "SİNYAL ARANIYOR...",
      "GÜVENLİK PROTOKOLLERİ AŞILIYOR...",
      "FREKANS EŞLEŞTİRİLİYOR...",
      "BAĞLANTI KURULDU."
    ];
    let i = 0;
    setConnMsg(msgs[i]);
    const interval = setInterval(() => {
      i++;
      if (i >= msgs.length) {
        clearInterval(interval);
        setTimeout(() => setIntroStep("blackout"), 500);
      } else {
        setConnMsg(msgs[i]);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [introStep]);

  // YENİ EKLENEN: Tam Kararma Ekranı (Bağlantıdan sonra anlık boşluk)
  useEffect(() => {
    if (introStep !== "blackout") return;
    const t = setTimeout(() => setIntroStep("titleReveal"), 1000);
    return () => clearTimeout(t);
  }, [introStep]);

  // YENİ EKLENEN: Echo Protocol Yazısı (4 saniye bekler, sonra 1 saniye fade out)
  useEffect(() => {
    if (introStep !== "titleReveal") return;
    const t = setTimeout(() => {
      setIsTitleFading(true);
      setTimeout(() => setIntroStep("start"), 1000);
    }, 4000);
    return () => clearTimeout(t);
  }, [introStep]);

  // ORİJİNAL: Brifing Metinlerinin Ekrana Sırayla Gelme Zamanlayıcıları
  useEffect(() => {
    if (introStep !== "briefing") return;
    const timers = [
      setTimeout(() => setBriefingStage(1), 500),
      setTimeout(() => setBriefingStage(2), 2500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [introStep]);

  // ORİJİNAL: Brifing Sonrası Derin Bağlantı Yükleme Ekranı Zamanlayıcısı
  useEffect(() => {
    if (introStep !== "loading") return;
    const t = setTimeout(() => { onStart?.(); }, 4000);
    return () => clearTimeout(t);
  }, [introStep, onStart]);

  // ORİJİNAL: Buton İşlevi
  const handleAcceptBriefing = () => {
    if (isButtonLoading) return;
    setIsButtonLoading(true);
    stopMusic(); // Oyun başlarken durdur
    setTimeout(() => setIsLeaving(true), 1000);
    setTimeout(() => { setIntroStep("loading"); setIsLeaving(false); }, 1800);
  };

  // Tıklama ile Başlığı Kapatma İşlevi
  const handleTitleClick = () => {
    if (isTitleFading) return;
    setIsTitleFading(true);
    setTimeout(() => setIntroStep("start"), 1000);
  };


  // --- AŞAMALAR ---

  if (introStep === "producerLogo") return <ProducerLogoAnimation src="/red-door-logo.jpg" alt="Red Door" onComplete={() => setIntroStep("warnings")} />;

  // YENİ EKLENEN: Uyarılar (Fade in - Fade out)
  if (introStep === "warnings") {
    return (
      <main className="fixed inset-0 grid place-items-center bg-black font-mono text-stone-300 select-none">
        <style>{`
          @keyframes fadeInOutWarnings {
            0% { opacity: 0; }
            20% { opacity: 1; }
            80% { opacity: 1; }
            100% { opacity: 0; }
          }
          .animate-fade-in-out { animation: fadeInOutWarnings 3s forwards; }
        `}</style>

      </main>
    );
  }

  if (introStep === "disclaimer") {
    return (
      <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-black px-6 select-none font-mono">
        <div className={["max-w-4xl text-center", isLeaving ? "opacity-0 transition-opacity duration-1000" : "opacity-100 transition-opacity duration-1200"].join(" ")}>
          <p className="text-base leading-relaxed tracking-wide text-stone-300 sm:text-lg">{getGameText("start.disclaimer.line1", "Bu yapıttaki tüm kurumlar, karakterler ve kazı alanları kurgusaldır.", language)}</p>
          <p className="mt-4 text-base leading-relaxed tracking-wide text-stone-400 sm:text-lg">{getGameText("start.disclaimer.line2", "Gerçek kişi, mekan ve arkeolojik keşiflerle olan benzerlikler tamamen rastlantısaldır.", language)}</p>
        </div>
      </main>
    );
  }

  if (introStep === "initialLoading") {
    return (
      <main className="relative min-h-dvh bg-neutral-950 font-mono select-none text-stone-600">
        <div className="fixed bottom-8 right-8 flex items-center gap-6">
          <span className="text-[10px] tracking-widest opacity-50 text-amber-600 font-bold">TUNNEL SIGNAL SEARCH </span>
          <div className="relative w-6 h-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="absolute w-1 h-1 bg-amber-500 rounded-full animate-pulse" style={{ top: `${50 + 40 * Math.sin((i * Math.PI) / 4)}%`, left: `${50 + 40 * Math.cos((i * Math.PI) / 4)}%`, transform: "translate(-50%, -50%)", animationDelay: `${i * 0.15}s`, animationDuration: "1.2s" }} />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (introStep === "briefing") {
    return (
      <main className="fixed inset-0 grid place-items-center bg-black px-8 py-16 font-mono select-none text-stone-300">
        <section className="w-full max-w-2xl text-center space-y-12 transition-opacity duration-1000 ease-in-out" style={{ opacity: isLeaving ? 0 : 1 }}>
          {briefingStage >= 1 && <p className="text-sm leading-relaxed tracking-wide text-stone-300/90 max-w-xl mx-auto animate-[startScreenFadeIn_1s_both]">Nevşehir kazı alanı tescilsiz alt katmanları; yüksek frekans bozulmaları, mühürlenmiş antik oda mimarileri ve kayıp ekspedisyon kayıtları barındırmaktadır. Lütfen sinyal takibini dikkatle sürdürün.</p>}
          {briefingStage >= 2 && (
            <div className="space-y-12 animate-[startScreenFadeIn_1s_both]">
              <p className="text-sm leading-relaxed tracking-wide text-stone-300/90 max-w-xl mx-auto">Şu an Katman Projesi telsiz köprüsünü yürütüyorsunuz. Amacınız yer altı sığınak ağında mahsur kalan Jones Aydın ile bağlantıyı korumak ve mühürlü mırıldanmaları filtrelemektir. Rezonans sapmalarına yanıt vermeyin. Sadece rehberlik edin, fotoğrafları arşivleyin ve Jones'u yüzeye çıkarın.</p>
              <div className="pt-4">
                <button type="button" onClick={handleAcceptBriefing} disabled={isButtonLoading} className={["text-xs tracking-[0.3em] uppercase transition-all duration-300 bg-transparent text-amber-500 font-bold border-b border-transparent pb-1", isButtonLoading ? "opacity-30 cursor-not-allowed" : "hover:text-white hover:border-white"].join(" ")}>
                  {isButtonLoading ? "BAĞLANTI_KURULUYOR..." : "FREKANSI_BAĞLA"}
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    );
  }

  // YALNIZCA YENİ OYUN (Loading): Açılış sekansından çıkarıldı, sadece Yeni Oyun ile tetiklenir
  if (introStep === "loading") {
    return (
      <main className="fixed inset-0 flex items-center justify-center bg-neutral-950 font-mono select-none text-stone-500">
        <div className="w-full max-w-md text-left px-6 space-y-2 text-[11px] tracking-widest opacity-60">
          <p>YERALTI ODALARI AKUSTİK VERİSİ AYRIŞTIRILIYOR...</p>
          <p>DUVAR KAZINTILARI FOTOĞRAF ANALİZİ AKTİF...</p>
          <p className="font-bold text-rose-600">[ UYARI: DERİN KATMANDA BELİRSİZ HAREKETLİLİK TESPİT EDİLDİ ]</p>
          <p>TELSİZ KANALI FREKANS KİLİDİ STABİLİZASYONU...</p>
        </div>
        {/* Dönen tekerlek geri eklendi */}
        <div className="fixed bottom-8 right-8 flex items-center gap-4 text-stone-400">
          <span className="text-[10px] tracking-wider uppercase font-bold opacity-50 text-amber-500">LINKING_</span>
          <div className="relative w-6 h-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="absolute w-[3px] h-[3px] bg-amber-500 rounded-full animate-pulse" style={{ top: `${50 + 42 * Math.sin((i * Math.PI) / 4)}%`, left: `${50 + 42 * Math.cos((i * Math.PI) / 4)}%`, transform: "translate(-50%,-50%)", animationDelay: `${i * 0.15}s`, animationDuration: "1.2s" }} />
            ))}
          </div>
        </div>
      </main>
    );
  }

  // YENİ EKLENEN: Sistem Bağlantı Ekranı
  if (introStep === "systemConnection") {
    return (
      <main className="fixed inset-0 grid place-items-center bg-black font-mono text-amber-600 select-none">
        <style>{`
          @keyframes fadeInOutSystem {
            0% { opacity: 0; }
            20% { opacity: 1; }
            80% { opacity: 1; }
            100% { opacity: 0; }
          }
          .sys-anim { animation: fadeInOutSystem 2s forwards; }
        `}</style>
        <p key={connMsg} className="tracking-widest text-lg sys-anim uppercase">
          {connMsg}
        </p>
      </main>
    );
  }

  // YENİ EKLENEN: Tam Siyah Bekleme Ekranı
  if (introStep === "blackout") {
    return <main className="fixed inset-0 bg-black cursor-default select-none" />;
  }

  // YENİ EKLENEN: Başlık Ekranı (Fade out ile Ana Menüye geçer)
  if (introStep === "titleReveal") {
    return (
      <main 
        className={["fixed inset-0 grid place-items-center bg-black text-white font-mono cursor-pointer select-none transition-opacity duration-1000", isTitleFading ? "opacity-0" : "opacity-100"].join(" ")}
        onClick={handleTitleClick}
      >
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl tracking-[0.4em] uppercase font-light leading-snug">
            ECHO<br/>PROTOCOL
          </h1>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-start bg-black font-mono select-none overflow-hidden text-stone-300">
      <img src="/echo-menu-bg.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" draggable={false} />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
      
      <section className="relative z-10 ml-20 flex flex-col">
        <h1 className="text-5xl tracking-[0.2em] text-white mb-2 uppercase font-light">{gameTitle}</h1>
        {subtitle && <p className="text-sm tracking-[0.5em] text-stone-500 uppercase mb-12">{subtitle}</p>}
        
        <div className="flex flex-col gap-6 w-80">
          <button onClick={() => { stopMusic(); onContinue(); }} disabled={!hasSavedGame} className="flex flex-col border-l-2 border-stone-600 pl-4 py-2 hover:border-amber-600 transition-all text-left">
            <span className="text-lg uppercase">Devam Et</span>
            <span className="text-[10px] text-stone-500">Son Kayıt: Bölüm 1</span>
          </button>
          <button onClick={() => { stopMusic(); setIntroStep("briefing"); }} className="text-left border-l-2 border-transparent pl-4 hover:border-amber-600 transition-all uppercase">Yeni Oyun</button>
          <button onClick={onOpenCredits} className="text-left border-l-2 border-transparent pl-4 hover:border-amber-600 transition-all uppercase">Künye</button>
          <button onClick={() => setIsSettingsOpen(true)} className="text-left border-l-2 border-transparent pl-4 hover:border-amber-600 transition-all uppercase">Ayarlar</button>
        </div>
      </section>

      {isSettingsOpen && (
        <SettingsModal settings={settings} onChangeSettings={onChangeSettings} onReset={onReset} onClose={() => setIsSettingsOpen(false)} />
      )}
    </main>
  );
}
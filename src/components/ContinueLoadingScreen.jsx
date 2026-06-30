import { useEffect, useMemo, useState } from "react";

// Bölüm ID'lerini atmosferik yer altı ve antik kent isimlerine dönüştüren sözlük
const EPISODE_TITLES = {
  episode_01: "KADİM SEKTÖR 01 // DEHLİZE GİRİŞ",
  episode_02: "KADİM SEKTÖR 02 // DERİN DEHLİZ GÖZLEMİ",
  episode_03: "KADİM SEKTÖR 03 // YANKI FREKANSI",
  episode_04: "KADİM SEKTÖR 04 // MUTLAK SESSİZLİK"
};

// Düğüm (node) ID'lerini yeraltı lokasyon isimlerine çeviren sözlük
const LOCATION_LOOKUP = {
  ep01_n01: "Antik Katman Girişi",
  ep01_n04_breath_puzzle: "Sismik Geçit Dehlizi",
  ep02_n01: "Telsiz Kontrol Odası",
  ep02_b_koridoru: "B Sığınağı Koridoru",
  ep02_depo_grid: "Arkeolojik Bulgular Deposu",
  ep02_dr_m_cozuldu: "Yazıt Arşiv Odası"
};

export default function ContinueLoadingScreen({
  saveData,
  onComplete
}) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [visibleLines, setVisibleLines] = useState(0);

  // Veri Çıkarma (Destructuring) ve Fallback Değerler
  const rawEpisode = saveData?.episodeId || "UNKNOWN";
  const rawCheckpoint = saveData?.currentNodeId || "UNKNOWN";
  
  const trust = saveData?.stats?.trust ?? 0;
  const fear = saveData?.stats?.fear ?? 0;
  const mentalStability = saveData?.stats?.mentalStability ?? 100;
  const humanity = saveData?.stats?.humanity ?? 0;
  const echoProximity = saveData?.stats?.echoProximity ?? 0;
  const lastContact = saveData?.relationship?.currentState || "CAUTIOUS";

  // 1. ADIM: Bölüm ID'sini normalize etme
  let normalizedEpisode = rawEpisode;
  const epMatch = rawEpisode.match(/^episode_(\d)$/);
  if (epMatch) {
    normalizedEpisode = `episode_0${epMatch[1]}`;
  }

  // 2. ADIM: Başlık ve Lokasyon Kontrolleri
  const formattedEpisode = EPISODE_TITLES[normalizedEpisode] || "";
  const locationName = LOCATION_LOOKUP[rawCheckpoint] || "Bilinmeyen Dehliz Katmanı";

  // DİNAMİK YERALTI LOG MESAJLARI: Sismik rezonans ve mağara keşif akışı
  const dynamicMessages = [
    "KEŞİF VERİLERİ AYRIŞTIRILIYOR...",
    "SİSMİK YANKI İZLERİ ANALİZ EDİLİYOR...",
    `SON KONUM DOĞRULANDI: [${locationName.toUpperCase()}]`,
    "KAŞİF PSİKOLOJİK PROFİLİ DERLENİYOR...",
    echoProximity > 70 
      ? "TEHLİKE: DERİNLİKLERDE ANORMAL KARALTI HAREKETİ!" 
      : "AKUSTİK FREKANS ŞABLONU EŞLEŞTİ...",
    "TELSİZ VE YANKI BAĞLANTISI SAĞLANDI."
  ];

  useEffect(() => {
    // Dinamik mesaj geçişleri
    const messageTimer = setInterval(() => {
      setMessageIndex((prev) =>
        prev < dynamicMessages.length - 1 ? prev + 1 : prev
      );
    }, 700);

    // Alt stat satırlarının sırayla ekrana dökülme hızı
    const lineTimer = setInterval(() => {
      setVisibleLines((prev) => (prev < 8 ? prev + 1 : prev));
    }, 450);

    // Toplam 4.5 saniye sonra ana arayüze geçiş
    const completeTimer = setTimeout(() => {
      onComplete?.();
    }, 4500);

    return () => {
      clearInterval(messageTimer);
      clearInterval(lineTimer);
      clearInterval(completeTimer);
    };
  }, [onComplete, dynamicMessages.length]);

  // Tehlikeli Karaltı yakınlığında uyarının rengini değiştirme
  const isWarningMessage = dynamicMessages[messageIndex].includes("TEHLİKE");

  return (
    <main className="relative min-h-dvh bg-gradient-to-b from-stone-950 to-neutral-950 font-mono text-stone-400 select-none overflow-hidden">
      
      {/* DERİN MAĞARA KARANLIĞI VE TEBRİK HİSSİ (HEAVY VIGNETTE EFFECT) */}
      <div className="pointer-events-none fixed inset-0 z-50 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.95)_100%)] opacity-90" />

      <div className="fixed inset-0 flex items-center justify-center p-6 z-10">
        <div className="w-full max-w-md text-center">
          
          {/* ÜST KISIM: Dinamik Sismik Durum Akışı */}
          <div className="mb-12 min-h-[40px] px-4">
            <p 
              className={[
                "text-xs tracking-[0.25em] uppercase font-bold transition-colors duration-300",
                isWarningMessage ? "text-rose-600 animate-pulse drop-shadow-[0_0_10px_rgba(220,38,38,0.2)]" : "text-amber-500"
              ].join(" ")}
            >
              {dynamicMessages[messageIndex]}
            </p>
          </div>

          {/* ORTA KISIM: Antik Konum ve Dehliz Doğrulama Paneli */}
          <div className="space-y-4 border-y border-stone-900/60 bg-black/40 backdrop-blur-xs py-7 px-4 shadow-[inset_0_0_25px_rgba(0,0,0,0.85)] relative">
            {/* Köşe Taş Kesim Detayları */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-stone-800" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-stone-800" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-stone-800" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-stone-800" />

            {visibleLines >= 1 && formattedEpisode && (
              <p className="text-xs tracking-[0.2em] text-amber-600/80 font-black uppercase animate-[startScreenFadeIn_0.3s_ease-out_both]">
                {formattedEpisode}
              </p>
            )}
            {visibleLines >= 2 && (
              <p className="text-xs tracking-[0.1em] text-stone-400 animate-[startScreenFadeIn_0.3s_ease-out_both] uppercase m-0">
                SON BİLİNEN LOKASYON: <span className="text-stone-200 font-bold underline decoration-stone-800 underline-offset-4">{locationName}</span>
              </p>
            )}
          </div>

          {/* ALT KISIM: Kaşif Günlüğü ve Saha İstatistikleri */}
          <div className="mt-8 space-y-3 text-left text-[11px] tracking-[0.15em] text-stone-500 max-w-[270px] mx-auto font-mono uppercase font-bold">
            {visibleLines >= 3 && (
              <p className="flex justify-between border-b border-stone-900/60 pb-1.5 animate-[startScreenFadeIn_0.2s_ease-out_both] m-0">
                <span>ZİHİNSEL STABİLİTE:</span>
                <span className="text-stone-300 font-black">{mentalStability}%</span>
              </p>
            )}
            {visibleLines >= 4 && (
              <p className="flex justify-between border-b border-stone-900/60 pb-1.5 animate-[startScreenFadeIn_0.2s_ease-out_both] m-0">
                <span>GÜVEN SEVİYESİ:</span>
                <span className="text-stone-300 font-black">{trust}%</span>
              </p>
            )}
            {visibleLines >= 5 && (
              <p className="flex justify-between border-b border-stone-900/60 pb-1.5 animate-[startScreenFadeIn_0.2s_ease-out_both] m-0">
                <span>KORKU REAKSİYONU:</span>
                <span className="text-stone-300 font-black">{fear}%</span>
              </p>
            )}
            {visibleLines >= 6 && (
              <p className="flex justify-between border-b border-stone-900/60 pb-1.5 animate-[startScreenFadeIn_0.2s_ease-out_both] m-0">
                <span>İNSANLIK ENDEKSİ:</span>
                <span className="text-stone-300 font-black">{humanity}%</span>
              </p>
            )}
            {visibleLines >= 7 && (
              <p 
                className={[
                  "flex justify-between border-b pb-1.5 transition-colors duration-300 m-0",
                  echoProximity > 60 
                    ? "border-rose-950/40 text-rose-500 animate-pulse font-black" 
                    : "border-stone-900/60 text-stone-500"
                ].join(" ")}
              >
                <span>KARALTI YAKINLIĞI:</span>
                <span className={echoProximity > 60 ? "text-rose-600 font-black" : "text-stone-300 font-black"}>
                  {echoProximity}%
                </span>
              </p>
            )}
            {visibleLines >= 8 && (
              <div className="mt-6 pt-3 text-center border-t border-stone-900/80 animate-[startScreenFadeIn_0.4s_ease-out_both]">
                <p className="text-[8px] tracking-[0.2em] text-stone-600 uppercase mb-1 font-black">
                  DEHLİZ PSİKOLOJİK BAĞI
                </p>
                <p className="text-xs text-rose-700 font-black tracking-[0.2em] m-0">
                  {lastContact === "cautious" ? "TEMKİNLİ" : lastContact === "trust" ? "GÜVENLİ" : lastContact.toUpperCase()}
                </p>
              </div>
            )}
          </div>

          {/* SİSMİK REZONANS VE YANKI HALKASI (KADİM ANALOG RADAR GÖRÜNÜMÜ) */}
          <div className="relative mx-auto mt-14 w-8 h-8 select-none pointer-events-none opacity-60">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-amber-600 shadow-[0_0_5px_rgba(217,119,6,0.5)] animate-pulse"
                style={{
                  top: `${50 + 40 * Math.sin((i * Math.PI) / 4)}%`,
                  left: `${50 + 40 * Math.cos((i * Math.PI) / 4)}%`,
                  transform: "translate(-50%, -50%)",
                  animationDelay: `${i * 0.12}s`,
                  animationDuration: "1.2s"
                }}
              />
            ))}
          </div>

        </div>
      </div>
    </main>
  );
}
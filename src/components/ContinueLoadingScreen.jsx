import { useEffect, useState } from "react";

// Bölüm ID'lerini atmosferik yer altı isimlerine dönüştüren lookup sözlüğü
const EPISODE_TITLES = {
  episode_01: "BÖLÜM 01 // SEKANSA GİRİŞ",
  episode_02: "BÖLÜM 02 // DEHLİZ GÖZLEMİ",
  episode_03: "BÖLÜM 03 // FREKANS YAKALAMA",
  episode_04: "BÖLÜM 04 // SESSİZLİK"
};

// Düğüm (node) ID'lerini oyuncunun göreceği yeraltı lokasyon isimlerine çeviren lookup sözlüğü
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

  // Oyuncu dostu lokasyon ve bölüm dönüşümleri
  const formattedEpisode = EPISODE_TITLES[rawEpisode] || `KATMAN OTURUMU // ${rawEpisode.toUpperCase()}`;
  const locationName = LOCATION_LOOKUP[rawCheckpoint] || "Bilinmeyen Dehliz";

  // DİNAMİK LOG MESAJLARI: Save verisine göre yeraltı rezonans akışı oluşturma
  const dynamicMessages = [
    "OTURUM VERİSİ AYRIŞTIRILIYOR...",
    "REZONANS İZLERİ BULUNDU...",
    `SON KONTROL NOKTASI DOĞRULANDI: [${locationName.toUpperCase()}]`,
    "KAŞİF PSİKOLOJİK PROFİLİ REKUPERE EDİLDİ...",
    echoProximity > 70 
      ? "UYARI: ANORMAL SİSMİK KARALTI AKTİVİTESİ!" 
      : "SİNYAL REZONANS ŞABLONU EŞLEŞTİ...",
    "TELSİZ KÖPRÜSÜ KURULDU."
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

    // Toplam 4.5 saniye sonra terminal arayüzüne geçiş
    const completeTimer = setTimeout(() => {
      onComplete?.();
    }, 4500);

    return () => {
      clearInterval(messageTimer);
      clearInterval(lineTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete, dynamicMessages.length]);

  // Tehlikeli Echo/Karaltı yakınlığında log mesajının rengini değiştirmek için kontrol
  const isWarningMessage = dynamicMessages[messageIndex].includes("UYARI");

  return (
    <main className="relative min-h-dvh bg-black font-mono text-stone-300 select-none">
      {/* Tarama Çizgileri Perdesi */}
      <div className="pointer-events-none fixed inset-0 z-50 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.01),rgba(255,255,255,0.01)_1px,transparent_1px,transparent_5px)] opacity-25" />

      <div className="fixed inset-0 flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          
          {/* Üst Kısım: Dinamik Durum Log Akışı */}
          <div className="mb-10 min-h-[40px]">
            <p 
              className={[
                "text-xs tracking-[0.35em] uppercase font-bold transition-colors duration-300",
                isWarningMessage ? "text-rose-600 animate-pulse" : "text-amber-500"
              ].join(" ")}
            >
              {dynamicMessages[messageIndex]}
            </p>
          </div>

          {/* Orta Kısım: Sinematik Konum Doğrulama */}
          <div className="space-y-3.5 border-y border-stone-900 bg-stone-950/20 py-6 text-sm text-stone-400 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
            {visibleLines >= 1 && (
              <p className="text-xs tracking-[0.25em] text-amber-600/80 font-bold uppercase animate-[startScreenFadeIn_0.3s_ease-out_both]">
                {formattedEpisode}
              </p>
            )}
            {visibleLines >= 2 && (
              <p className="text-xs tracking-[0.12em] text-stone-300 animate-[startScreenFadeIn_0.3s_ease-out_both] uppercase">
                SON BİLİNEN LOKASYON: <span className="text-stone-100 underline decoration-stone-800 underline-offset-4">{locationName}</span>
              </p>
            )}
          </div>

          {/* Alt Kısım: Atmosferik Profil ve Telsiz Bağ Statları */}
          <div className="mt-8 space-y-2.5 text-left text-[11px] tracking-widest text-stone-500 max-w-[260px] mx-auto font-mono uppercase font-bold">
            {visibleLines >= 3 && (
              <p className="flex justify-between border-b border-stone-900 pb-1.5 animate-[startScreenFadeIn_0.2s_ease-out_both]">
                <span>ZİHİNSEL STABİLİTE:</span>
                <span className="text-stone-300">{mentalStability}%</span>
              </p>
            )}
            {visibleLines >= 4 && (
              <p className="flex justify-between border-b border-stone-900 pb-1.5 animate-[startScreenFadeIn_0.2s_ease-out_both]">
                <span>GÜVEN SEVİYESİ:</span>
                <span className="text-stone-300">{trust}%</span>
              </p>
            )}
            {visibleLines >= 5 && (
              <p className="flex justify-between border-b border-stone-900 pb-1.5 animate-[startScreenFadeIn_0.2s_ease-out_both]">
                <span>KORKU REAKSİYONU:</span>
                <span className="text-stone-300">{fear}%</span>
              </p>
            )}
            {visibleLines >= 6 && (
              <p className="flex justify-between border-b border-stone-900 pb-1.5 animate-[startScreenFadeIn_0.2s_ease-out_both]">
                <span>İNSANLIK ENDEKSİ:</span>
                <span className="text-stone-300">{humanity}%</span>
              </p>
            )}
            {visibleLines >= 7 && (
              <p 
                className={[
                  "flex justify-between border-b pb-1.5 transition-colors duration-300",
                  echoProximity > 60 
                    ? "border-rose-950/40 text-rose-500 animate-pulse font-black" 
                    : "border-stone-900 text-stone-500"
                ].join(" ")}
              >
                <span>KARALTI YAKINLIĞI:</span>
                <span className={echoProximity > 60 ? "text-rose-600" : "text-stone-300"}>
                  {echoProximity}%
                </span>
              </p>
            )}
            {visibleLines >= 8 && (
              <div className="mt-5 pt-3 text-center border-t border-stone-900 animate-[startScreenFadeIn_0.4s_ease-out_both]">
                <p className="text-[9px] tracking-[0.25em] text-stone-600 uppercase mb-1">
                  PSİKOLOJİK BAĞ DURUMU
                </p>
                <p className="text-xs text-rose-600 font-black tracking-[0.15em]">
                  {lastContact === "cautious" ? "TEMKİNLİ" : lastContact === "trust" ? "GÜVENLİ" : lastContact.toUpperCase()}
                </p>
              </div>
            )}
          </div>

          {/* Frekans Arama Halkası (Kehribar) */}
          <div className="relative mx-auto mt-12 w-8 h-8">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)] animate-pulse"
                style={{
                  top: `${50 + 40 * Math.sin((i * Math.PI) / 4)}%`,
                  left: `${50 + 40 * Math.cos((i * Math.PI) / 4)}%`,
                  transform: "translate(-50%, -50%)",
                  animationDelay: `${i * 0.12}s`,
                  animationDuration: "1s"
                }}
              />
            ))}
          </div>

        </div>
      </div>
    </main>
  );
}
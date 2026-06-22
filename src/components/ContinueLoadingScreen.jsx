import { useEffect, useState } from "react";

// Bölüm ID'lerini atmosferik isimlere dönüştüren lookup sözlüğü
const EPISODE_TITLES = {
  episode_01: "EPISODE 01 // PROCEDURE VERIFICATION",
  episode_02: "EPISODE 02 // VOID MONITORING",
  episode_03: "EPISODE 03 // SIGNAL RECOVERY"
};

// Geliştirici düğüm (node) ID'lerini oyuncunun göreceği lokasyon isimlerine çeviren lookup sözlüğü
const LOCATION_LOOKUP = {
  ep01_n01: "Sub-Level Access",
  ep01_n04_breath_puzzle: "Maintenance Corridor",
  ep02_n01: "Command Hub Terminal",
  ep02_b_koridoru: "Sector B Corridor",
  ep02_depo_grid: "B Medical Depot",
  ep02_dr_m_cozuldu: "Research Ward Archive"
};

export default function ContinueLoadingScreen({
  saveData,
  onComplete
}) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [visibleLines, setVisibleLines] = useState(0);

  // 1. Veri Çıkarma (Destructuring) ve Fallback Değerler
  const rawEpisode = saveData?.episodeId || "UNKNOWN";
  const rawCheckpoint = saveData?.currentNodeId || "UNKNOWN";
  
  const trust = saveData?.stats?.trust ?? 0;
  const fear = saveData?.stats?.fear ?? 0;
  const mentalStability = saveData?.stats?.mentalStability ?? 100;
  const humanity = saveData?.stats?.humanity ?? 0;
  const echoProximity = saveData?.stats?.echoProximity ?? 0;
  const lastContact = saveData?.relationship?.currentState || "CAUTIOUS";

  // Oyuncu dostu lokasyon ve bölüm dönüşümleri
  const formattedEpisode = EPISODE_TITLES[rawEpisode] || `SESSION // ${rawEpisode.toUpperCase()}`;
  const locationName = LOCATION_LOOKUP[rawCheckpoint] || "Unknown Sector";

  // 2. 🚀 DİNAMİK LOG MESAJLARI: Save verisine göre akış dizisi oluşturma
  const dynamicMessages = [
    "RESTORING SESSION...",
    "MEMORY TRACE FOUND...",
    `LAST CHECKPOINT VERIFIED: [${locationName.toUpperCase()}]`,
    "PSYCHOLOGICAL PROFILE RECOVERED...",
    echoProximity > 70 
      ? "WARNING: ABNORMAL ECHO ACTIVITY DETECTED" 
      : "ECHO SIGNAL PATTERN DETECTED...",
    "LINK ESTABLISHED."
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

  // Tehlikeli Echo yakınlığında log mesajının rengini değiştirmek için kontrol
  const isWarningMessage = dynamicMessages[messageIndex].includes("WARNING");

  return (
    <main className="relative min-h-dvh bg-black font-mono text-cyan-50 select-none">
      {/* CRT Ekran Çizgileri Baskısı */}
      <div className="pointer-events-none fixed inset-0 z-50 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.015),rgba(255,255,255,0.015)_1px,transparent_1px,transparent_5px)] opacity-35" />

      <div className="fixed inset-0 flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          
          {/* Üst Kısım: Dinamik Durum Log Akışı */}
          <div className="mb-10 min-h-[40px]">
            <p 
              className={[
                "text-xs tracking-[0.35em] uppercase font-bold transition-colors duration-300",
                isWarningMessage ? "text-rose-500 animate-pulse" : "text-cyan-400"
              ].join(" ")}
            >
              {dynamicMessages[messageIndex]}
            </p>
          </div>

          {/* Orta Kısım: Sinematik Konum Doğrulama */}
          <div className="space-y-3.5 border-y border-cyan-950/40 bg-cyan-950/5 py-6 text-sm text-cyan-100/80 shadow-[inset_0_0_20px_rgba(34,211,238,0.02)]">
            {visibleLines >= 1 && (
              <p className="text-xs tracking-[0.25em] text-cyan-400/80 font-medium animate-[startScreenFadeIn_0.3s_ease-out_both]">
                {formattedEpisode}
              </p>
            )}
            {visibleLines >= 2 && (
              <p className="text-sm tracking-[0.12em] text-cyan-100/90 animate-[startScreenFadeIn_0.3s_ease-out_both]">
                LAST KNOWN LOCATION: <span className="text-white underline decoration-cyan-500/40 underline-offset-4">{locationName}</span>
              </p>
            )}
          </div>

          {/* Alt Kısım: Atmosferik Profil ve Psikolojik Bağ Statları */}
          <div className="mt-8 space-y-2.5 text-left text-xs tracking-widest text-cyan-100/50 max-w-[260px] mx-auto font-mono">
            {visibleLines >= 3 && (
              <p className="flex justify-between border-b border-cyan-950/20 pb-1.5 animate-[startScreenFadeIn_0.2s_ease-out_both]">
                <span>MENTAL STABILITY:</span>
                <span className="text-cyan-300 font-bold">{mentalStability}%</span>
              </p>
            )}
            {visibleLines >= 4 && (
              <p className="flex justify-between border-b border-cyan-950/20 pb-1.5 animate-[startScreenFadeIn_0.2s_ease-out_both]">
                <span>TRUST LEVEL:</span>
                <span className="text-cyan-300 font-bold">{trust}%</span>
              </p>
            )}
            {visibleLines >= 5 && (
              <p className="flex justify-between border-b border-cyan-950/20 pb-1.5 animate-[startScreenFadeIn_0.2s_ease-out_both]">
                <span>FEAR RESPONSE:</span>
                <span className="text-cyan-300 font-bold">{fear}%</span>
              </p>
            )}
            {visibleLines >= 6 && (
              <p className="flex justify-between border-b border-cyan-950/20 pb-1.5 animate-[startScreenFadeIn_0.2s_ease-out_both]">
                <span>HUMANITY INDEX:</span>
                <span className="text-cyan-300 font-bold">{humanity}%</span>
              </p>
            )}
            {visibleLines >= 7 && (
              <p 
                className={[
                  "flex justify-between border-b pb-1.5 transition-colors duration-300",
                  echoProximity > 60 
                    ? "border-rose-950/40 text-rose-400 font-bold animate-pulse" 
                    : "border-cyan-950/20 text-cyan-100/70"
                ].join(" ")}
              >
                <span>ECHO PRESENCE:</span>
                <span className={echoProximity > 60 ? "text-rose-500" : "text-cyan-300 font-bold"}>
                  {echoProximity}%
                </span>
              </p>
            )}
            {visibleLines >= 8 && (
              <div className="mt-5 pt-3 text-center border-t border-cyan-900/30 animate-[startScreenFadeIn_0.4s_ease-out_both]">
                <p className="text-[10px] tracking-[0.25em] text-cyan-400/60 uppercase mb-1">
                  PSYCHOLOGICAL LINK STATUS
                </p>
                <p className="text-sm text-rose-400 font-bold tracking-[0.15em] drop-shadow-[0_0_8px_rgba(251,113,133,0.2)]">
                  {lastContact.toUpperCase()}
                </p>
              </div>
            )}
          </div>

          {/* Sistem Yükleme Spinner Halkası */}
          <div className="relative mx-auto mt-12 w-10 h-10">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.4)] animate-pulse"
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
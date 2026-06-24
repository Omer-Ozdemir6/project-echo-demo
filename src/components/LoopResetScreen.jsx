import { useEffect } from "react";

export default function LoopResetScreen({ 
  loaderMessage, 
  subMessage, 
  visible, 
  loaderDurationMs = 3500, // Varsayılan bekleme süresi
  autoRestoreCheckpointAfterLoader = true,
  restoreCheckpointId,
  onComplete // Ekran süresi bittiğinde çağrılacak kritik callback (Üst bileşende visible=false yapmalı and checkpoint yüklemeli)
}) {
  
  useEffect(() => {
    if (!visible) return;

    // Belirlenen süre (Örn: 3.5 saniye) sonra ekranı kapatıp akışı devam ettirecek zamanlayıcı
    const timer = setTimeout(() => {
      if (onComplete) {
        onComplete({
          autoRestore: autoRestoreCheckpointAfterLoader,
          checkpointId: restoreCheckpointId
        });
      }
    }, loaderDurationMs);

    return () => clearTimeout(timer);
  }, [visible, loaderDurationMs, autoRestoreCheckpointAfterLoader, restoreCheckpointId, onComplete]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-black select-none font-mono"
      style={{ animation: "fadeIn 0.8s ease forwards" }}
    >
      {/* Tarama Çizgileri Perdesi */}
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.01),rgba(255,255,255,0.01)_2px,transparent_2px,transparent_5px)] opacity-25" />

      {/* Kırık dönen daire — Kasıtlı 270 derece, eksik analog arama rezonansı */}
      <div className="relative w-12 h-12 mb-8">
        <svg
          className="w-full h-full"
          style={{
            animationName: "spin",
            animationDuration: "2.5s",
            animationIterationCount: "infinite",
            animationTimingFunction: "linear",
          }}
          viewBox="0 0 64 64"
        >
          <circle
            cx="32"
            cy="32"
            r="26"
            fill="none"
            stroke="rgba(245, 158, 11, 0.15)"
            strokeWidth="2"
          />
          <circle
            cx="32"
            cy="32"
            r="26"
            fill="none"
            stroke="#f59e0b" // Kehribar rezonans halkası
            strokeWidth="2.5"
            strokeDasharray="110 50"
            strokeLinecap="round"
            style={{ filter: "drop-shadow(0 0 8px rgba(245, 158, 11, 0.4))" }}
          />
        </svg>
      </div>

      {/* Ana mesaj */}
      <p className="text-stone-300 text-xs tracking-[0.3em] uppercase font-bold mb-3 animate-pulse text-center px-4">
        {loaderMessage || "DÖNGÜ // REZONANS YENİDEN BAŞLATILIYOR"}
      </p>

      {/* Alt mesaj */}
      <p className="text-stone-600 text-[10px] tracking-widest uppercase font-black text-center px-4">
        {subMessage || "Telsiz frekans ve bellek sıfırlama protokolü aktif."}
      </p>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
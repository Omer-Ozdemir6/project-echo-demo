function LoopResetScreen({ loaderMessage, subMessage, visible }) {
  if (!visible) return null;
 
  return (
    <div
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-black"
      style={{ animation: "fadeIn 0.8s ease forwards" }}
    >
      {/* Kırık dönen daire — kasıtlı 270 derece, eksik */}
      <div className="relative w-16 h-16 mb-8">
        <svg
          className="w-full h-full"
          style={{
            animationName: "spin",
            animationDuration: "2s",
            animationIterationCount: "infinite",
            animationTimingFunction: "linear",
          }}
          viewBox="0 0 64 64"
        >
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="#374151"
            strokeWidth="2"
            strokeDasharray="132 44"
            strokeLinecap="round"
          />
        </svg>
      </div>
 
      {/* Ana mesaj */}
      <p className="text-gray-400 text-sm tracking-widest uppercase font-mono mb-3">
        {loaderMessage || "DÖNGÜ — YENİDEN BAŞLATILIYOR"}
      </p>
 
      {/* Alt mesaj */}
      <p className="text-gray-600 text-xs font-mono">
        {subMessage || "Bellek sıfırlama protokolü aktif."}
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
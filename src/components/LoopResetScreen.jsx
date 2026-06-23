function LoopResetScreen({ loaderMessage, subMessage }) {
  return (
    <div className="fixed inset-0 bg-black flex flex-col 
                    items-center justify-center z-50">
      
      {/* Kırık dönen daire */}
      <div className="relative w-16 h-16 mb-8">
        <svg
          className="w-full h-full animate-spin"
          style={{ animationDuration: "2s" }}
          viewBox="0 0 64 64"
        >
          {/* Tam daire değil — 270 derece — kasıtlı eksik */}
          <circle
            cx="32" cy="32" r="28"
            fill="none"
            stroke="#4B5563"
            strokeWidth="2"
            strokeDasharray="132 44"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Ana mesaj */}
      <p className="text-gray-400 text-sm tracking-widest uppercase 
                    font-mono mb-3">
        {loaderMessage}
      </p>

      {/* Alt mesaj */}
      <p className="text-gray-600 text-xs font-mono">
        {subMessage}
      </p>

    </div>
  );
}
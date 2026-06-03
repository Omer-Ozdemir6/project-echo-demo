export default function ChoicePanel({ choices, onChoice }) {
  return (
    /* Üstteki çizgiyi (border-t) ve başlık alanını tamamen kaldırdık, 
       sadece kutuları saran ana grid yapısını bıraktık. */
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {choices.map((choice, index) => (
        <button
          key={choice.id}
          type="button"
          onClick={() => onChoice(choice.id)}
          className={[
            "group relative w-full overflow-hidden",
            "border border-cyan-300/15 bg-slate-950/70",
            "px-4 py-4 text-left",
            "transition-all duration-200",
            "animate-[messageIn_0.35s_ease-out_both]",
            "hover:translate-x-1 hover:border-cyan-300/40 hover:bg-cyan-400/5",
            "hover:shadow-[0_0_20px_rgba(34,211,238,0.08)]",
            "active:scale-[0.99]"
          ].join(" ")}
          style={{ animationDelay: `${index * 90}ms` }}
        >
          <div className="flex items-center gap-3">
            {/* Sol taraftaki şık terminal imleci (>) */}
            <span className="shrink-0 font-mono text-sm text-cyan-400/40 transition-all duration-200 group-hover:text-cyan-300 group-hover:translate-x-0.5">
              &gt;
            </span>

            <span className="flex-1 text-sm leading-snug text-cyan-50/90 sm:text-base">
              {choice.text}
            </span>
          </div>

          {/* Sol kenardaki hover parlaması */}
          <div className="absolute left-0 top-0 h-full w-1 bg-cyan-300/0 transition-all duration-200 group-hover:bg-cyan-300/70" />
        </button>
      ))}
    </div>
  );
}
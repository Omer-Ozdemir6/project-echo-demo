import { getGameText } from "../i18n/gameText";
import { playSound } from "../audio/soundManager";

export default function ChoicePanel({
  choices = [],
  onChoice,
  settings,
  language = "en"
}) {
  function handleChoice(choice) {
    playSound("choiceSelect", settings);
    onChoice?.(choice.id);
  }

  function resolveChoiceText(choice) {
    return getGameText(
      choice.textKey,
      choice.text || "",
      language
    );
  }

  if (!choices.length) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 font-mono select-none">
      {choices.map((choice, index) => (
        <button
          key={choice.id || `choice-${index}`}
          type="button"
          onClick={() => handleChoice(choice)}
          className={[
            "group relative w-full overflow-hidden rounded-xs",
            "border border-stone-900 bg-stone-950/40",
            "px-4 py-4 text-left",
            "transition-all duration-200",
            "animate-[messageIn_0.35s_ease-out_both]",
            "hover:translate-x-1 hover:border-amber-900/40 hover:bg-amber-950/5",
            "hover:shadow-[0_0_15px_rgba(245,158,11,0.03)]",
            "active:scale-[0.99]"
          ].join(" ")}
          style={{
            animationDelay: `${index * 90}ms`
          }}
        >
          <div className="flex items-center gap-3">
            <span className="shrink-0 font-mono text-xs font-bold text-stone-600 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-amber-500">
              &gt;
            </span>

            <span className="flex-1 text-xs leading-relaxed font-bold tracking-wide text-stone-300 sm:text-sm uppercase">
              {resolveChoiceText(choice)}
            </span>
          </div>

          {/* Sol dikey dekoratif aktif rezonans hattı çizgisi */}
          <div className="absolute left-0 top-0 h-full w-0.5 bg-transparent transition-all duration-200 group-hover:bg-amber-500/80" />
        </button>
      ))}
    </div>
  );
}
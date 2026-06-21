import { useEffect, useState } from "react";
import { getGameText } from "../i18n/gameText";

function resolveConfigText(value, language = "en", fallback = "") {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    return getGameText(value.textKey, value.text || fallback, language);
  }
  return fallback;
}

export default function RebootConfirmScreen({
  config,
  onRestart,
  language = "en"
}) {
  const [countdown, setCountdown] = useState(config?.countdownSeconds || 10);
  const [isRestarting, setIsRestarting] = useState(false);
  const [glitchTrigger, setGlitchTrigger] = useState(false);

  const kicker = getGameText(
    config?.kickerKey,
    config?.kicker || "CRITICAL MEMORY CORRUPTION // AREA 4",
    language
  );

  const title = getGameText(
    config?.titleKey,
    config?.title || "COGNITIVE CONTAINMENT BREACHED",
    language
  );

  const restartingText = getGameText(
    config?.restartingTextKey,
    config?.restartingText || "FORCING NEURAL SYNAPSE RE-IGNITION...",
    language
  );

  const countdownLabel = getGameText(
    config?.countdownLabelKey,
    config?.countdownLabel || "SYSTEM RE-PURGE SEQUENCE IN",
    language
  );

  const buttonLoadingText = getGameText(
    config?.buttonLoadingTextKey,
    config?.buttonLoadingText || "RE-IGNITING...",
    language
  );

  const buttonText = getGameText(
    config?.buttonTextKey,
    config?.buttonText || "FORCE COGNITIVE OVERRIDE",
    language
  );

  function handleRestart() {
    if (isRestarting) return;
    setIsRestarting(true);

    setTimeout(() => {
      onRestart();
    }, config?.restartDelayMs || 1200); // Gerilimi artırmak için delay süresi bir tık esnetildi
  }

  // Glitch Efekti: Geri sayım her değiştiğinde arayüzü anlık sarsar
  useEffect(() => {
    setGlitchTrigger(true);
    const t = setTimeout(() => setGlitchTrigger(false), 150);
    return () => clearTimeout(t);
  }, [countdown]);

  useEffect(() => {
    if (isRestarting) return;

    if (countdown <= 0) {
      handleRestart();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, isRestarting]);

  const crtOverlay = (
    <div className="pointer-events-none fixed inset-0 z-50 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.015),rgba(255,255,255,0.015)_1px,transparent_1px,transparent_5px)] opacity-35" />
  );

  return (
    <main className={`relative grid min-h-dvh place-items-center overflow-hidden bg-black p-4 font-mono select-none text-rose-100 ${glitchTrigger ? 'animate-[screenGlitch_0.1s_infinite]' : ''}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(159,18,57,0.22),transparent_65%)]" />
      {crtOverlay}

      <section className="relative z-10 w-full max-w-2xl border border-rose-950 bg-neutral-950/90 p-6 shadow-[0_0_60px_rgba(225,29,72,0.08)] sm:p-8">
        
        {/* Klinik Durum Başlığı */}
        <div className="flex items-center justify-between border-b border-rose-950/60 pb-3 mb-5">
          <p className="text-[10px] tracking-[0.35em] text-rose-500/80 font-bold animate-pulse">
            {kicker}
          </p>
          <span className="text-[9px] tracking-widest text-rose-700/60 font-bold">
            PROT_44_ECHO
          </span>
        </div>

        {/* Ana Tehdit Başlığı */}
        <h1 className="mb-6 text-lg tracking-[0.2em] text-rose-500 font-bold uppercase sm:text-xl">
          {title}
        </h1>

        {/* Klinik Uyarılar / Log Havuzu */}
        <div className="mb-6 border border-rose-950 bg-rose-950/10 p-4 space-y-3">
          {(config?.warnings || [
            "WARNING: Host consciousness is rejecting the neural link infrastructure.",
            "CRITICAL: Structural ego-death detected in subject Elias.",
            "PROCEED AT YOUR OWN RISK. LONG-TERM COGNITIVE DAMAGE WILL NOT BE COMPENSATED BY THE CORPORATION."
          ]).map((warning, index) => {
            const warningText = resolveConfigText(warning, language);
            return (
              <p
                key={`${warningText}-${index}`}
                className="text-xs leading-relaxed tracking-wide text-rose-200/70 text-justify"
              >
                &gt; {warningText}
              </p>
            );
          })}
        </div>

        {/* Geri Sayım / Şok Alanı */}
        <div className="mb-6 border border-rose-950/40 bg-neutral-900/30 p-4 text-xs tracking-[0.2em] text-rose-300/60 flex items-center justify-between">
          {isRestarting ? (
            <span className="text-rose-400 font-bold animate-pulse tracking-[0.15em]">
              {restartingText}
            </span>
          ) : (
            <div>
              {countdownLabel}{" "}
              <strong className="ml-3 text-2xl text-rose-500 font-black tracking-normal drop-shadow-[0_0_10px_rgba(244,63,94,0.4)]">
                {countdown === 3 ? "☠" : countdown === 1 ? "ERR" : countdown}
              </strong>
            </div>
          )}
        </div>

        {/* Override / Re-ignition Butonu */}
        <button
          type="button"
          className={[
            "w-full border py-4 text-xs tracking-[0.3em] font-bold uppercase transition-all duration-300",
            isRestarting
              ? "border-amber-600/30 bg-amber-950/10 text-amber-500 cursor-not-allowed animate-pulse"
              : "border-rose-700/50 bg-rose-950/20 text-rose-300 hover:border-rose-400 hover:bg-rose-600/20 hover:text-white hover:shadow-[0_0_25px_rgba(244,63,94,0.15)] active:scale-[0.99]"
          ].join(" ")}
          onClick={handleRestart}
          disabled={isRestarting}
        >
          {isRestarting ? buttonLoadingText : buttonText}
        </button>
      </section>

      {/* Sağ Alttaki Agresif Spinner ve Klinik Yazı Grubu */}
      <div className="fixed bottom-8 right-8 flex items-center gap-5 opacity-40">
        <span className="text-[10px] tracking-[0.3em] text-rose-600 font-bold">
          {isRestarting ? "RE_IGNITING_SYNAPSES_" : "MEM_CONTAINMENT_FAILED_"}
        </span>
        <div className="relative w-5 h-5">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-rose-500 rounded-full"
              style={{
                top: `${50 + 40 * Math.sin((i * Math.PI) / 4)}%`,
                left: `${50 + 40 * Math.cos((i * Math.PI) / 4)}%`,
                transform: "translate(-50%, -50%)",
                animation: "typingDotPulse 0.4s infinite",
                animationDelay: `${i * 0.05}s`
              }}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
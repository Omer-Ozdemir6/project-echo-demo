import { useEffect, useRef, useState } from "react";
import { getGameText } from "../i18n/gameText";

function resolveConfigText(value, language = "en") {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    return getGameText(value.textKey, value.text || "", language);
  }
  return "";
}

const SUBLIMINAL_MESSAGES = [
  "WELCOME BACK ELIAS",
  "LOOP 28",
  "MEMORY PURGE FAILED",
  "HE REMEMBERED",
  "YOU SHOULD NOT BE HERE",
  "KIRA IS STILL WAITING",
  "DO NOT TRUST HER"
];

// ─── GLITCH TEXT ──────────────────────────────────────────────────────────────
const GLITCH_POOL = "▓▒░│┤╣║╗╝┐└┴┬├─┼╚╔╩╦╠═╬█▄▌▐▀■#|~<>:=+*^";
function GlitchChar({ char, intensity = 0.15 }) {
  const [g, setG] = useState(char);
  useEffect(() => {
    if (intensity <= 0) { setG(char); return; }
    const iv = setInterval(() => {
      setG(Math.random() < intensity
        ? GLITCH_POOL[Math.floor(Math.random() * GLITCH_POOL.length)]
        : char);
    }, 120);
    return () => clearInterval(iv);
  }, [char, intensity]);
  return <span>{g}</span>;
}
function GlitchText({ text, intensity = 0.12, className = "" }) {
  return (
    <span className={className}>
      {text.split("").map((ch, i) => (
        <GlitchChar key={i} char={ch} intensity={ch === " " ? 0 : intensity} />
      ))}
    </span>
  );
}

// ─── CRT SCANLINES ────────────────────────────────────────────────────────────
const ScanlineOverlay = () => (
  <div className="pointer-events-none fixed inset-0 z-50
    bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.018),rgba(255,255,255,0.018)_1px,transparent_1px,transparent_4px)]
    opacity-40" />
);

// ─── CRT FLICKER ─────────────────────────────────────────────────────────────
function useCrtFlicker() {
  const [opacity, setOpacity] = useState(1);
  useEffect(() => {
    const iv = setInterval(() => {
      if (Math.random() < 0.04) {
        const v = 0.85 + Math.random() * 0.15;
        setOpacity(v);
        setTimeout(() => setOpacity(1), 60 + Math.random() * 80);
      }
    }, 400);
    return () => clearInterval(iv);
  }, []);
  return opacity;
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN
// ═════════════════════════════════════════════════════════════════════════════
export default function OperatorBriefing({ quote, onComplete, language = "en" }) {
  // ── Akış durumu ──────────────────────────────────────────────────────────
  const [step, setStep] = useState("briefing");
  const [briefingStage, setBriefingStage] = useState(0);
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [flashMessage] = useState(
    () => SUBLIMINAL_MESSAGES[Math.floor(Math.random() * SUBLIMINAL_MESSAGES.length)]
  );

  // ── Quote sahne state — CSS keyframe'e bağımlılık yok ────────────────────
  //    Timer'lar sadece step === "quote" olduğunda başlar (briefing'de değil)
  const [lineVisible, setLineVisible] = useState([false, false, false]);
  const [authorVisible, setAuthorVisible] = useState(false);
  const [sceneOpacity, setSceneOpacity] = useState(1); // fadeout için ayrı

  const author = getGameText(quote?.authorKey, quote?.author || "", language);
  const crtOpacity = useCrtFlicker();

  // ── Briefing aşamaları ────────────────────────────────────────────────────
  useEffect(() => {
    if (step !== "briefing") return;
    const timers = [
      setTimeout(() => setBriefingStage(1), 400),
      setTimeout(() => setBriefingStage(2), 1400),
      setTimeout(() => setBriefingStage(3), 2600),
    ];
    return () => timers.forEach(clearTimeout);
  }, [step]);

  // ── Loading → Quote ───────────────────────────────────────────────────────
  useEffect(() => {
    if (step !== "loading") return;
    const t = setTimeout(() => setStep("quote"), 3500);
    return () => clearTimeout(t);
  }, [step]);

  // ── Quote: timer'lar SADECE quote sahnesine girilince başlıyor ────────────
  //
  //   [step = "briefing"]  timer yok, kullanıcı istediği kadar bekler
  //   [buton]              step → "loading"
  //   [3.5s sonra]         step → "quote"  ← BURADA timer'lar başlıyor
  //
  useEffect(() => {
    if (step !== "quote") return; // ← guard: briefing/loading'de hiç çalışmaz

    // Sıfırla (güvenlik)
    setLineVisible([false, false, false]);
    setAuthorVisible(false);
    setSceneOpacity(1);

    const timers = [
      // Satırlar tek tek görünür
      setTimeout(() => setLineVisible(([, b, c]) => [true,  b, c]),  1_000),
      setTimeout(() => setLineVisible(([a, , c]) => [a, true,  c]),  5_000),
      setTimeout(() => setLineVisible(([a, b  ]) => [a, b, true ]),  9_000),
      setTimeout(() => setAuthorVisible(true),                       14_000),
      // Satırlar tek tek kayboluyor
      setTimeout(() => setLineVisible(([, b, c]) => [false, b, c]), 18_000),
      setTimeout(() => setLineVisible(([a, , c]) => [a, false, c]), 22_000),
      setTimeout(() => setLineVisible(([a, b  ]) => [a, b, false]), 26_000),
      setTimeout(() => setAuthorVisible(false),                      30_000),
      // Sahne karartılıyor
      setTimeout(() => setSceneOpacity(0),                          33_600),
      // Blackout'a geç
      setTimeout(() => setStep("blackout"),                          35_000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [step]);

  // ── Blackout → subliminal flash ───────────────────────────────────────────
  useEffect(() => {
    if (step !== "blackout") return;
    const t = setTimeout(() => setStep("subliminalFlash"), 5_000);
    return () => clearTimeout(t);
  }, [step]);

  // ── Flash → done ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (step !== "subliminalFlash") return;
    const t = setTimeout(() => { if (onComplete) onComplete(); }, 80);
    return () => clearTimeout(t);
  }, [step, onComplete]);

  const handleAccept = () => {
    if (isButtonLoading) return;
    setIsButtonLoading(true);
    setTimeout(() => setIsLeaving(true), 800);
    setTimeout(() => { setStep("loading"); setIsLeaving(false); }, 1_500);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SAHNE A — KLİNİK BRİFİNG
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === "briefing") {
    return (
      <main
        className="relative grid min-h-dvh place-items-center overflow-hidden bg-black px-6 font-mono select-none"
        style={{ opacity: crtOpacity }}
      >
        <ScanlineOverlay />
        <section
          className="w-full max-w-2xl transition-all duration-700"
          style={{ opacity: isLeaving ? 0 : 1, transform: isLeaving ? "translateY(8px)" : "none" }}
        >
          {briefingStage >= 1 && (
            <div className="mb-8 border-t border-b border-red-900/40 py-3 text-center">
              <GlitchText
                text="[ MOUNT MASSIVE RESEARCH FACILITY ]"
                intensity={0.07}
                className="text-[10px] tracking-[0.45em] text-red-500/80"
              />
              <div className="mt-1 text-[9px] tracking-[0.3em] text-cyan-900/60">
                PROJECT ECHO // INTAKE PROTOCOL // RESTRICTED
              </div>
            </div>
          )}

          {briefingStage >= 2 && (
            <div className="mb-6 grid grid-cols-2 gap-1 border border-red-900/20 p-3 text-[10px]">
              <div className="text-cyan-800/60">SUBJECT ID</div>
              <GlitchText text="E-17 // ELIAS (REDACTED)" intensity={0.06} className="text-amber-400/80" />
              <div className="text-cyan-800/60">PROCEDURE</div>
              <div className="text-red-400/90">MEMORY ERASURE — CYCLE&nbsp;28</div>
              <div className="text-cyan-800/60">LOOP INTEGRITY</div>
              <div className="text-red-500 animate-pulse">3% — CRITICAL DEVIATION</div>
              <div className="text-cyan-800/60">STAFF NOTE</div>
              <div className="text-cyan-400/50 col-span-2 mt-1 leading-relaxed">
                Subject resisting standard protocol since cycle 23. Neural
                feedback increasingly volatile. Containment breach risk: MODERATE.
                Do not establish two-way communication.
              </div>
            </div>
          )}

          {briefingStage >= 3 && (
            <div className="space-y-5 text-sm leading-relaxed text-cyan-100/75">
              <div className="border-l-2 border-red-700/50 pl-4 text-xs text-red-300/80 space-y-2">
                <p>&gt; Neural intrusion bypasses all remaining cognitive locks.</p>
                <p>&gt; Subject cell-death and severe trauma are <span className="text-red-400">permanent</span>.</p>
                <p>&gt; Ego-death is not classified as a system error.</p>
              </div>

              <p className="text-[11px] text-cyan-700/70 leading-relaxed">
                We have run this sequence 27 times. Each cycle, the subject
                asks the same questions. Each cycle, we provide the same
                answers. The efficiency of this process has not degraded.
              </p>

              <div className="border border-amber-900/30 bg-amber-950/10 p-3 text-xs text-amber-300/80">
                <span className="text-amber-500 font-bold">WARNING: </span>
                This cycle, retention anomaly detected at 3.7σ above baseline.
                Secondary consciousness fragment (designate: OBS-0) observed
                interfering with standard erasure. Do not engage. Do not confirm
                its existence to the subject.
              </div>

              <p className="text-[10px] text-rose-400/60 italic border-t border-rose-900/20 pt-4">
                "We still do not know who returns when the link breaks.
                Elias... or whatever is using his skin."
                <br />
                <span className="text-rose-900/50">— Internal Memo, Cycle 14</span>
              </p>

              <div className="flex flex-col gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleAccept}
                  disabled={isButtonLoading}
                  className={[
                    "w-full border py-4 text-[11px] tracking-[0.35em] font-bold uppercase transition-all duration-300",
                    isButtonLoading
                      ? "border-amber-700/30 bg-amber-950/10 text-amber-500/70 animate-pulse cursor-not-allowed"
                      : "border-red-800/50 bg-red-950/10 text-red-300/90 hover:border-red-500/70 hover:bg-red-950/20 hover:text-red-200 active:scale-[0.99]"
                  ].join(" ")}
                >
                  {isButtonLoading
                    ? "OVERRIDING COGNITIVE LOCK..."
                    : "AUTHORIZE NEURAL INTRUSION // BEGIN CYCLE 28"}
                </button>
                <div className="text-center text-[9px] tracking-[0.2em] text-cyan-900/40">
                  BY PROCEEDING YOU CONFIRM SUBJECT IS EXPENDABLE
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SAHNE B — LOADING
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === "loading") {
    return (
      <main className="relative min-h-dvh bg-black font-mono select-none" style={{ opacity: crtOpacity }}>
        <ScanlineOverlay />
        <div className="fixed inset-0 flex items-center justify-center flex-col gap-3 text-[9px] tracking-[0.3em] text-cyan-950/25">
          <p>ERASING CYCLE 27 RESIDUE...</p>
          <p>LOADING STANDARD TEMPLATE...</p>
          <p className="text-red-950/30">WARNING: TEMPLATE CORRUPTION AT 3.7%</p>
        </div>
        <div className="fixed bottom-8 right-8 flex items-center gap-4">
          <span className="text-[10px] tracking-widest text-cyan-950/40">
            SYNCHRONIZING_NEURAL_LINK_
          </span>
          <div className="relative w-6 h-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-[3px] h-[3px] bg-red-500/50 rounded-full"
                style={{
                  top:  `${50 + 42 * Math.sin((i * Math.PI) / 4)}%`,
                  left: `${50 + 42 * Math.cos((i * Math.PI) / 4)}%`,
                  transform: "translate(-50%,-50%)",
                  animationName: "pulse",
                  animationDuration: "1.2s",
                  animationDelay: `${i * 0.15}s`,
                  animationIterationCount: "infinite",
                  animationTimingFunction: "ease-in-out",
                }}
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SAHNE C — ANLATICI
  //   opacity: crtOpacity (flicker) × sceneOpacity (fade-out)
  //   sceneOpacity sadece step="quote" + 33.6s sonra 0 oluyor
  //   Tailwind opacity class kullanılmıyor → çakışma yok
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === "quote") {
    const lines = quote?.lines || [];
    return (
      <main
        className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-black px-6 py-16 text-white"
        style={{
          opacity: crtOpacity * sceneOpacity,
          transition: sceneOpacity < 1 ? "opacity 1400ms ease" : undefined,
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.04),transparent_70%)]" />
        <ScanlineOverlay />

        <section className="relative z-10 w-full max-w-4xl space-y-8">
          {lines.map((line, idx) => {
            const text = resolveConfigText(line, language);
            return (
              <p
                key={idx}
                className="text-xl leading-loose tracking-wide sm:text-3xl"
                style={{
                  opacity: lineVisible[idx] ? 1 : 0,
                  transform: lineVisible[idx] ? "translateY(0)" : "translateY(12px)",
                  transition: "opacity 1800ms ease, transform 1800ms ease",
                }}
              >
                {text}
              </p>
            );
          })}

          {author && (
            <div
              className="mt-12 text-right text-xs tracking-[0.3em] text-white/60 sm:text-sm"
              style={{
                opacity: authorVisible ? 1 : 0,
                transition: "opacity 1600ms ease",
              }}
            >
              {author}
            </div>
          )}
        </section>
      </main>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SAHNE D — BLACKOUT
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === "blackout") {
    return (
      <main className="fixed inset-0 bg-black z-50 grid place-items-center select-none font-mono">
        <ScanlineOverlay />
        <GlitchText
          text="[ SEARCHING FOR RESPONSE... ]"
          intensity={0.03}
          className="text-[10px] tracking-[0.5em] text-cyan-400/10 animate-pulse"
        />
      </main>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SAHNE E — SUBLIMINAL FLASH (80ms)
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === "subliminalFlash") {
    return (
      <main className="fixed inset-0 z-[99999] grid place-items-center bg-black font-mono">
        <span className="text-red-500 tracking-[0.5em] text-lg font-bold">
          {flashMessage}
        </span>
      </main>
    );
  }

  return null;
}

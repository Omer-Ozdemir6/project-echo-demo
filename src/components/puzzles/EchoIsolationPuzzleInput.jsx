import { useEffect, useMemo, useState } from "react";

// ─────────────────────────────────────────────
// STYLE INJECTION
// CSS animasyonu document.head'e bir kez eklenir
// ─────────────────────────────────────────────

const ECHO_STYLE_ID = "echo-isolation-keyframes";

function injectEchoStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(ECHO_STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = ECHO_STYLE_ID;
  el.textContent =
    "@keyframes echoBar{from{transform:scaleY(0.2)}to{transform:scaleY(1)}}";
  document.head.appendChild(el);
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function resolveText(t, key, fallback) {
  if (!fallback) fallback = "";
  if (key && typeof t === "function") {
    var translated = t(key);
    if (translated && translated !== key) return translated;
  }
  return fallback;
}

var COLORS = {
  red:    { border:"border-red-400/30",    bg:"bg-red-950/15",    text:"text-red-300",    bar:"bg-red-400/65",    accent:"#f87171" },
  orange: { border:"border-orange-400/30", bg:"bg-orange-950/15", text:"text-orange-300", bar:"bg-orange-400/65", accent:"#fb923c" },
  amber:  { border:"border-amber-400/30",  bg:"bg-amber-950/15",  text:"text-amber-300",  bar:"bg-amber-400/65",  accent:"#fbbf24" },
  purple: { border:"border-purple-400/30", bg:"bg-purple-950/15", text:"text-purple-300", bar:"bg-purple-400/65", accent:"#c084fc" },
  cyan:   { border:"border-cyan-300/40",   bg:"bg-cyan-950/20",   text:"text-cyan-200",   bar:"bg-cyan-300/80",   accent:"#67e8f9" }
};

function getColors(color) {
  return COLORS[color] || COLORS.purple;
}

// ─────────────────────────────────────────────
// ISOLATION MATH
// Hedef kanal HIGH, diğerleri LOW olmalı
// ─────────────────────────────────────────────

function calculateClarity(gains, channels, targetId) {
  var targetGain = gains[targetId] != null ? gains[targetId] : 0;
  var others = channels.filter(function(ch) { return ch.id !== targetId; });
  if (!others.length) return targetGain;

  var avgOther = others.reduce(function(sum, ch) {
    return sum + (gains[ch.id] != null ? gains[ch.id] : 0);
  }, 0) / others.length;

  var clarity = targetGain * 0.5 + (100 - avgOther) * 0.5;
  return Math.round(Math.max(0, Math.min(100, clarity)));
}

function resolveHearing(gains, channels, targetId, clarity, threshold, puzzle) {
  if (clarity >= threshold) {
    return {
      text: (puzzle && puzzle.lockedMessage) || "SINYAL IZOLE EDILDI.",
      locked: true
    };
  }

  var loudestCh = null;
  var loudestGain = -1;
  channels.forEach(function(ch) {
    var g = gains[ch.id] != null ? gains[ch.id] : 0;
    if (g > loudestGain) { loudestGain = g; loudestCh = ch; }
  });

  if (!loudestCh || loudestGain === 0) {
    return { text: "oooo SINYAL YOK oooo", locked: false };
  }

  var msgs = (loudestCh.messages) || {};
  if (loudestGain >= 70) return { text: msgs.loud || "||||~~~~~||||", locked: false };
  if (loudestGain >= 30) return { text: msgs.medium || "~ statik ~", locked: false };
  return { text: ".. zayif iz ..", locked: false };
}

// ─────────────────────────────────────────────
// WAVEFORM BARS
// ─────────────────────────────────────────────

function WaveformBars(props) {
  var gain = props.gain;
  var color = props.color;
  var frequency = props.frequency != null ? props.frequency : 1.5;
  var barCount = props.barCount != null ? props.barCount : 14;

  var c = getColors(color);
  var opacity = Math.max(0.06, gain / 100);
  var bars = [];

  for (var i = 0; i < barCount; i++) {
    var baseH = 18 + (i % 5) * 12;
    var dur = ((0.4 + (i % 4) * 0.12) / Math.max(0.1, frequency)).toFixed(2);
    var delay = ((i / barCount) * (0.6 / Math.max(0.1, frequency))).toFixed(2);

    bars.push(
      <span
        key={i}
        className={"flex-1 rounded-sm " + c.bar}
        style={{
          height: baseH + "%",
          minHeight: 2,
          animation: "echoBar " + dur + "s ease-in-out " + delay + "s infinite alternate"
        }}
      />
    );
  }

  return (
    <div
      className="flex items-end gap-px"
      style={{ height: 28, opacity: opacity }}
      aria-hidden="true"
    >
      {bars}
    </div>
  );
}

// ─────────────────────────────────────────────
// CHANNEL STRIP
// ─────────────────────────────────────────────

function ChannelStrip(props) {
  var channel = props.channel;
  var gain = props.gain;
  var onGainChange = props.onGainChange;
  var isTarget = props.isTarget;

  var c = getColors(channel.color);
  var isMuted = gain === 0;

  return (
    <div className={"border " + c.border + " " + c.bg + " p-3 mb-2 last:mb-0"}>
      <div className="flex items-center gap-2 mb-2">
        <span className={"font-mono text-[10px] tracking-[0.22em] " + c.text + " flex-1 min-w-0 truncate"}>
          {isTarget ? "► " : "· "}{channel.label || channel.id}
          {isTarget && <span className="ml-2 opacity-60 text-[9px]">[HEDEF]</span>}
        </span>

        <span className={"font-mono text-[10px] " + c.text + " shrink-0"}>
          {gain}%
        </span>

        <button
          type="button"
          onClick={function() { onGainChange(isMuted ? 60 : 0); }}
          className={[
            "shrink-0 border text-[9px] tracking-[0.18em] px-2 py-1 transition",
            isMuted
              ? c.border + " " + c.text + " opacity-50 hover:opacity-100"
              : "border-rose-400/40 text-rose-300 hover:bg-rose-950/20"
          ].join(" ")}
        >
          {isMuted ? "AC" : "KAPAT"}
        </button>
      </div>

      <WaveformBars
        gain={gain}
        color={channel.color}
        frequency={channel.waveFrequency || 1.5}
      />

      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={gain}
        onChange={function(e) { onGainChange(Number(e.target.value)); }}
        className="w-full mt-2"
        style={{ accentColor: c.accent }}
        aria-label={(channel.label || channel.id) + " kazanci"}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────

export default function EchoIsolationPuzzleInput(props) {
  var puzzle = props.puzzle;
  var attempts = props.attempts != null ? props.attempts : 0;
  var onSubmit = props.onSubmit;
  var t = props.t;

  var channels = Array.isArray(puzzle && puzzle.channels) ? puzzle.channels : [];
  var targetId = puzzle && puzzle.targetChannelId;
  var threshold = Number((puzzle && puzzle.isolationThreshold) != null ? puzzle.isolationThreshold : 85);
  var lockMs = Number((puzzle && puzzle.requiredLockHoldMs) != null ? puzzle.requiredLockHoldMs : 3000);

  // Style injection on mount
  useEffect(function() {
    injectEchoStyles();
  }, []);

  // Initial gains: all channels at 100%, target at 0%
  var initialGains = useMemo(function() {
    var g = {};
    channels.forEach(function(ch) {
      g[ch.id] = ch.id === targetId ? 0 : 100;
    });
    return g;
  }, []); // eslint-disable-line

  var [gains, setGains] = useState(initialGains);
  var [lockProgress, setLockProgress] = useState(0);
  var [isSubmitting, setIsSubmitting] = useState(false);

  var clarity = useMemo(
    function() { return calculateClarity(gains, channels, targetId); },
    [gains, channels, targetId]
  );

  var isInLockRange = clarity >= threshold;
  var isIsolated = lockProgress >= 100;

  var hearing = useMemo(
    function() { return resolveHearing(gains, channels, targetId, clarity, threshold, puzzle); },
    [gains, channels, targetId, clarity, threshold, puzzle]
  );

  // Lock timer
  useEffect(function() {
    if (!isInLockRange) { setLockProgress(0); return; }
    var interval = setInterval(function() {
      setLockProgress(function(prev) { return Math.min(100, prev + 100 / (lockMs / 100)); });
    }, 100);
    return function() { clearInterval(interval); };
  }, [isInLockRange, lockMs]);

  function setChannelGain(channelId, value) {
    setGains(function(prev) {
      var next = Object.assign({}, prev);
      next[channelId] = value;
      return next;
    });
  }

  function handleSubmit() {
    if (isSubmitting || !isIsolated) return;
    setIsSubmitting(true);
    onSubmit(String((puzzle && puzzle.acceptedAnswers && puzzle.acceptedAnswers[0]) || "CIPHER_ISOLATED"));
    setTimeout(function() { setIsSubmitting(false); }, (puzzle && puzzle.submitCooldownMs) || 500);
  }

  var title       = resolveText(t, puzzle && puzzle.titleKey,       (puzzle && puzzle.title)       || "EKO IZOLASYON");
  var description = resolveText(t, puzzle && puzzle.descriptionKey, (puzzle && puzzle.description) || "");
  var submitLabel = resolveText(t, puzzle && puzzle.submitLabelKey, (puzzle && puzzle.submitLabel) || "SINYALI KILITLE");

  var clarityColor =
    clarity >= threshold ? "text-emerald-200" :
    clarity >= 60        ? "text-amber-200"   :
    clarity >= 30        ? "text-orange-300"  :
                           "text-rose-300";

  var outputBorder =
    hearing.locked  ? "border-emerald-300/35 bg-emerald-950/10" :
    clarity >= 50   ? "border-amber-300/20 bg-amber-950/5"      :
                      "border-purple-300/20 bg-purple-950/5";

  return (
    <div className="mt-4 border border-purple-300/35 bg-purple-950/10 p-4 shadow-[0_0_24px_rgba(168,85,247,0.08)]">

      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-4 border-b border-purple-300/20 pb-3">
        <div>
          <p className="m-0 text-[10px] tracking-[0.25em] text-purple-300/55">
            {resolveText(t, "puzzle.echo.moduleActive", "EKO IZOLASYON MODULU AKTIF")}
          </p>
          <h3 className="mt-1 text-xs tracking-[0.24em] text-purple-200">{title}</h3>
        </div>
        {attempts > 0 && (
          <span className="shrink-0 text-[10px] tracking-[0.18em] text-rose-300">
            {resolveText(t, "puzzle.common.attempts", "ATTEMPTS")}: {attempts}
          </span>
        )}
      </div>

      {/* Description */}
      {description && (
        <p className="mb-3 text-xs leading-5 text-purple-50/55">{description}</p>
      )}

      {/* Instructions */}
      <div className="mb-3 border border-purple-300/15 bg-black/35 p-3">
        <p className="m-0 text-[11px] tracking-[0.14em] text-purple-100/60">
          &gt; {resolveText(t, "puzzle.echo.instructions", "CAKISAN BILINC SINYALLERINI FILTRELE. HEDEF KANALI IZOLE ET.")}
        </p>
      </div>

      {/* Hearing output */}
      <div className={"mb-3 border p-3 transition-colors duration-500 " + outputBorder}>
        <p className="m-0 text-[10px] tracking-[0.2em] text-purple-300/45 mb-2">
          {resolveText(t, "puzzle.echo.currentOutput", "MEVCUT CIKIS")}
        </p>
        <p className={"m-0 text-sm leading-6 tracking-[0.08em] font-mono transition-colors duration-300 " + (hearing.locked ? "text-emerald-200" : "text-purple-100/70")}>
          {hearing.text}
        </p>
      </div>

      {/* Channel matrix */}
      <div className="mb-3">
        <p className="text-[10px] tracking-[0.22em] text-purple-300/40 mb-2">
          {resolveText(t, "puzzle.echo.channelMatrix", "KANAL MATRISI")}
        </p>
        {channels.map(function(channel) {
          return (
            <ChannelStrip
              key={channel.id}
              channel={channel}
              gain={gains[channel.id] != null ? gains[channel.id] : 0}
              onGainChange={function(val) { setChannelGain(channel.id, val); }}
              isTarget={channel.id === targetId}
            />
          );
        })}
      </div>

      {/* Clarity + Lock */}
      <div className="border border-purple-300/15 bg-slate-950/60 p-3 mb-3">
        <div className="flex items-center justify-between mb-1">
          <p className="m-0 text-[10px] tracking-[0.2em] text-purple-300/45">
            {resolveText(t, "puzzle.echo.isolationClarity", "IZOLASYON NETLIGI")}
          </p>
          <span className={"font-mono text-[11px] tracking-[0.14em] " + clarityColor}>
            {clarity}%
          </span>
        </div>

        <div className="h-1.5 bg-slate-900 mb-3 overflow-hidden rounded-sm">
          <div
            className={"h-full transition-all duration-200 rounded-sm " + (clarity >= threshold ? "bg-emerald-300" : "bg-purple-400/80")}
            style={{ width: clarity + "%" }}
          />
        </div>

        <div className="flex items-center justify-between mb-1">
          <p className="m-0 text-[10px] tracking-[0.18em] text-purple-300/40">
            {resolveText(t, "puzzle.echo.lockProgress", "KILIT ILERLEMESI")}
          </p>
          <span className="font-mono text-[10px] text-purple-300/40">
            {Math.round(lockProgress)}%
          </span>
        </div>

        <div className="h-1.5 bg-slate-900 overflow-hidden rounded-sm">
          <div
            className="h-full bg-cyan-300 transition-all duration-100 rounded-sm"
            style={{ width: lockProgress + "%" }}
          />
        </div>

        {!isInLockRange && clarity > 15 && (
          <p className="mt-2 text-[10px] tracking-[0.12em] text-rose-300/65">
            {resolveText(t, "puzzle.echo.clarityHint", "NETLIGI %" + threshold + " UZERINE CIKAR")}
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        type="button"
        disabled={isSubmitting || !isIsolated}
        onClick={handleSubmit}
        className="w-full border border-emerald-300/45 bg-emerald-950/20 px-4 py-3 text-[11px] tracking-[0.22em] text-emerald-200 transition hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isSubmitting
          ? resolveText(t, "puzzle.common.submitting", "...")
          : isIsolated
          ? submitLabel
          : resolveText(t, "puzzle.echo.stabilizing", "IZOLE EDILIYOR...")}
      </button>
    </div>
  );
}

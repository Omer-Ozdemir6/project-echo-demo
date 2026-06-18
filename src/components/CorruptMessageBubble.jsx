import { useEffect, useRef, useState } from "react";

// ─────────────────────────────────────────────
// GLITCH CHARACTER POOL
// ─────────────────────────────────────────────

var GLITCH = "##########||||....~~~~::::::::::::::::";
var GLITCH_EXTRA = [
  "\u2588", "\u2593", "\u2592", "\u2591",
  "\u2562", "\u2557", "\u2563", "\u2551", "\u255D",
  "\u2510", "\u2514", "\u2534", "\u252C", "\u251C",
  "\u2500", "\u253C", "\u255A", "\u2554", "\u2569",
  "\u2550", "\u256C", "\u2518", "\u250C", "\u2502",
  "\u25A0", "\u25AA", "\u25B2", "\u25BC", "\u25C6",
  "\u25CF", "\u25CB", "\u25CC"
].join("");
var GLITCH_CHARS = GLITCH + GLITCH_EXTRA;

// ─────────────────────────────────────────────
// CSS INJECTION
// ─────────────────────────────────────────────

var STYLE_ID = "corrupt-bubble-styles";

function injectStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;

  var css = [
    // Border color cycling: rose → purple → cyan → amber
    "@keyframes cBorder{",
      "0%,100%{",
        "border-color:rgba(251,113,133,.5);",
        "box-shadow:0 0 14px rgba(251,113,133,.28),inset 0 0 8px rgba(251,113,133,.1)",
      "}",
      "25%{",
        "border-color:rgba(168,85,247,.7);",
        "box-shadow:0 0 22px rgba(168,85,247,.45),inset 0 0 14px rgba(168,85,247,.14)",
      "}",
      "50%{",
        "border-color:rgba(34,211,238,.38);",
        "box-shadow:0 0 10px rgba(34,211,238,.3),inset 0 0 6px rgba(34,211,238,.07)",
      "}",
      "75%{",
        "border-color:rgba(251,191,36,.6);",
        "box-shadow:0 0 18px rgba(251,191,36,.4),inset 0 0 10px rgba(251,191,36,.12)",
      "}",
    "}",

    // Main text occasional flicker/blackout
    "@keyframes cFlicker{",
      "0%,16%,18%,21%,51%,55%,100%{opacity:1}",
      "17%,22%{opacity:.04}",
      "19%{opacity:.8}",
      "52%,56%{opacity:.06}",
      "54%{opacity:.7}",
    "}",

    // Glitch: horizontal displacement with clip-path strips
    "@keyframes cGlitch{",
      "0%,75%,100%{clip-path:inset(0 0 100% 0);transform:translateX(0)}",
      "7%{clip-path:inset(15% 0 72% 0);transform:translateX(-6px)}",
      "14%{clip-path:inset(58% 0 28% 0);transform:translateX(7px)}",
      "21%{clip-path:inset(7% 0 85% 0);transform:translateX(-4px)}",
      "28%{clip-path:inset(80% 0 5% 0);transform:translateX(8px)}",
      "35%{clip-path:inset(42% 0 45% 0);transform:translateX(-7px)}",
      "42%{clip-path:inset(65% 0 22% 0);transform:translateX(5px)}",
      "49%{clip-path:inset(30% 0 55% 0);transform:translateX(-5px)}",
    "}",

    // RGB chromatic aberration
    "@keyframes cRgb{",
      "0%{text-shadow:2px 0 rgba(255,0,64,.9),-2px 0 rgba(0,255,200,.9)}",
      "33%{text-shadow:-3px 0 rgba(0,180,255,.8),3px 0 rgba(255,0,180,.8)}",
      "66%{text-shadow:2px 0 rgba(255,220,0,.7),-2px 0 rgba(80,0,255,.7)}",
      "100%{text-shadow:2px 0 rgba(255,0,64,.9),-2px 0 rgba(0,255,200,.9)}",
    "}",

    // Moving scan line top to bottom
    "@keyframes cScan{",
      "0%{top:-2px;opacity:.55}",
      "100%{top:100%;opacity:.12}",
    "}",

    // Source ID flicker
    "@keyframes cSourceId{",
      "0%,45%,47%,90%,100%{opacity:.6}",
      "46%,91%{opacity:.05}",
    "}"
  ].join("");

  var el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = css;
  document.head.appendChild(el);
}

// ─────────────────────────────────────────────
// TEXT CORRUPTION
// ─────────────────────────────────────────────

var INTENSITY_MAP = {
  light: 0.06,
  medium: 0.15,
  heavy: 0.33,
  extreme: 0.6
};

function corruptText(text, intensity) {
  var result = "";
  for (var i = 0; i < text.length; i++) {
    var ch = text[i];
    if (ch === " ") {
      result += ch;
    } else if (Math.random() < intensity) {
      result += GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
    } else {
      result += ch;
    }
  }
  return result;
}

// Fake corrupted source ID for display
var SOURCE_IDS = [
  "SRC: ██-■■",
  "SRC: [ERR]",
  "SRC: E-1█",
  "SRC: ????",
  "SRC: .....:",
  "SRC: UNKNOWN"
];

function randomSourceId() {
  return SOURCE_IDS[Math.floor(Math.random() * SOURCE_IDS.length)];
}

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

export default function CorruptMessageBubble(props) {
  var text = props.text || "";
  var level = props.level || "medium";

  var baseIntensity = INTENSITY_MAP[level] || 0.15;

  var isBurstingRef = useRef(false);
  var [displayText, setDisplayText] = useState(function() {
    return corruptText(text, baseIntensity);
  });
  var [sourceId, setSourceId] = useState("SRC: ██-■■");

  useEffect(function() {
    injectStyles();
  }, []);

  useEffect(function() {
    // Main corruption ticker
    var ticker = setInterval(function() {
      var intensity = isBurstingRef.current
        ? Math.min(0.95, baseIntensity * 5)
        : baseIntensity;
      setDisplayText(corruptText(text, intensity));
    }, 125);

    // Burst trigger: random heavy corruption spike
    var burster = setInterval(function() {
      if (Math.random() < 0.2) {
        isBurstingRef.current = true;
        setTimeout(function() {
          isBurstingRef.current = false;
        }, 200 + Math.random() * 600);
      }
    }, 1800);

    // Source ID flicker
    var sourceTicker = setInterval(function() {
      setSourceId(randomSourceId());
    }, 600 + Math.random() * 400);

    return function() {
      clearInterval(ticker);
      clearInterval(burster);
      clearInterval(sourceTicker);
    };
  }, [text, baseIntensity]);

  return (
    <div
      className="relative overflow-hidden border bg-slate-950/75"
      style={{ animation: "cBorder 3.2s infinite" }}
    >
      {/* CRT horizontal scanlines overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.14) 2px,rgba(0,0,0,0.14) 4px)"
        }}
        aria-hidden="true"
      />

      {/* Moving scan line */}
      <div
        className="pointer-events-none absolute left-0 right-0 z-20 h-px bg-white/22"
        style={{ animation: "cScan 2.2s linear infinite" }}
        aria-hidden="true"
      />

      {/* Source ID header */}
      <div
        className="border-b border-current px-3 py-1.5"
        style={{
          borderColor: "rgba(251,113,133,.25)",
          animation: "cSourceId 3s infinite"
        }}
      >
        <span className="font-mono text-[9px] tracking-[0.25em] text-rose-400/70">
          {sourceId} &nbsp;|&nbsp; SIGNAL CORRUPTED
        </span>
      </div>

      {/* Content area */}
      <div className="relative px-4 py-3">

        {/* RGB + clip glitch overlay */}
        <p
          className="pointer-events-none absolute left-0 right-0 top-0 select-none px-4 py-3 text-sm leading-6 text-rose-400 sm:text-base"
          style={{ animation: "cGlitch 6s infinite, cRgb 1.7s infinite" }}
          aria-hidden="true"
        >
          {displayText}
        </p>

        {/* Main text with flicker */}
        <p
          className="relative z-10 text-sm leading-6 text-rose-300 sm:text-base"
          style={{ animation: "cFlicker 5.5s infinite" }}
        >
          {displayText}
        </p>
      </div>

      {/* Screen-reader accessible original text */}
      <span className="sr-only">{text}</span>
    </div>
  );
}

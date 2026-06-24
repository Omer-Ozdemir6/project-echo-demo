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
    // Kenarlık döngüsü: Sığınak pas kırmızısından derin kehribara sismik geçişler
    "@keyframes cBorder{",
      "0%,100%{",
        "border-color:rgba(225,29,72,.35);",
        "box-shadow:0 0 14px rgba(225,29,72,.15),inset 0 0 8px rgba(225,29,72,.05);",
      "}",
      "50%{",
        "border-color:rgba(245,158,11,.25);",
        "box-shadow:0 0 10px rgba(245,158,11,.1),inset 0 0 6px rgba(245,158,11,.03);",
      "}",
    "}",

    // Ana metin parazit titremesi
    "@keyframes cFlicker{",
      "0%,16%,18%,21%,51%,55%,100%{opacity:1}",
      "17%,22%{opacity:.08}",
      "19%{opacity:.8}",
      "52%,56%{opacity:.1}",
      "54%{opacity:.7}",
    "}",

    // Sinyal kayması ve clip-path yırtılması
    "@keyframes cGlitch{",
      "0%,75%,100%{clip-path:inset(0 0 100% 0);transform:translateX(0)}",
      "7%{clip-path:inset(15% 0 72% 0);transform:translateX(-4px)}",
      "14%{clip-path:inset(58% 0 28% 0);transform:translateX(5px)}",
      "21%{clip-path:inset(7% 0 85% 0);transform:translateX(-2px)}",
      "28%{clip-path:inset(80% 0 5% 0);transform:translateX(4px)}",
      "35%{clip-path:inset(42% 0 45% 0);transform:translateX(-5px)}",
      "42%{clip-path:inset(65% 0 22% 0);transform:translateX(3px)}",
      "49%{clip-path:inset(30% 0 55% 0);transform:translateX(-3px)}",
    "}",

    // Derin analog sismik rezonans gölgesi (Kromatik sapma yerine analog taş paraziti)
    "@keyframes cRgb{",
      "0%{text-shadow:1.5px 0 rgba(225,29,72,.75),-1.5px 0 rgba(245,158,11,.3);}",
      "50%{text-shadow:-2px 0 rgba(245,158,11,.5),2px 0 rgba(225,29,72,.6);}",
      "100%{text-shadow:1.5px 0 rgba(225,29,72,.75),-1.5px 0 rgba(245,158,11,.3);}",
    "}",

    // Sinyal tarama çizgisinin yukarıdan aşağıya akışı
    "@keyframes cScan{",
      "0%{top:-2px;opacity:.3}",
      "100%{top:100%;opacity:.05}",
    "}",

    // Kaynak ID titremesi
    "@keyframes cSourceId{",
      "0%,45%,47%,90%,100%{opacity:.5}",
      "46%,91%{opacity:.1}",
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

// Bozunmuş yeraltı istasyon / rezonans blok kodları
var SOURCE_IDS = [
  "HAT: 🜁_■■",
  "FREKANS: [BOZUK]",
  "BLOK: K-1█",
  "DİZİN: ????",
  "REZONANS: ...:",
  "SİNYAL: MEÇHUL"
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
  var [sourceId, setSourceId] = useState("HAT: 🜁_■■");

  useEffect(function() {
    injectStyles();
  }, []);

  useEffect(function() {
    // Ana parazit tetikleyicisi
    var ticker = setInterval(function() {
      var intensity = isBurstingRef.current
        ? Math.min(0.92, baseIntensity * 4.5)
        : baseIntensity;
      setDisplayText(corruptText(text, intensity));
    }, 130);

    // Ani sismik dalgalanma patlamaları
    var burster = setInterval(function() {
      if (Math.random() < 0.22) {
        isBurstingRef.current = true;
        setTimeout(function() {
          isBurstingRef.current = false;
        }, 180 + Math.random() * 500);
      }
    }, 1900);

    // Sinyal ID yanıp sönmesi
    var sourceTicker = setInterval(function() {
      setSourceId(randomSourceId());
    }, 700 + Math.random() * 400);

    return function() {
      clearInterval(ticker);
      clearInterval(burster);
      clearInterval(sourceTicker);
    };
  }, [text, baseIntensity]);

  return (
    <div
      className="relative overflow-hidden border bg-neutral-950 font-mono rounded-xs"
      style={{ animation: "cBorder 3.5s infinite" }}
    >
      {/* Telsiz parazit perdeleri overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.2) 2px,rgba(0,0,0,0.2) 4px)"
        }}
        aria-hidden="true"
      />

      {/* Hareketli analog tarama çizgisi */}
      <div
        className="pointer-events-none absolute left-0 right-0 z-20 h-px bg-stone-800/45"
        style={{ animation: "cScan 2.5s linear infinite" }}
        aria-hidden="true"
      />

      {/* Üst İstasyon/Sinyal Başlığı */}
      <div
        className="border-b border-stone-900 px-3 py-1.5"
        style={{ animation: "cSourceId 3.2s infinite" }}
      >
        <span className="font-mono text-[9px] tracking-widest font-black text-rose-700/80 uppercase">
          {sourceId} &nbsp;|&nbsp; REZONANS_KAYBI
        </span>
      </div>

      {/* Mesaj İçerik Alanı */}
      <div className="relative px-3.5 py-2.5">

        {/* Rezonans ve yırtılma katmanı */}
        <p
          className="pointer-events-none absolute left-0 right-0 top-0 select-none px-3.5 py-2.5 text-xs leading-relaxed tracking-wide text-rose-700/70"
          style={{ animation: "cGlitch 5s infinite, cRgb 2s infinite" }}
          aria-hidden="true"
        >
          {displayText}
        </p>

        {/* Parazitli Titrek Ana Metin */}
        <p
          className="relative z-10 text-xs leading-relaxed tracking-wide text-rose-600 font-bold"
          style={{ animation: "cFlicker 6s infinite" }}
        >
          {displayText}
        </p>
      </div>

      {/* Ekran okuyucular için orijinal metin */}
      <span className="sr-only">{text}</span>
    </div>
  );
}
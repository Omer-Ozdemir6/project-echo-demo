import { useEffect, useState } from "react";

var STYLE_ID = "pl-styles";

function injectStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  var el = document.createElement("style");
  el.id = STYLE_ID;
  var css = "";
  css += "@keyframes plIn{from{opacity:0}to{opacity:1}}";
  css += "@keyframes plOut{from{opacity:1}to{opacity:0}}";
  css += "@keyframes plShift{";
  css += "0%,68%,100%{transform:translate(0,0)}";
  css += "69%{transform:translate(-9px,1px)}";
  css += "72%{transform:translate(12px,-1px)}";
  css += "75%{transform:translate(-7px,0)}";
  css += "78%{transform:translate(9px,1px)}";
  css += "81%{transform:translate(-4px,0)}";
  css += "84%{transform:translate(0,0)}}";
  css += "@keyframes plFlicker{";
  css += "0%,15%,17%,20%,88%,100%{opacity:1}";
  css += "16%,21%{opacity:.08}";
  css += "18%{opacity:.75}";
  css += "89%,92%{opacity:.05}";
  css += "90%{opacity:.9}}";
  css += "@keyframes plScan{0%{top:-3px;opacity:.55}100%{top:100%;opacity:.04}}";
  css += "@keyframes plRed{";
  css += "0%,60%,100%{clip-path:inset(0 0 100% 0);transform:translateX(0)}";
  css += "61%{clip-path:inset(12% 0 70% 0);transform:translateX(-7px)}";
  css += "65%{clip-path:inset(55% 0 30% 0);transform:translateX(9px)}";
  css += "69%{clip-path:inset(5% 0 88% 0);transform:translateX(-5px)}";
  css += "73%{clip-path:inset(78% 0 6% 0);transform:translateX(8px)}";
  css += "77%{clip-path:inset(38% 0 48% 0);transform:translateX(-6px)}}";
  css += "@keyframes plCyan{";
  css += "0%,55%,100%{clip-path:inset(0 0 100% 0);transform:translateX(0)}";
  css += "56%{clip-path:inset(30% 0 52% 0);transform:translateX(6px)}";
  css += "60%{clip-path:inset(68% 0 18% 0);transform:translateX(-8px)}";
  css += "64%{clip-path:inset(10% 0 82% 0);transform:translateX(5px)}";
  css += "68%{clip-path:inset(85% 0 3% 0);transform:translateX(-7px)}";
  css += "72%{clip-path:inset(42% 0 44% 0);transform:translateX(6px)}}";
  el.textContent = css;
  document.head.appendChild(el);
}

export default function ProducerLogoAnimation(props) {
  var src = props.src || "/red-door-logo.jpg";
  var alt = props.alt || "";
  var onComplete = props.onComplete;

  var glitchState = useState(true);
  var glitchActive = glitchState[0];
  var setGlitchActive = glitchState[1];

  var leavingState = useState(false);
  var leaving = leavingState[0];
  var setLeaving = leavingState[1];

  useEffect(function () {
    injectStyles();

    var t1 = setTimeout(function () { setGlitchActive(false); }, 1900);
    var t2 = setTimeout(function () { setLeaving(true); }, 2500);
    var t3 = setTimeout(function () { if (onComplete) onComplete(); }, 3300);

    return function () {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  var outerAnim = leaving ? "plOut 0.8s ease-in forwards" : "plIn 0.8s ease-out forwards";
  var innerAnim = glitchActive ? "plShift 0.9s steps(1) infinite, plFlicker 2.8s ease-out forwards" : "";

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-black">

      {glitchActive && (
        <div
          className="pointer-events-none absolute left-0 right-0 z-10"
          style={{ height: 2, animation: "plScan 1.2s linear infinite" }}
          aria-hidden="true"
        />
      )}

      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          opacity: 0.035,
          backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,0.9) 3px,rgba(255,255,255,0.9) 4px)"
        }}
        aria-hidden="true"
      />

      <div style={{ animation: outerAnim }}>
        <div
          className="relative w-56 sm:w-72"
          style={{ animation: innerAnim || undefined }}
        >
          {glitchActive && (
            <img
              src={src}
              className="absolute inset-0 w-full max-w-[70vw] object-contain pointer-events-none select-none"
              style={{
                filter: "sepia(1) saturate(8) hue-rotate(315deg) brightness(2)",
                mixBlendMode: "screen",
                opacity: 0.55,
                animation: "plRed 0.7s steps(1) infinite"
              }}
              draggable={false}
              aria-hidden="true"
            />
          )}

          {glitchActive && (
            <img
              src={src}
              className="absolute inset-0 w-full max-w-[70vw] object-contain pointer-events-none select-none"
              style={{
                filter: "sepia(1) saturate(8) hue-rotate(155deg) brightness(2)",
                mixBlendMode: "screen",
                opacity: 0.55,
                animation: "plCyan 0.7s steps(1) infinite"
              }}
              draggable={false}
              aria-hidden="true"
            />
          )}

          <img
            src={src}
            alt={alt}
            className="relative w-56 max-w-[70vw] object-contain sm:w-72"
            draggable={false}
          />
        </div>
      </div>

    </main>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";

// ─────────────────────────────────────────────
// STYLE INJECTION
// ─────────────────────────────────────────────

var TERMINAL_STYLE_ID = "terminal-interface-styles";

function injectTerminalStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(TERMINAL_STYLE_ID)) return;
  var el = document.createElement("style");
  el.id = TERMINAL_STYLE_ID;
  el.textContent = [
    "@keyframes termCursor{0%,100%{opacity:1}50%{opacity:0}}",
    "@keyframes termBoot{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}",
    "@keyframes termGlitch{0%,90%,100%{transform:translateX(0)}91%{transform:translateX(-3px)}93%{transform:translateX(4px)}95%{transform:translateX(-2px)}97%{transform:translateX(3px)}}"
  ].join("");
  document.head.appendChild(el);
}

// ─────────────────────────────────────────────
// CORRUPTION
// ─────────────────────────────────────────────

var GLITCH_CHARS = "#|.~<>:=+*^░▒▓│┤╣║╗╝┐└┴┬├─┼╚╔╩╦╠═╬┘┌█▄▌▐▀■";

function corruptLine(text, intensity) {
  var result = "";
  for (var i = 0; i < text.length; i++) {
    var ch = text[i];
    if (ch === " ") { result += ch; continue; }
    result += Math.random() < intensity
      ? GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
      : ch;
  }
  return result;
}

// ─────────────────────────────────────────────
// LINE COMPONENT
// ─────────────────────────────────────────────

var LINE_CLASSES = {
  header:  "text-green-300 font-bold tracking-[0.18em] text-[11px]",
  system:  "text-green-200/65 text-[11px]",
  input:   "text-green-400 text-[11px]",
  output:  "text-green-100/85 text-[11px]",
  error:   "text-red-400 text-[11px]",
  warning: "text-amber-300 text-[11px]",
  file:    "text-cyan-300 text-[11px]",
  locked:  "text-amber-200/55 text-[11px]",
  boot:    "text-green-300/50 text-[11px]",
  secret:  "text-violet-300 text-[11px]"
};

function TerminalLine(props) {
  var text = props.text;
  var type = props.type;
  var corruptionLevel = props.corruptionLevel || 0;

  var [displayText, setDisplayText] = useState(text);

  useEffect(function() {
    if (corruptionLevel <= 0) { setDisplayText(text); return; }
    var interval = setInterval(function() {
      setDisplayText(Math.random() < 0.35 ? corruptLine(text, corruptionLevel) : text);
    }, 180);
    return function() { clearInterval(interval); };
  }, [text, corruptionLevel]);

  if (type === "spacer") return <div style={{ height: 8 }} />;
  if (type === "divider") return (
    <div className="border-t border-green-500/15 my-2" />
  );

  var cls = (LINE_CLASSES[type] || LINE_CLASSES.output) + " font-mono leading-5 whitespace-pre-wrap break-all";

  return <div className={cls}>{displayText}</div>;
}

// ─────────────────────────────────────────────
// MAIN TERMINAL
// ─────────────────────────────────────────────

export default function TerminalInterface(props) {
  var terminal    = props.terminal || {};
  var gameState   = props.gameState || {};
  var onExit      = props.onExit;
  var onCollectFile = props.onCollectFile;

  var echoProximity = (gameState.stats && gameState.stats.echoProximity) || 0;
  var corruptionLevel =
    echoProximity > 80 ? 0.28 :
    echoProximity > 60 ? 0.11 :
    echoProximity > 40 ? 0.04 : 0;

  var [lines, setLines] = useState([]);
  var [inputValue, setInputValue] = useState("");
  var [cmdHistory, setCmdHistory] = useState([]);
  var [historyIdx, setHistoryIdx] = useState(-1);
  var [isBooting, setIsBooting] = useState(true);
  var [isProcessing, setIsProcessing] = useState(false);

  var inputRef = useRef(null);
  var endRef   = useRef(null);

  useEffect(function() { injectTerminalStyles(); }, []);

  var addLine = useCallback(function(text, type) {
    var lineType = type || "output";
    setLines(function(prev) {
      return prev.concat([{ text: text, type: lineType, id: Date.now() + Math.random() }]);
    });
  }, []);

  // Boot sequence
  useEffect(function() {
    var bootLines = Array.isArray(terminal.bootLines) ? terminal.bootLines : [];
    var sequence = [
      { text: terminal.header || "PROJE EKO // TESİS YÖNETİM SİSTEMİ", type: "header" },
      { text: "", type: "spacer" }
    ].concat(
      bootLines.map(function(l) { return { text: l, type: "boot" }; })
    ).concat([
      { text: "", type: "spacer" },
      { text: "Komutlari listelemek icin 'help' yaz.", type: "system" },
      { text: "", type: "spacer" }
    ]);

    var i = 0;
    var timer = setInterval(function() {
      if (i >= sequence.length) {
        setIsBooting(false);
        clearInterval(timer);
        if (inputRef.current) inputRef.current.focus();
        return;
      }
      var line = sequence[i];
      setLines(function(prev) {
        return prev.concat([{ text: line.text, type: line.type, id: Date.now() + i }]);
      });
      i++;
    }, 110);

    return function() { clearInterval(timer); };
  }, [terminal]);

  // Auto-scroll
  useEffect(function() {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  function processCommand(raw) {
    var cmd = raw.trim();
    if (!cmd) return;

    var cmdLower = cmd.toLowerCase();

    setCmdHistory(function(prev) { return [cmd].concat(prev); });
    setHistoryIdx(-1);

    // Echo to output
    addLine((terminal.prompt || "E-17@NODE:~$") + " " + cmd, "input");

    // Built-in: clear
    if (cmdLower === "clear") {
      setLines([]);
      return;
    }

    // Built-in: exit
    if (cmdLower === (terminal.exitCommand || "exit").toLowerCase()) {
      addLine("Baglanti kesiliyor...", "system");
      setTimeout(function() { if (onExit) onExit(); }, 1200);
      return;
    }

    // Built-in: help
    if (cmdLower === "help") {
      var cmds = Object.keys(terminal.commands || {});
      addLine("Kullanilabilir komutlar:", "system");
      cmds.forEach(function(c) { addLine("  " + c, "output"); });
      addLine("  clear", "output");
      addLine("  exit", "output");
      return;
    }

    // Registered commands (case-insensitive match)
    var commands = terminal.commands || {};
    var matchKey = null;
    var keys = Object.keys(commands);
    for (var k = 0; k < keys.length; k++) {
      if (keys[k].toLowerCase() === cmdLower) {
        matchKey = keys[k];
        break;
      }
    }

    if (matchKey) {
      var def = commands[matchKey];
      setIsProcessing(true);

      setTimeout(function() {
        var outputLines = Array.isArray(def.output) ? def.output : [def.output || ""];
        var lineType = def.type || "output";
        outputLines.forEach(function(l) { addLine(l, lineType); });

        if (def.dividerAfter) addLine("", "divider");

        if (def.collectFile && onCollectFile) {
          onCollectFile(def.collectFile, def.fileData);
          addLine("[DOSYA ARSİVLENDİ: " + def.collectFile + "]", "file");
        }

        if (def.unlockCommands && Array.isArray(def.unlockCommands)) {
          def.unlockCommands.forEach(function(newCmd) {
            if (!commands[newCmd]) {
              commands[newCmd] = { output: "[ERİSİM ACILDI]", type: "system" };
            }
          });
        }

        setIsProcessing(false);
      }, def.delay || 220);

      return;
    }

    // Locked commands
    var locked = terminal.lockedCommands || {};
    var lockedKey = null;
    var lockedKeys = Object.keys(locked);
    for (var lk = 0; lk < lockedKeys.length; lk++) {
      if (lockedKeys[lk].toLowerCase() === cmdLower) {
        lockedKey = lockedKeys[lk];
        break;
      }
    }

    if (lockedKey) {
      var lockedDef = locked[lockedKey];
      addLine(lockedDef.output || "[ERİSİM REDDEDİLDİ]", "locked");
      return;
    }

    // Unknown
    addLine("Bilinmeyen komut: '" + cmd + "'", "error");
    addLine("'help' yaz.", "system");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      processCommand(inputValue);
      setInputValue("");
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      var newIdx = Math.min(historyIdx + 1, cmdHistory.length - 1);
      setHistoryIdx(newIdx);
      if (cmdHistory[newIdx] != null) setInputValue(cmdHistory[newIdx]);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      var downIdx = Math.max(historyIdx - 1, -1);
      setHistoryIdx(downIdx);
      setInputValue(downIdx === -1 ? "" : (cmdHistory[downIdx] || ""));
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      // Simple autocomplete: find first matching command
      var commands = terminal.commands || {};
      var allCmds = Object.keys(commands).concat(["help", "clear", "exit"]);
      var partial = inputValue.toLowerCase();
      if (!partial) return;
      var match = allCmds.find(function(c) { return c.toLowerCase().startsWith(partial); });
      if (match) setInputValue(match);
    }
  }

  var corruptedGlitch = corruptionLevel > 0.1;

  return (
    <div
      className="mt-4 bg-black border border-green-500/20 shadow-[0_0_28px_rgba(34,197,94,0.07)] cursor-text select-none"
      style={{ animation: corruptedGlitch ? "termGlitch 6s infinite" : "none" }}
      onClick={function() { if (inputRef.current) inputRef.current.focus(); }}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 border-b border-green-500/12 px-4 py-2 bg-green-950/20">
        <span className="h-2 w-2 rounded-full bg-red-500/60" />
        <span className="h-2 w-2 rounded-full bg-amber-500/60" />
        <span className="h-2 w-2 rounded-full bg-green-500/60" />
        <span className="ml-2 font-mono text-[9px] tracking-[0.28em] text-green-300/35">
          {terminal.sessionLabel || "PROJE EKO // TESİS TERMINALI"}
        </span>
        {echoProximity > 40 && (
          <span className="ml-auto font-mono text-[9px] tracking-[0.18em] text-red-400/65" style={{ animation: "termCursor 1.2s infinite" }}>
            EKO: {echoProximity}%
          </span>
        )}
      </div>

      {/* Output area */}
      <div className="h-56 overflow-y-auto px-4 py-3 space-y-0 terminal-scrollbar"
           style={{ scrollbarColor: "rgba(34,197,94,0.2) transparent" }}>
        {lines.map(function(line) {
          return (
            <TerminalLine
              key={line.id}
              text={line.text}
              type={line.type}
              corruptionLevel={corruptionLevel}
            />
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Input area */}
      <div className="flex items-center gap-2 border-t border-green-500/12 px-4 py-2.5 bg-green-950/10">
        {isBooting ? (
          <span className="font-mono text-xs text-green-300/30" style={{ animation: "termCursor 1s infinite" }}>
            yukluyor...
          </span>
        ) : (
          <>
            <span className="font-mono text-xs text-green-400/50 shrink-0">
              {terminal.prompt || "E-17@NODE:~$"}
            </span>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={function(e) { setInputValue(e.target.value); }}
              onKeyDown={handleKeyDown}
              disabled={isProcessing}
              className="flex-1 bg-transparent font-mono text-xs text-green-100 outline-none disabled:opacity-40"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              style={{ caretColor: "#4ade80" }}
            />
            <span
              className="font-mono text-xs text-green-400 shrink-0"
              style={{ animation: isProcessing ? "none" : "termCursor 1s infinite", opacity: isProcessing ? 0.2 : 1 }}
            >
              {isProcessing ? "..." : "█"}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

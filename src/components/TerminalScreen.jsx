import { useEffect, useState } from "react";
import { getGameText } from "../i18n/gameText";

import MessageFeed from "./MessageFeed";
import ChoicePanel from "./ChoicePanel";
import PuzzleRenderer from "./puzzles/PuzzleRenderer";
import DataBankModal from "./DataBankModal";
import FileViewerModal from "./FileViewerModal";
import SignalOverlay from "./SignalOverlay";
import SettingsModal from "./SettingsModal";
import ProgressTaskModal from "./ProgressTaskModal";
import DecodeFileModal from "./DecodeFileModal";
import { playSound } from "../audio/soundManager";
import { filterChoices } from "../engine/choiceFilter";

export default function TerminalScreen({
  config,
  gameState,
  currentNode,
  visibleMessages,
  isTyping,
  isGlitching,
  signalStatus,
  progressTask,
  canShowChoices,
  activePuzzle,
  onChoice,
  onPuzzleSubmit,
  settings,
  onChangeSettings,
  onFileRead,
  onReset
}) {
  const [activeFile, setActiveFile] = useState(null);
  const [isDataBankOpen, setIsDataBankOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [decodeFile, setDecodeFile] = useState(null);
  const [isPuzzleMinimized, setIsPuzzleMinimized] = useState(false);

  const language = settings?.language || "en";
  const isPuzzleActive = Boolean(activePuzzle);

  const busyState = gameState?.busyState || null;
  const isBusyActive = Boolean(busyState?.busyUntil) && Date.now() < busyState.busyUntil;

  const busyCharacter = busyState?.character || "UNKNOWN";
  const busyStatus = busyState?.status || "UNAVAILABLE";

  const busyTitle = busyState?.displayText || busyState?.message || `[${busyCharacter} ${busyStatus}]`;

  const terminalTitle = getGameText(
    config?.terminalTitleKey,
    config?.terminalTitle || "ECHO COMMAND",
    language
  );

  const terminalSubtitle = getGameText(
    config?.terminalSubtitleKey,
    config?.terminalSubtitle || "REMOTE OPERATIONS TERMINAL",
    language
  );

  const collectedFiles = gameState.collectedFiles || [];
  const unreadFileCount = collectedFiles.filter((file) => file.isNew).length;

  const connectionLabel = getGameText("status.connection", language === "tr" ? "BAĞLANTI" : "LINK", language);
  const signalLabel = getGameText("status.signal", language === "tr" ? "SİNYAL" : "SIGNAL", language);

  const connectionValue =
    signalStatus?.type === "lost"
      ? getGameText("status.lost", language === "tr" ? "KOPTU" : "LOST", language)
      : getGameText("status.active", language === "tr" ? "AKTİF" : "ACTIVE", language);

  const baseSignal = Number(gameState.signalStrength ?? 96);

  const signalValue =
    signalStatus?.type === "lost"
      ? 5
      : isGlitching
        ? Math.max(5, Math.min(baseSignal, 18))
        : progressTask || isBusyActive
          ? Math.max(20, Math.min(baseSignal, 62))
          : clampSignal(baseSignal);

  const signalMeta = getSignalMeta(signalValue);
  const signalBar = getSignalBar(signalValue);

  const visibleChoices = canShowChoices ? filterChoices(gameState, currentNode?.choices || []) : [];

  function clampSignal(value) {
    const number = Number(value);
    if (Number.isNaN(number)) return 96;
    return Math.max(5, Math.min(100, number));
  }

  function handlePuzzleSubmit(value) {
    playSound("puzzleSubmit", settings);
    onPuzzleSubmit?.(value);
  }

  function getSignalMeta(value) {
    const safeValue = clampSignal(value);
    if (safeValue >= 80) {
      return { icon: "🟢", label: "STABLE", className: "text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.3)]" };
    }
    if (safeValue >= 50) {
      return { icon: "🟡", label: "DEGRADED", className: "text-amber-400 opacity-80" };
    }
    if (safeValue >= 20) {
      return { icon: "🟠", label: "CRITICAL", className: "text-orange-500 font-bold animate-pulse" };
    }
    return { icon: "🔴", label: "COLLAPSE", className: "text-rose-500 font-black animate-[errorPulse_0.3s_infinite]" };
  }

  function getSignalBar(value) {
    const safeValue = clampSignal(value);
    const filled = Math.max(1, Math.round(safeValue / 10));
    return "█".repeat(filled) + "░".repeat(10 - filled);
  }

  useEffect(() => {
    if (signalStatus?.type === "lost") playSound("signalLost", settings);
    if (signalStatus?.type === "restored") playSound("signalRestored", settings);
  }, [signalStatus, settings]);

  useEffect(() => {
    if (isPuzzleActive) setIsPuzzleMinimized(false);
  }, [activePuzzle?.id, isPuzzleActive]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isPuzzleActive && !isPuzzleMinimized) {
        setIsPuzzleMinimized(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPuzzleActive, isPuzzleMinimized]);

  useEffect(() => {
    if (isPuzzleActive && !isPuzzleMinimized) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isPuzzleActive, isPuzzleMinimized]);

  function handleOpenDataBankFile(file) {
    const shouldDecode = file.isNew;
    onFileRead?.(file.id);
    const openedFile = { ...file, isNew: false };
    if (shouldDecode) {
      setDecodeFile(openedFile);
      return;
    }
    setActiveFile(openedFile);
  }

  const getDynamicGlow = () => {
    if (signalStatus?.type === "lost" || signalValue < 20) {
      return "bg-[radial-gradient(circle_at_center,rgba(225,29,72,0.07),transparent_65%)]";
    }
    return "bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.03),transparent_55%)]";
  };

  return (
    <main
      className={[
        "relative h-dvh overflow-hidden bg-black px-3 py-3 text-cyan-50 font-mono select-none transition-all duration-500",
        "sm:px-5 sm:py-5",
        "before:pointer-events-none before:fixed before:inset-0",
        "before:bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.012),rgba(255,255,255,0.012)_1px,transparent_1px,transparent_5px)]",
        "before:mix-blend-overlay before:z-50",
        isGlitching || signalStatus?.type === "lost" ? "animate-[screenGlitch_0.15s_infinite]" : ""
      ].join(" ")}
    >
      <div className={`pointer-events-none fixed inset-0 transition-all duration-700 ${getDynamicGlow()}`} />

      {(isGlitching || signalStatus?.type === "lost") && (
        <div className="noise-overlay opacity-15" />
      )}

      <section
        className={[
          "relative z-10 mx-auto flex h-full w-full max-w-3xl flex-col overflow-hidden transition-all duration-300",
          "bg-neutral-950/95 p-3 sm:p-5 border",
          signalStatus?.type === "lost" || signalValue < 20
            ? "border-rose-950 shadow-[0_0_50px_rgba(225,29,72,0.06)]"
            : "border-cyan-950/40 shadow-[0_0_40px_rgba(34,211,238,0.03)]"
        ].join(" ")}
      >
        <div className="shrink-0">
          <header className="mb-4 border-b border-neutral-900 pb-4">
            <div className="grid grid-cols-[auto_1fr_auto] items-start gap-4">
              
              {/* SOL BUTON: Veri Bankası */}
              <button
                type="button"
                className={[
                  "relative border border-cyan-950 bg-neutral-900/40 px-3 py-2 text-[10px] font-bold tracking-[0.2em]",
                  "transition-all duration-300 active:scale-95",
                  unreadFileCount > 0 
                    ? "border-rose-700 text-rose-400 animate-pulse bg-rose-950/10" 
                    : "border-cyan-950 text-cyan-400/80 hover:border-cyan-600 hover:text-white"
                ].join(" ")}
                onClick={() => {
                  playSound("uiClick", settings);
                  setIsDataBankOpen(true);
                }}
              >
                DATA {unreadFileCount > 0 ? `(${unreadFileCount})` : ""}
                {unreadFileCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]" />
                )}
              </button>

              {/* ORTA: Terminal Klinik Başlıkları */}
              <div className="min-w-0 text-center">
                <h1 className={`m-0 truncate text-sm sm:text-base font-black tracking-[0.35em] transition-colors duration-500 ${signalValue < 20 ? 'text-rose-500' : 'text-cyan-400'}`}>
                  {terminalTitle}
                </h1>
                <p className="mt-1 truncate text-[10px] tracking-widest text-neutral-500 uppercase">
                  {terminalSubtitle}
                </p>
              </div>

              {/* SAĞ BUTON GRUBU: Ayarlar ve Reset (Spinner kaldırıldı) */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    playSound("uiClick", settings);
                    setIsSettingsOpen(true);
                  }}
                  className="grid h-8 w-8 place-items-center border border-neutral-900 bg-neutral-900/20 text-xs text-neutral-400 transition hover:border-cyan-800 hover:text-white"
                  aria-label="Open settings"
                >
                  ⚙
                </button>

                <button
                  type="button"
                  onClick={onReset}
                  className="border border-rose-950 bg-transparent px-2.5 py-1.5 text-[10px] tracking-[0.18em] text-rose-700 font-bold transition hover:border-rose-600 hover:bg-rose-950/10 hover:text-rose-400"
                >
                  RESET
                </button>
              </div>
            </div>
          </header>

          {/* Sinyal ve Bağlantı Çubukları */}
          <div className="mb-4 grid grid-cols-2 gap-2 text-left">
            <span className="border border-neutral-900 bg-neutral-950/40 p-2 text-[10px] tracking-wider text-neutral-500">
              {connectionLabel}:{" "}
              <strong className={signalStatus?.type === "lost" ? "text-rose-500 font-bold" : "text-cyan-400"}>
                {connectionValue}
              </strong>
            </span>

            <span className="border border-neutral-900 bg-neutral-950/40 p-2 text-[10px] tracking-wider text-neutral-500">
              {signalLabel}:{" "}
              <strong className={signalMeta.className}>
                %{signalValue} {signalMeta.label} <span className="font-mono tracking-normal ml-1 opacity-70">[{signalBar}]</span>
              </strong>
            </span>
          </div>
        </div>

        {/* Mesaj Akış Penceresi */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <MessageFeed
            speaker={currentNode?.speaker}
            messages={visibleMessages}
            isTyping={isTyping}
            onOpenFile={setActiveFile}
            language={language}
            settings={settings}
            hasBottomPanel={canShowChoices || isPuzzleActive || isBusyActive}
          />
        </div>

        {/* Karakter Meşgul/Görevde Paneli */}
        {isBusyActive && (
          <div className="shrink-0 border-t border-neutral-900 bg-neutral-950 pt-3">
            <div className="border border-amber-950 bg-amber-950/5 px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-[10px] tracking-[0.2em] text-amber-500 font-bold uppercase">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                <span>{busyTitle}</span>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
                {getGameText(
                  "busy.description",
                  language === "tr"
                    ? "Karakter işlem gerçekleştiriyor. Eski iletileri inceleyebilir veya veri bankasını açabilirsiniz."
                    : "The character is executing a process. You can review previous transmissions or open the Data Bank.",
                  language
                )}
              </p>
            </div>
          </div>
        )}

        {/* Aktif Bulmaca Minimize Bildirimi */}
        {isPuzzleActive && isPuzzleMinimized && (
          <div className="shrink-0 border-t border-neutral-900 bg-neutral-950 pt-3">
            <button
              className="w-full border border-amber-900/40 bg-amber-950/5 px-4 py-3 text-xs font-bold tracking-widest text-amber-500/80 transition hover:bg-amber-950/10 active:scale-[0.99]"
              onClick={() => setIsPuzzleMinimized(false)}
            >
              🧩 {getGameText("puzzle.paused", language === "tr" ? "AKTİF VERİ BULMACASI — İLETİM ASKIYA ALINDI" : "ACTIVE PUZZLE — TRANSMISSION SUSPENDED", language)}
            </button>
          </div>
        )}

        {/* Seçim Paneli Katmanı */}
        {canShowChoices && !isPuzzleActive && !progressTask && (
          <div className="shrink-0 border-t border-neutral-900 bg-neutral-950 pt-3">
            <ChoicePanel
              choices={visibleChoices}
              onChoice={onChoice}
              settings={settings}
              language={language}
            />
          </div>
        )}
      </section>

      {/* Modallar ve Modüller */}
      {progressTask && !isBusyActive && <ProgressTaskModal task={progressTask} />}

      {isDataBankOpen && (
        <DataBankModal
          files={collectedFiles}
          onOpenFile={handleOpenDataBankFile}
          onFileRead={onFileRead}
          onClose={() => setIsDataBankOpen(false)}
        />
      )}

      <DecodeFileModal
        file={decodeFile}
        onComplete={(file) => {
          setDecodeFile(null);
          setActiveFile(file);
        }}
        onClose={() => setDecodeFile(null)}
      />

      <FileViewerModal file={activeFile} settings={settings} onClose={() => setActiveFile(null)} />
      <SignalOverlay status={signalStatus} />

      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onChangeSettings={onChangeSettings}
          onReset={onReset}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* TAM EKRAN BULMACA MODÜLÜ */}
      {isPuzzleActive && !isPuzzleMinimized && (
        <div className="fixed inset-0 z-[9999] bg-black animate-[fadeIn_0.25s_ease-out] font-mono select-none">
          <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(225,29,72,0.04),transparent_70%)]" />
          {crtOverlay}
          <div className="flex h-full flex-col p-4 sm:p-6 mx-auto max-w-3xl">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-4 mb-4">
              <div className="text-rose-500 font-black tracking-[0.25em] text-xs uppercase animate-pulse">
                ☠ {getGameText("puzzle.active", language === "tr" ? "KRİTİK VERİ BARIYERI" : "CRITICAL DATA COGNITIVE BARRIER", language)}
              </div>

              <button
                className="border border-neutral-800 bg-neutral-900/20 px-3 py-1.5 text-[10px] font-bold text-neutral-400 tracking-widest uppercase transition hover:border-cyan-800 hover:text-white"
                onClick={() => setIsPuzzleMinimized(true)}
              >
                {getGameText("puzzle.minimize", language === "tr" ? "BEYİN DALGASINI SİMGE DURUMUNA GETİR" : "MINIMIZE LINK", language)}
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              <PuzzleRenderer
                puzzle={activePuzzle}
                attempts={gameState.puzzleAttempts?.[activePuzzle.id] || 0}
                onSubmit={handlePuzzleSubmit}
                language={language}
                gameState={gameState}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
import { useState } from "react";
import { getGameText } from "../i18n/gameText";

import MessageFeed from "./MessageFeed";
import ChoicePanel from "./ChoicePanel";
import PuzzleRenderer from "./puzzles/PuzzleRenderer";
import DataBankModal from "./DataBankModal";
import FileViewerModal from "./FileViewerModal";
import SignalOverlay from "./SignalOverlay";
import SettingsModal from "./SettingsModal";
import ProgressTaskModal from "./ProgressTaskModal";

function getStatusLevel(value, type = "normal") {
  const safeValue = Number(value) || 0;

  if (type === "danger") {
    if (safeValue >= 80) return "CRITICAL";
    if (safeValue >= 60) return "HIGH";
    if (safeValue >= 35) return "ELEVATED";
    return "LOW";
  }

  if (safeValue >= 80) return "STRONG";
  if (safeValue >= 60) return "STABLE";
  if (safeValue >= 35) return "LOW";
  return "CRITICAL";
}

function getStatusClass(level) {
  if (level === "STRONG" || level === "LOW") return "text-emerald-200";
  if (level === "STABLE" || level === "ELEVATED") return "text-cyan-200";
  if (level === "HIGH") return "text-amber-200";
  return "text-rose-300";
}

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

  const language = settings?.language || "en";

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

  const statusLink = getGameText(
    config?.statusLabels?.linkKey,
    config?.statusLabels?.link || "LINK: ACTIVE",
    language
  );

  const statusSignal = getGameText(
    config?.statusLabels?.signalKey,
    config?.statusLabels?.signal || "SIGNAL: 38%",
    language
  );

  const collectedFiles = gameState.collectedFiles || [];
  const unreadFileCount = collectedFiles.filter((file) => file.isNew).length;
  const canInteract = !isTyping && !isGlitching && !signalStatus && !progressTask;

  const trustLevel = getStatusLevel(gameState.trust);
  const moraleLevel = getStatusLevel(gameState.morale);
  const dangerLevel = getStatusLevel(gameState.danger, "danger");

  function handleOpenDataBankFile(file) {
    onFileRead?.(file.id);
    setActiveFile({
      ...file,
      isNew: false
    });
  }

  return (
    <main
      className={[
        "relative h-dvh overflow-hidden bg-slate-950 px-3 py-3 text-cyan-50",
        "sm:px-5 sm:py-5",
        "before:pointer-events-none before:fixed before:inset-0",
        "before:bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.04),rgba(255,255,255,0.04)_1px,transparent_1px,transparent_5px)]",
        "before:mix-blend-overlay",
        isGlitching ? "animate-[screenGlitch_0.12s_infinite]" : ""
      ].join(" ")}
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.12),transparent_35%)]" />

      <section
        className={[
          "relative z-10 mx-auto flex h-full w-full max-w-3xl flex-col overflow-hidden",
          "border border-cyan-300/35 bg-slate-950/90 p-3",
          "shadow-[0_0_40px_rgba(34,211,238,0.12),inset_0_0_40px_rgba(34,211,238,0.04)]",
          "sm:p-5"
        ].join(" ")}
      >
        <div className="shrink-0">
          <header className="mb-4 border-b border-cyan-300/20 pb-4">
            <div className="grid grid-cols-[auto_1fr_auto] items-start gap-3">
              <button
                type="button"
                className={[
                  "relative border border-cyan-300/35 bg-cyan-950/30 px-2.5 py-2",
                  "text-[10px] tracking-[0.2em] text-cyan-100",
                  "transition hover:bg-cyan-400/10",
                  "sm:px-3 sm:text-xs"
                ].join(" ")}
                onClick={() => setIsDataBankOpen(true)}
              >
                DATA {unreadFileCount > 0 ? `(${unreadFileCount})` : ""}

                {unreadFileCount > 0 && (
                  <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(134,239,172,0.9)]" />
                )}
              </button>

              <div className="min-w-0 text-center">
                <h1 className="m-0 truncate text-base tracking-[0.25em] text-cyan-300 sm:text-2xl">
                  {terminalTitle}
                </h1>

                <p className="mt-1 truncate text-[11px] text-cyan-50/55 sm:text-sm">
                  {terminalSubtitle}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(true)}
                  className="grid h-9 w-9 place-items-center border border-cyan-300/25 bg-slate-900/60 text-cyan-100 transition hover:bg-cyan-400/10"
                  aria-label="Open settings"
                >
                  ⚙
                </button>

                <button
                  type="button"
                  onClick={onReset}
                  className={[
                    "border border-rose-400/50 bg-transparent px-2.5 py-2",
                    "text-[10px] tracking-[0.18em] text-rose-400",
                    "transition hover:bg-rose-400/10",
                    "sm:px-3 sm:text-xs"
                  ].join(" ")}
                >
                  RESET
                </button>
              </div>
            </div>
          </header>

          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
            <span className="border border-cyan-300/20 bg-slate-900/60 p-2 text-[11px] text-cyan-50/70">
              {statusLink}
            </span>

            <span className="border border-cyan-300/20 bg-slate-900/60 p-2 text-[11px] text-cyan-50/70">
              {statusSignal}
            </span>

            <span className="border border-cyan-300/20 bg-slate-900/60 p-2 text-[11px] text-cyan-50/70">
              TRUST: <strong className={getStatusClass(trustLevel)}>{trustLevel}</strong>
            </span>

            <span className="border border-cyan-300/20 bg-slate-900/60 p-2 text-[11px] text-cyan-50/70">
              MORALE: <strong className={getStatusClass(moraleLevel)}>{moraleLevel}</strong>
            </span>

            <span className="border border-cyan-300/20 bg-slate-900/60 p-2 text-[11px] text-cyan-50/70">
              DANGER: <strong className={getStatusClass(dangerLevel)}>{dangerLevel}</strong>
            </span>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          <MessageFeed
            speaker={currentNode.speaker}
            messages={visibleMessages}
            isTyping={isTyping}
            onOpenFile={setActiveFile}
            language={language}
          />
        </div>

        <div className="shrink-0">
          {activePuzzle && canInteract && (
            <PuzzleRenderer
              puzzle={activePuzzle}
              attempts={gameState.puzzleAttempts?.[activePuzzle.id] || 0}
              onSubmit={onPuzzleSubmit}
            />
          )}

          {canShowChoices && !activePuzzle && !progressTask && (
            <ChoicePanel
              choices={currentNode.choices || []}
              onChoice={onChoice}
            />
          )}
        </div>
      </section>

      {progressTask && <ProgressTaskModal task={progressTask} />}

      {isDataBankOpen && (
        <DataBankModal
          files={collectedFiles}
          onOpenFile={handleOpenDataBankFile}
          onFileRead={onFileRead}
          onClose={() => setIsDataBankOpen(false)}
        />
      )}

      <FileViewerModal file={activeFile} onClose={() => setActiveFile(null)} />
      <SignalOverlay status={signalStatus} />

      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onChangeSettings={onChangeSettings}
          onReset={onReset}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </main>
  );
}
import { useState } from "react";
import MessageFeed from "./MessageFeed";
import ChoicePanel from "./ChoicePanel";
import PuzzleRenderer from "./puzzles/PuzzleRenderer";
import DataBankModal from "./DataBankModal";
import FileViewerModal from "./FileViewerModal";
import SignalOverlay from "./SignalOverlay";

export default function TerminalScreen({
  config,
  gameState,
  currentNode,
  visibleMessages,
  isTyping,
  isGlitching,
  signalStatus,
  canShowChoices,
  activePuzzle,
  onChoice,
  onPuzzleSubmit,
  onFileRead,
  onReset
}) {
  const [activeFile, setActiveFile] = useState(null);
  const [isDataBankOpen, setIsDataBankOpen] = useState(false);

  const collectedFiles = gameState.collectedFiles || [];
  const unreadFileCount = collectedFiles.filter(
  (file) => file.isNew
).length;
  const canInteract = !isTyping && !isGlitching && !signalStatus;

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
                DATA{" "}
{unreadFileCount > 0
  ? `(${unreadFileCount})`
  : ""}

                {unreadFileCount > 0 && (
                  <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(134,239,172,0.9)]" />
                )}
              </button>

              <div className="min-w-0 text-center">
                <h1 className="m-0 truncate text-base tracking-[0.25em] text-cyan-300 sm:text-2xl">
                  {config.terminalTitle}
                </h1>

                <p className="mt-1 truncate text-[11px] text-cyan-50/55 sm:text-sm">
                  {config.terminalSubtitle}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
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

          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <span className="border border-cyan-300/20 bg-slate-900/60 p-2 text-[11px] text-cyan-50/70">
              {config.statusLabels.link}
            </span>

            <span className="border border-cyan-300/20 bg-slate-900/60 p-2 text-[11px] text-cyan-50/70">
              {config.statusLabels.signal}
            </span>

            <span className="border border-cyan-300/20 bg-slate-900/60 p-2 text-[11px] text-cyan-50/70">
              DANGER: {gameState.danger}
            </span>

            <span className="border border-cyan-300/20 bg-slate-900/60 p-2 text-[11px] text-cyan-50/70">
              TRUST: {gameState.trust}
            </span>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          <MessageFeed
            speaker={currentNode.speaker}
            messages={visibleMessages}
            isTyping={isTyping}
            onOpenFile={setActiveFile}
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

          {canShowChoices && !activePuzzle && (
            <ChoicePanel
              choices={currentNode.choices || []}
              onChoice={onChoice}
            />
          )}
        </div>
      </section>

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
    </main>
  );
}
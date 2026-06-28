import { useEffect, useMemo, useRef, useState } from "react";
import {
  chooseOption,
  getCurrentNode,
  resetGame,
  saveGameState,
  getActivePuzzle,
  submitPuzzleAnswer,
  collectFile,
  setActivePuzzle,
  markFileAsRead,
  resolveActiveWaitTask,
  clearPendingNotifications,
  applySignalLost,
  getCurrentEpisode,
  loadGameData,
} from "./engine/gameEngine";
import { playNodeEvents } from "./engine/eventPlayer";
import { runIntroTimeline } from "./engine/introEngine";
import { runBootStep } from "./engine/bootEngine";
import { evaluateConditions } from "./engine/conditionEngine";
import stateManager from "./engine/stateManager";
import ContinueLoadingScreen from "./components/ContinueLoadingScreen";
import LoopResetScreen from "./components/LoopResetScreen";

import gameConfig from "./data/game.config.json";
import bootConfig from "./data/boot.config.json";
import { getGameText } from "./i18n/gameText";

import StartScreen from "./components/StartScreen";
import QuoteScreen from "./components/QuoteScreen";
import LogoScreen from "./components/LogoScreen";
import BootSequence from "./components/BootSequence";
import RebootConfirmScreen from "./components/RebootConfirmScreen";
import TransmissionInitScreen from "./components/TransmissionInitScreen";
import TerminalScreen from "./components/TerminalScreen";
import MissingNodeScreen from "./components/MissingNodeScreen";
import CreditsScreen from "./components/CreditsScreen";

import "./index.css";

function App() {
  // ── Hook'lar (Her zaman aynı sırada) ──────────────────────────────────
  const [phase, setPhase] = useState("start");
  const [loopResetState, setLoopResetState] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasSavedGame, setHasSavedGame] = useState(false);
  const [bootAttempt, setBootAttempt] = useState(1);
  const [bootStepIndex, setBootStepIndex] = useState(0);
  const [bootProgress, setBootProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [showError, setShowError] = useState(false);
  const [visibleMessages, setVisibleMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isGlitching, setIsGlitching] = useState(false);
  const [signalStatus, setSignalStatus] = useState(null);
  const [progressTask, setProgressTask] = useState(null);
  const [nodeFinished, setNodeFinished] = useState(false);
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("echo_settings");
    return saved ? JSON.parse(saved) : { language: "en", textSpeed: "normal", soundEnabled: true, vibrationEnabled: true };
  });

  const visitedForStatsRef = useRef(new Set());
  const introAudioRef = useRef(null);

  // ── Memoized Değerler ────────────────────────────────────────────────
  const currentNode = useMemo(() => gameState ? getCurrentNode(gameState) : null, [gameState]);
  const activePuzzle = useMemo(() => gameState ? getActivePuzzle(gameState) : null, [gameState]);
  const activeStep = useMemo(() => (bootAttempt === 1 ? bootConfig.firstAttempt : bootConfig.secondAttempt)?.[bootStepIndex], [bootAttempt, bootStepIndex]);

  // ── 1. Veri Yükleme ─────────────────────────────────────────────────
  useEffect(() => {
    async function initGame() {
      const state = await loadGameData();
      setGameState(state);
      if (state?.history?.length > 0) setHasSavedGame(true);
      setIsInitializing(false);
    }
    initGame();
  }, []);

  // ── Yardımcı Fonksiyonlar ───────────────────────────────────────────
  function startIntroAudio() {
    if (!settings.soundEnabled || introAudioRef.current) return;
    const audio = new Audio("/audio/link-start.mp3");
    audio.loop = true; audio.volume = 0.85;
    introAudioRef.current = audio;
    audio.play().catch((e) => console.warn("INTRO AUDIO PLAY FAILED:", e));
  }

  function stopIntroAudio() {
    if (!introAudioRef.current) return;
    introAudioRef.current.pause();
    introAudioRef.current.currentTime = 0;
    introAudioRef.current = null;
  }

  // ── Core Engine Event Player ────────────────────────────────────────
  useEffect(() => {
    if (phase !== "game" || !currentNode || !gameState) return;

    setIsTyping(false); setIsGlitching(false); setSignalStatus(null); setProgressTask(null); setNodeFinished(false);

    return playNodeEvents({
      events: currentNode.events || [],
      save: gameState,
      signalStrength: gameState?.signalStrength ?? 100,
      translate: (key, fallback = "") => getGameText(key, fallback, settings.language),
      onCharacterBusyStart: (busy) => {
        setGameState(prev => {
          const next = { ...prev, busyState: { id: busy.id, busyUntil: Date.now() + busy.durationMs, ...busy } };
          saveGameState(next);
          return next;
        });
      },
      onTypingStart: () => setIsTyping(true),
      onTypingStop: () => setIsTyping(false),
      onGlitchStart: () => setIsGlitching(true),
      onGlitchStop: () => setIsGlitching(false),
      onSignalLost: (msg) => { setSignalStatus({ type: "lost", message: msg }); setGameState(prev => applySignalLost(prev)); },
      onSignalRestored: (msg) => { setSignalStatus({ type: "restored", message: msg }); setTimeout(() => setSignalStatus(null), 1200); },
      onProgressTaskStart: (task) => setProgressTask(task),
      onProgressTaskEnd: () => setProgressTask(null),
      onMessage: (msg) => setVisibleMessages(prev => [...prev, { ...msg, speaker: msg.speaker || currentNode.speaker }]),
      onCollectFile: (file) => setGameState(prev => { const next = collectFile(prev, file); saveGameState(next); return next; }),
      onPuzzleStart: (pId) => setGameState(prev => { const next = setActivePuzzle(prev, pId); saveGameState(next); return next; }),
      onStatChange: (ch) => {
        if (currentNode.id && visitedForStatsRef.current.has(currentNode.id)) return;
        visitedForStatsRef.current.add(currentNode.id);
        setGameState(prev => { const next = stateManager.applyEffects(prev, ch); saveGameState(next); return next; });
      },
      onComplete: () => { setNodeFinished(true); }
    });
  }, [phase, currentNode?.id]);

  // ── Render Katmanı ───────────────────────────────────────────────────
  if (isInitializing) return <main className="min-h-dvh bg-black flex items-center justify-center text-white">LOADING DATA...</main>;

  if (phase === "start") return <StartScreen gameTitle={gameConfig.gameTitle} subtitle={gameConfig.subtitle} onStart={() => { startIntroAudio(); runIntroTimeline({ timeline: gameConfig.introTimeline, onPhaseChange: setPhase }); }} onContinue={() => setPhase("continueLoading")} hasSavedGame={hasSavedGame} onOpenCredits={() => setPhase("credits")} settings={settings} onChangeSettings={setSettings} onReset={() => { resetGame(); window.location.reload(); }} />;
  if (phase === "credits") return <CreditsScreen onClose={() => setPhase("start")} />;
  if (phase === "continueLoading") return <ContinueLoadingScreen saveData={gameState} onComplete={() => setPhase("game")} />;
  if (phase === "logo") return <LogoScreen gameTitle={gameConfig.gameTitle} onComplete={() => { stopIntroAudio(); setPhase("booting"); }} />;
  if (phase === "booting") return <BootSequence gameTitle={gameConfig.gameTitle} completedSteps={completedSteps} activeStep={activeStep} bootProgress={bootProgress} showError={showError} criticalError={bootConfig.criticalError} language={settings.language} />;
  
  if (!currentNode) return <MissingNodeScreen nodeId={gameState?.currentNodeId} onReset={() => { resetGame(); window.location.reload(); }} language={settings.language} />;

  return (
    <TerminalScreen
      config={gameConfig}
      gameState={gameState}
      currentNode={currentNode}
      visibleMessages={visibleMessages}
      isTyping={isTyping}
      isGlitching={isGlitching}
      signalStatus={signalStatus}
      progressTask={progressTask}
      activePuzzle={activePuzzle}
      settings={settings}
      onChangeSettings={setSettings}
      onChoice={(id) => {
        const next = chooseOption(gameState, id);
        setGameState(next);
        saveGameState(next);
      }}
      onPuzzleSubmit={(ans) => {
        const result = submitPuzzleAnswer(gameState, activePuzzle.id, ans);
        setGameState(result.nextState);
        saveGameState(result.nextState);
      }}
      onFileRead={(fId) => setGameState(markFileAsRead(gameState, fId))}
      onReset={() => { resetGame(); window.location.reload(); }}
    />
  );
}

export default App;
import { useEffect, useRef, useState } from "react";
import {
  chooseOption,
  getCurrentNode,
  getInitialGameState,
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
  getCurrentEpisode
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
  const [phase, setPhase] = useState("start");
  const [loopResetState, setLoopResetState] = useState(null);

  // ── Stat Deduplication ────────────────────────────────────────────────────
  // Her node için statChange sadece 1 kez uygulanır.
  // Ölüp checkpoint'e dönünce aynı node'dan geçince stat iki kez artmaz.
  const visitedForStatsRef = useRef(new Set());

  const [bootAttempt, setBootAttempt] = useState(1);
  const [bootStepIndex, setBootStepIndex] = useState(0);
  const [bootProgress, setBootProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [showError, setShowError] = useState(false);

  const [gameState, setGameState] = useState(getInitialGameState);
  const [visibleMessages, setVisibleMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isGlitching, setIsGlitching] = useState(false);
  const [signalStatus, setSignalStatus] = useState(null);
  const [progressTask, setProgressTask] = useState(null);
  const [nodeFinished, setNodeFinished] = useState(false);

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("echo_settings");
    return saved
      ? JSON.parse(saved)
      : {
          language: "en",
          textSpeed: "normal",
          soundEnabled: true,
          vibrationEnabled: true
        };
  });

  const hasSavedGame = localStorage.getItem("project_echo_progress") !== null;

  function continueGame() {
    const saveData = localStorage.getItem("project_echo_progress");
    if (!saveData) return;
    try {
      const parsedSave = JSON.parse(saveData);
      setGameState(parsedSave);
      setPhase("continueLoading");
    } catch (error) {
      console.error("SAVE DATA CORRUPTED:", error);
    }
  }

  const currentNode = getCurrentNode(gameState);
  const activePuzzle = getActivePuzzle(gameState);

  const currentBoot =
    bootAttempt === 1 ? bootConfig.firstAttempt : bootConfig.secondAttempt;
  const activeStep = currentBoot?.[bootStepIndex];

  const introAudioRef = useRef(null);

  function startIntroAudio() {
    if (!settings.soundEnabled || introAudioRef.current) return;
    const audio = new Audio();
    audio.src = "/audio/link-start.mp3";
    audio.loop = true;
    audio.volume = 0.85;
    audio.preload = "auto";
    audio.addEventListener("error", () => console.error("AUDIO ERROR:", audio.error));
    introAudioRef.current = audio;
    audio.play().catch((e) => console.warn("INTRO AUDIO PLAY FAILED:", e));
  }

  function stopIntroAudio() {
    if (!introAudioRef.current) return;
    introAudioRef.current.pause();
    introAudioRef.current.currentTime = 0;
    introAudioRef.current = null;
  }

  function showCharacterReturnNotification(busyState) {
    if (!busyState || typeof window === "undefined" || !("Notification" in window)) return;
    const title = busyState.notificationTitle || "Incoming Transmission";
    const body  = busyState.notificationBody || `${busyState.character || "Someone"} has returned.`;
    if (Notification.permission === "granted") {
      new Notification(title, { body });
    } else if (Notification.permission === "default") {
      Notification.requestPermission().then((p) => {
        if (p === "granted") new Notification(title, { body });
      });
    }
  }

  function buildResolvedBusyState(prevState) {
    const busy = prevState.busyState;
    if (!busy?.busyUntil || Date.now() < busy.busyUntil) return prevState;
    const nextEpisodeId = busy.returnEpisodeId || prevState.episodeId;
    const nextEpisode   = getCurrentEpisode({ ...prevState, episodeId: nextEpisodeId });
    const nextNodeId    = busy.returnNodeId || nextEpisode?.startNodeId;
    return {
      ...prevState,
      episodeId:     nextEpisodeId,
      currentNodeId: nextNodeId,
      busyState:     null,
      activePuzzleId: null,
      activeWaitTask: null,
      history: [
        ...(prevState.history || []),
        {
          type: "characterBusyComplete",
          busyId: busy.id,
          character: busy.character,
          status: busy.status,
          episodeId: nextEpisodeId,
          nextNodeId,
          completedAt: new Date().toISOString()
        }
      ]
    };
  }

  function startGame() {
    startIntroAudio();
    runIntroTimeline({ timeline: gameConfig.introTimeline, onPhaseChange: setPhase });
  }

  function startRecoveryBoot() {
    setShowError(false);
    setCompletedSteps([]);
    setBootStepIndex(0);
    setBootProgress(0);
    setBootAttempt(2);
    setPhase("booting");
  }

  // ── Settings kaydet ───────────────────────────────────────────────────────
  useEffect(() => {
    console.log("Ayarlar değişti, yeni dil:", settings.language);
    localStorage.setItem("echo_settings", JSON.stringify(settings));
  }, [settings]);

  // ── Episode değişince visitedForStats'ı sıfırla ───────────────────────────
  // Yeni bölüm = stat takibini temizle. Ölüm döngüsü temizlemesi ayrı.
  useEffect(() => {
    visitedForStatsRef.current = new Set();
  }, [gameState.episodeId]);

  // ── Intro audio ───────────────────────────────────────────────────────────
  useEffect(() => {
    let logoAudioStopTimer;
    if (!settings.soundEnabled) { stopIntroAudio(); return undefined; }
    if (phase === "logo") {
      logoAudioStopTimer = setTimeout(() => stopIntroAudio(), 2200);
    }
    if (["start","game","booting","rebootConfirm","credits"].includes(phase)) {
      stopIntroAudio();
    }
    return () => clearTimeout(logoAudioStopTimer);
  }, [phase, settings.soundEnabled]);

  // ── Pending notifications ─────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "game") return;
    const pending = gameState.pendingNotifications || [];
    if (!pending.length) return;
    pending.forEach((n) => {
      setVisibleMessages((prev) => [
        ...prev,
        { type: "systemAlert", text: n.message || "[NEW CONNECTION DETECTED]", sender: "system", speaker: "SYSTEM" }
      ]);
    });
    setGameState((prev) => {
      const next = clearPendingNotifications(prev);
      saveGameState(next);
      return next;
    });
  }, [phase, gameState.pendingNotifications?.length]);

  // ── Active wait task resolver ─────────────────────────────────────────────
  useEffect(() => {
    const resolved = resolveActiveWaitTask(gameState);
    if (
      resolved.episodeId     !== gameState.episodeId     ||
      resolved.currentNodeId !== gameState.currentNodeId ||
      Boolean(resolved.activeWaitTask) !== Boolean(gameState.activeWaitTask)
    ) {
      setGameState(resolved);
      saveGameState(resolved);
    }
  }, [gameState]);

  // ── Character busy timer ──────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "game" || !gameState.busyState) return;
    const busy        = gameState.busyState;
    const remainingMs = Math.max(0, busy.busyUntil - Date.now());

    function resolveBusyAndContinue(shouldNotify = false) {
      setGameState((prev) => {
        if (!prev.busyState) return prev;
        const next = buildResolvedBusyState(prev);
        if (next === prev) return prev;
        if (shouldNotify) showCharacterReturnNotification(prev.busyState);
        saveGameState(next);
        return next;
      });
    }

    if (remainingMs <= 0) { resolveBusyAndContinue(false); return; }
    const timer = setTimeout(() => resolveBusyAndContinue(true), remainingMs);
    return () => clearTimeout(timer);
  }, [phase, gameState.busyState?.busyUntil]);

  // ── Scroll / zoom lock ────────────────────────────────────────────────────


  // ── Boot sequence ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "booting" || !activeStep) return;
    return runBootStep({
      activeStep, bootStepIndex, bootAttempt, currentBoot,
      criticalErrorHoldMs: bootConfig.criticalErrorHoldMs,
      afterBootHoldMs:     bootConfig.afterBootHoldMs,
      onProgress:    setBootProgress,
      onStepComplete:(step) => setCompletedSteps((prev) => [...prev, step]),
      onCriticalError:(holdMs) => {
        setShowError(true);
        setTimeout(() => { setShowError(false); setPhase("rebootConfirm"); }, holdMs);
      },
      onNextStep:   () => setBootStepIndex((prev) => prev + 1),
      onBootComplete:() => setPhase("transmissionInit")
    });
  }, [phase, activeStep, bootStepIndex, bootAttempt, currentBoot]);

  // ── Ana oyun döngüsü ──────────────────────────────────────────────────────
// ── Ana oyun döngüsü ──────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "game" || !currentNode) return;

    // 1. Yeni düğüme geçildiğinde ekranı temizle
    setVisibleMessages([]); 

    setIsTyping(false);
    setIsGlitching(false);
    setSignalStatus(null);
    setProgressTask(null);
    setNodeFinished(false);

    return playNodeEvents({
      events: currentNode.events || [],
      save: gameState,
      
      // 2. Hata almamak için güvenli erişim (gameState varsa signalStrength'i al, yoksa 100)
      signalStrength: gameState?.signalStrength ?? 100,

      translate: (key, fallback = "") => getGameText(key, fallback, settings.language),

      // ── characterBusy ─────────────────────────────────────────────────────
      onCharacterBusyStart: (busy) => {
        setIsTyping(false);
        setIsGlitching(false);
        setSignalStatus(null);
        setProgressTask(null);
        setNodeFinished(false);

        setGameState((prev) => {
          const next = {
            ...prev,
            activePuzzleId: null,
            activeWaitTask: null,
            busyState: {
              id:                busy.id,
              character:         busy.character,
              status:            busy.status,
              busyUntil:         Date.now() + busy.durationMs,
              returnNodeId:      busy.returnNodeId,
              returnEpisodeId:   busy.returnEpisodeId,
              notificationTitle: busy.notificationTitle,
              notificationBody:  busy.notificationBody
            },
            history: [
              ...(prev.history || []),
              {
                type:            "characterBusyStart",
                busyId:          busy.id,
                character:       busy.character,
                status:          busy.status,
                returnNodeId:    busy.returnNodeId,
                returnEpisodeId: busy.returnEpisodeId || prev.episodeId,
                startedAt:       new Date().toISOString()
              }
            ]
          };
          saveGameState(next);
          return next;
        });
      },

      onTypingStart: () => setIsTyping(true),
      onTypingStop:  () => setIsTyping(false),
      onGlitchStart: () => setIsGlitching(true),
      onGlitchStop:  () => setIsGlitching(false),

      onSignalLost: (message) => {
        setSignalStatus({ type: "lost", message });
        setGameState((prev) => applySignalLost(prev));
      },

      onSignalRestored: (message) => {
        setSignalStatus({ type: "restored", message });
        setTimeout(() => setSignalStatus(null), 1200);
      },

      onProgressTaskStart: (task) => setProgressTask(task),
      onProgressTaskEnd:   ()     => setProgressTask(null),

      onMessage: (message) => {
        console.log("Terminal'e yeni mesaj geldi:", message);
        setVisibleMessages((prev) => [
          ...prev,
          {
            ...message,
            sender:  message.sender  || "character",
            speaker: message.speaker || currentNode?.speaker || "SYSTEM"
          }
        ]);
      },

      onCollectFile: (file) => {
        setGameState((prev) => {
          const next = collectFile(prev, { ...file, collectedAt: new Date().toISOString(), isNew: true });
          saveGameState(next);
          return next;
        });
      },

      onPuzzleStart: (puzzleId) => {
        setGameState((prev) => {
          const next = setActivePuzzle(prev, puzzleId);
          saveGameState(next);
          return next;
        });
      },

      // ── statChange — deduplication ile ────────────────────────────────────
      // Aynı node'dan tekrar geçince (ölüm sonrası) stat iki kez artmaz.
      onStatChange: (changes) => {
        const nodeId = currentNode?.id;
        if (nodeId && visitedForStatsRef.current.has(nodeId)) return;
        if (nodeId) visitedForStatsRef.current.add(nodeId);

        setGameState((prev) => {
          const next = stateManager.applyEffects(prev, changes);
          saveGameState(next);
          return next;
        });
      },

      // ── checkpoint — konumu ve stat'ları kaydet ────────────────────────────
      onCheckpoint: () => {
        setGameState((prev) => {
          const next = {
            ...prev,
            checkpoint: {
              nodeId:    prev.currentNodeId,
              episodeId: prev.episodeId,
            },
            // Checkpoint anındaki stat snapshot — ölüm sonrası bu değere dönülür
            checkpointStats: { ...(prev.stats || {}) },
          };
          saveGameState(next);
          return next;
        });
      },

      // ── statBasedRouting — sona yönlendirme ──────────────────────────────
      onStatBasedRouting: (route) => {
        if (route?.nextEpisodeId || route?.nextNodeId) {
          setTimeout(() => {
            setGameState((prev) => {
              const next = {
                ...prev,
                episodeId:     route.nextEpisodeId || prev.episodeId,
                currentNodeId: route.nextNodeId    || prev.currentNodeId
              };
              saveGameState(next);
              return next;
            });
          }, 1000);
        }
      },

      // ── loopReset — ölüm ekranına geç ────────────────────────────────────
      onLoopReset: (resetState) => {
        setLoopResetState(resetState);
        setPhase("loopReset");
      },

      // ── onComplete — normal node akışı ────────────────────────────────────
      onComplete: () => {
        if (gameState.busyState) return;
        setNodeFinished(true);

        // Branching
        if (currentNode?.branching?.length) {
          const matched = currentNode.branching.find((b) =>
            evaluateConditions(gameState, b.conditions)
          );
          const targetId = matched?.nextNodeId || currentNode.defaultNextNodeId;
          if (targetId) {
            setTimeout(() => {
              setGameState((prev) => {
                const next = { ...prev, currentNodeId: targetId };
                saveGameState(next);
                return next;
              });
            }, 500);
            return;
          }
        }

        // Normal node geçişi
        if (currentNode?.nextNodeId) {
          setTimeout(() => {
            setGameState((prev) => {
              const next = { ...prev, currentNodeId: currentNode.nextNodeId };
              saveGameState(next);
              return next;
            });
          }, 500);
          return;
        }

        // Episode geçişi
        if (currentNode?.nextEpisodeId) {
          setTimeout(() => {
            setGameState((prev) => {
              const nextEp   = getCurrentEpisode({ ...prev, episodeId: currentNode.nextEpisodeId });
              const next = {
                ...prev,
                episodeId:     currentNode.nextEpisodeId,
                currentNodeId: nextEp?.startNodeId
              };
              saveGameState(next);
              return next;
            });
          }, 500);
        }
      }
    });
  }, [phase, currentNode?.id]);

  // ── Seçim ─────────────────────────────────────────────────────────────────
  function handleChoice(choiceId) {
    if (gameState.busyState) return;
    const selected = currentNode?.choices?.find((c) => c.id === choiceId);
    if (selected) {
      setVisibleMessages((prev) => [
        ...prev,
        {
          type:    "playerMessage",
          text:    getGameText(selected.textKey, selected.text, settings.language),
          sender:  "player",
          speaker: "YOU"
        }
      ]);
    }
    setNodeFinished(false);
    const next = chooseOption(gameState, choiceId);
    setGameState(next);
    saveGameState(next);
  }

  // ── Puzzle cevabı ─────────────────────────────────────────────────────────
  function handlePuzzleSubmit(answer) {
    if (!activePuzzle) return;
    const result = submitPuzzleAnswer(gameState, activePuzzle.id, answer);
    setVisibleMessages((prev) => [
      ...prev,
      { type: "playerMessage", text: answer,          sender: "player", speaker: "YOU"    },
      { type: "systemAlert",   text: result.isCorrect ? "[ACCESS GRANTED]" : "[ACCESS DENIED]",
        sender: "system", speaker: "SYSTEM" }
    ]);
    setNodeFinished(false);
    setGameState(result.nextState);
    saveGameState(result.nextState);
  }

  function handleFileRead(fileId) {
    setGameState((prev) => {
      const next = markFileAsRead(prev, fileId);
      saveGameState(next);
      return next;
    });
  }

  function handleReset() {
    resetGame();
    window.location.reload();
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (phase === "start") {
    return (
      <StartScreen
        gameTitle={gameConfig.gameTitle}
        subtitle={gameConfig.subtitle}
        onStart={startGame}
        onContinue={continueGame}
        hasSavedGame={hasSavedGame}
        onOpenCredits={() => setPhase("credits")}
        settings={settings}
        onChangeSettings={setSettings}
        onReset={handleReset}
      />
    );
  }

  if (phase === "credits") {
    return <CreditsScreen onClose={() => setPhase("start")} />;
  }

  if (phase === "continueLoading") {
    return (
      <ContinueLoadingScreen
        saveData={gameState}
        onComplete={() => setPhase("game")}
      />
    );
  }

  if (phase === "blackout") {
    return <main className="min-h-dvh bg-black" />;
  }

  if (phase === "quote") {
    return <QuoteScreen quote={gameConfig.introQuote} language={settings.language} />;
  }

  if (phase === "logo") {
    return (
      <LogoScreen
        gameTitle={gameConfig.gameTitle}
        onComplete={() => { stopIntroAudio(); setPhase("booting"); }}
      />
    );
  }

  if (phase === "booting") {
    return (
      <BootSequence
        gameTitle={gameConfig.gameTitle}
        completedSteps={completedSteps}
        activeStep={activeStep}
        bootProgress={bootProgress}
        showError={showError}
        criticalError={bootConfig.criticalError}
        language={settings.language}
      />
    );
  }

  if (phase === "rebootConfirm") {
    return (
      <RebootConfirmScreen
        config={bootConfig.recovery}
        onRestart={startRecoveryBoot}
        language={settings.language}
      />
    );
  }

  if (phase === "transmissionInit") {
    return (
      <TransmissionInitScreen
        config={bootConfig.transmissionInit}
        onComplete={() => setPhase("game")}
        language={settings.language}
      />
    );
  }

  if (phase === "loopReset") {
    return (
      <LoopResetScreen
        loaderMessage={loopResetState?.loaderMessage}
        subMessage={loopResetState?.subMessage}
        visible={true}
        loaderDurationMs={loopResetState?.loaderDurationMs}
        autoRestoreCheckpointAfterLoader={loopResetState?.autoRestoreCheckpointAfterLoader}
        restoreCheckpointId={loopResetState?.restoreCheckpointId}
        onComplete={(result) => {
          setLoopResetState(null);

          if (result?.autoRestore && gameState.checkpoint) {
            // Yeni deneme: stat ve visited takibini sıfırla
            visitedForStatsRef.current = new Set();

            setGameState((prev) => {
              const cp  = prev.checkpoint;
              const epId = cp.episodeId
                || (cp.episode ? `episode_${cp.episode}` : prev.episodeId);

              const next = {
                ...prev,
                episodeId:     epId,
                currentNodeId: cp.nodeId || prev.currentNodeId,
                // Checkpoint anındaki stat'lara dön — stat inflation önlenir
                stats: prev.checkpointStats || prev.stats,
              };
              saveGameState(next);
              return next;
            });
          }

          setPhase("game");
        }}
      />
    );
  }

  if (!currentNode) {
    return (
      <MissingNodeScreen
        nodeId={gameState.currentNodeId}
        onReset={handleReset}
        language={settings.language}
      />
    );
  }

  const visibleChoices = (currentNode?.choices || []).filter((c) =>
    evaluateConditions(gameState, c.conditions)
  );

  const canShowChoices =
    !gameState.busyState &&
    nodeFinished &&
    visibleChoices.length > 0 &&
    !activePuzzle &&
    !isTyping &&
    !isGlitching &&
    !signalStatus &&
    !progressTask;

  return (
    <TerminalScreen
      config={gameConfig}
      gameState={gameState}
      currentNode={{ ...currentNode, choices: canShowChoices ? visibleChoices : [] }}
      visibleMessages={visibleMessages}
      isTyping={isTyping}
      isGlitching={isGlitching}
      signalStatus={signalStatus}
      progressTask={progressTask}
      canShowChoices={canShowChoices}
      activePuzzle={activePuzzle}
      onChoice={handleChoice}
      onPuzzleSubmit={handlePuzzleSubmit}
      onFileRead={handleFileRead}
      onReset={handleReset}
      settings={settings}
      onChangeSettings={setSettings}
    />
  );
}

export default App;

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
  resolveBusyState,
  clearPendingNotifications,
  getCurrentEpisode
} from "./engine/gameEngine";
import { playNodeEvents } from "./engine/eventPlayer";
import { runIntroTimeline } from "./engine/introEngine";
import { runBootStep } from "./engine/bootEngine";

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

import "./index.css";

function App() {
  const [phase, setPhase] = useState(() => {
    const savedProgress = localStorage.getItem("project_echo_progress");
    return savedProgress ? "game" : "start";
  });

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

  console.log("AUDIO SRC:", audio.src);
  console.log("CAN PLAY MP3:", audio.canPlayType("audio/mpeg"));

  audio.addEventListener("loadedmetadata", () => {
    console.log("AUDIO LOADED:", audio.duration);
  });

  audio.addEventListener("error", () => {
    console.error("AUDIO ERROR:", audio.error);
  });

  introAudioRef.current = audio;

  audio.play().catch((error) => {
    console.warn("INTRO AUDIO PLAY FAILED:", error);
  });
}

  function stopIntroAudio() {
    if (!introAudioRef.current) return;

    introAudioRef.current.pause();
    introAudioRef.current.currentTime = 0;
    introAudioRef.current = null;
  }

  function showCharacterReturnNotification(busyState) {
    if (!busyState) return;

    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    const title = busyState.notificationTitle || "Incoming Transmission";
    const body =
      busyState.notificationBody ||
      `${busyState.character || "Someone"} has returned.`;

    if (Notification.permission === "granted") {
      new Notification(title, { body });
      return;
    }

    if (Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification(title, { body });
        }
      });
    }
  }

  function buildResolvedBusyState(prevState) {
    const busy = prevState.busyState;

    if (!busy?.busyUntil || Date.now() < busy.busyUntil) {
      return prevState;
    }

    const nextEpisodeId = busy.returnEpisodeId || prevState.episodeId;
    const nextEpisode = getCurrentEpisode({
      ...prevState,
      episodeId: nextEpisodeId
    });

    const nextNodeId = busy.returnNodeId || nextEpisode?.startNodeId;

    return {
      ...prevState,
      episodeId: nextEpisodeId,
      currentNodeId: nextNodeId,
      busyState: null,
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

  runIntroTimeline({
    timeline: gameConfig.introTimeline,
    onPhaseChange: setPhase
  });
}

  function startRecoveryBoot() {
    setShowError(false);
    setCompletedSteps([]);
    setBootStepIndex(0);
    setBootProgress(0);
    setBootAttempt(2);
    setPhase("booting");
  }

  useEffect(() => {
    localStorage.setItem("echo_settings", JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    let logoAudioStopTimer;

    if (!settings.soundEnabled) {
      stopIntroAudio();
      return undefined;
    }

    if (phase === "logo") {
      logoAudioStopTimer = setTimeout(() => {
        stopIntroAudio();
      }, 2200);
    }

    if (
      phase === "start" ||
      phase === "game" ||
      phase === "booting" ||
      phase === "rebootConfirm"
    ) {
      stopIntroAudio();
    }

    return () => {
      clearTimeout(logoAudioStopTimer);
    };
  }, [phase, settings.soundEnabled]);

  useEffect(() => {
    if (phase !== "game") return;

    const pendingNotifications = gameState.pendingNotifications || [];

    if (!pendingNotifications.length) return;

    pendingNotifications.forEach((notification) => {
      setVisibleMessages((prev) => [
        ...prev,
        {
          type: "systemAlert",
          text: notification.message || "[NEW CONNECTION DETECTED]",
          sender: "system",
          speaker: "SYSTEM"
        }
      ]);
    });

    setGameState((prevState) => {
      const nextState = clearPendingNotifications(prevState);
      saveGameState(nextState);
      return nextState;
    });
  }, [phase, gameState.pendingNotifications?.length]);

  useEffect(() => {
    if (phase !== "game") return;

    setGameState((prevState) => {
      const nextState = resolveBusyState(prevState);

      if (
        nextState.episodeId === prevState.episodeId &&
        nextState.currentNodeId === prevState.currentNodeId &&
        Boolean(nextState.busyState) === Boolean(prevState.busyState)
      ) {
        return prevState;
      }

      saveGameState(nextState);
      return nextState;
    });
  }, [phase]);

  useEffect(() => {
    const resolvedState = resolveActiveWaitTask(gameState);

    if (
      resolvedState.episodeId !== gameState.episodeId ||
      resolvedState.currentNodeId !== gameState.currentNodeId ||
      Boolean(resolvedState.activeWaitTask) !== Boolean(gameState.activeWaitTask)
    ) {
      setGameState(resolvedState);
      saveGameState(resolvedState);
    }
  }, [gameState]);

  useEffect(() => {
    if (phase !== "game" || !gameState.busyState) return;

    const busy = gameState.busyState;
    const remainingMs = Math.max(0, busy.busyUntil - Date.now());

    function resolveBusyAndContinue(shouldNotify = false) {
      setGameState((prev) => {
        if (!prev.busyState) return prev;

        const nextState = buildResolvedBusyState(prev);

        if (nextState === prev) return prev;

        if (shouldNotify) {
          showCharacterReturnNotification(prev.busyState);
        }

        saveGameState(nextState);
        return nextState;
      });
    }

    if (remainingMs <= 0) {
      resolveBusyAndContinue(false);
      return;
    }

    const timer = setTimeout(() => {
      resolveBusyAndContinue(true);
    }, remainingMs);

    return () => clearTimeout(timer);
  }, [phase, gameState.busyState?.busyUntil]);

  useEffect(() => {
    if (phase !== "booting" || !activeStep) return;

    return runBootStep({
      activeStep,
      bootStepIndex,
      bootAttempt,
      currentBoot,
      criticalErrorHoldMs: bootConfig.criticalErrorHoldMs,
      afterBootHoldMs: bootConfig.afterBootHoldMs,
      onProgress: setBootProgress,
      onStepComplete: (completedStep) => {
        setCompletedSteps((prev) => [...prev, completedStep]);
      },
      onCriticalError: (holdMs) => {
        setShowError(true);

        setTimeout(() => {
          setShowError(false);
          setPhase("rebootConfirm");
        }, holdMs);
      },
      onNextStep: () => {
        setBootStepIndex((prev) => prev + 1);
      },
      onBootComplete: () => {
        setPhase("transmissionInit");
      }
    });
  }, [phase, activeStep, bootStepIndex, bootAttempt, currentBoot]);

  useEffect(() => {
  if (phase !== "game" || !currentNode) return;

  setIsTyping(false);
  setIsGlitching(false);
  setSignalStatus(null);
  setProgressTask(null);
  setNodeFinished(false);

  return playNodeEvents({
    events: currentNode.events || [],
    signalStrength: gameState.signalStrength,

    translate: (key, fallback = "") => {
      return getGameText(key, fallback, settings.language);
    },

    onCharacterBusyStart: (busy) => {
        setIsTyping(false);
        setIsGlitching(false);
        setSignalStatus(null);
        setProgressTask(null);
        setNodeFinished(false);

        setGameState((prev) => {
          const nextState = {
            ...prev,
            activePuzzleId: null,
            activeWaitTask: null,
            busyState: {
              id: busy.id,
              character: busy.character,
              status: busy.status,
              busyUntil: Date.now() + busy.durationMs,
              returnNodeId: busy.returnNodeId,
              returnEpisodeId: busy.returnEpisodeId,
              notificationTitle: busy.notificationTitle,
              notificationBody: busy.notificationBody
            },
            history: [
              ...(prev.history || []),
              {
                type: "characterBusyStart",
                busyId: busy.id,
                character: busy.character,
                status: busy.status,
                returnNodeId: busy.returnNodeId,
                returnEpisodeId: busy.returnEpisodeId || prev.episodeId,
                startedAt: new Date().toISOString()
              }
            ]
          };

          saveGameState(nextState);
          return nextState;
        });
      },

      onTypingStart: () => setIsTyping(true),
      onTypingStop: () => setIsTyping(false),

      onGlitchStart: () => setIsGlitching(true),
      onGlitchStop: () => setIsGlitching(false),

      onSignalLost: (message) => {
        setSignalStatus({ type: "lost", message });
      },

      onSignalRestored: (message) => {
        setSignalStatus({ type: "restored", message });

        setTimeout(() => {
          setSignalStatus(null);
        }, 1200);
      },

      onProgressTaskStart: (task) => {
        setProgressTask(task);
      },

      onProgressTaskEnd: () => {
        setProgressTask(null);
      },

      onMessage: (message) => {
        const enrichedMessage = {
          ...message,
          sender: message.sender || "character",
          speaker: message.speaker || currentNode.speaker
        };

        setVisibleMessages((prev) => [...prev, enrichedMessage]);
      },

      onCollectFile: (file) => {
        setGameState((prevState) => {
          const nextState = collectFile(prevState, {
            ...file,
            collectedAt: new Date().toISOString(),
            isNew: true
          });

          saveGameState(nextState);
          return nextState;
        });
      },

      onPuzzleStart: (puzzleId) => {
        setGameState((prevState) => {
          const nextState = setActivePuzzle(prevState, puzzleId);
          saveGameState(nextState);
          return nextState;
        });
      },

onStatChange: (changes) => {
  setGameState((prev) => {
    const nextState = {
      ...prev,
      trust: Math.max(0, Math.min(100, prev.trust + (changes.trust || 0))),
      danger: Math.max(0, Math.min(100, prev.danger + (changes.danger || 0))),
      morale: Math.max(0, Math.min(100, prev.morale + (changes.morale || 0))),
      signalStrength: Math.max(
        0,
        Math.min(100, (prev.signalStrength ?? 96) + (changes.signalStrength || 0))
      )
    };

    saveGameState(nextState);
    return nextState;
  });
},

onComplete: () => {
  if (gameState.busyState) return;

  setNodeFinished(true);

  if (currentNode?.nextNodeId) {
    setTimeout(() => {
      setGameState((prev) => {
        const nextState = {
          ...prev,
          currentNodeId: currentNode.nextNodeId
        };

        saveGameState(nextState);
        return nextState;
      });
    }, 500);

    return;
  }

  if (currentNode?.nextEpisodeId) {
  setTimeout(() => {
    setGameState((prev) => {
      const nextEpisode = getCurrentEpisode({
        ...prev,
        episodeId: currentNode.nextEpisodeId
      });

      const nextState = {
        ...prev,
        episodeId: currentNode.nextEpisodeId,
        currentNodeId: nextEpisode.startNodeId
      };

      saveGameState(nextState);
      return nextState;
    });
  }, 500);
}
}
    });
  }, [phase, currentNode?.id]);

function handleChoice(choiceId) {
  if (gameState.busyState) return;

  const selectedChoice = currentNode?.choices?.find(
    (choice) => choice.id === choiceId
  );

  if (selectedChoice) {
    setVisibleMessages((prev) => [
      ...prev,
      {
        type: "playerMessage",
        text: getGameText(
          selectedChoice.textKey,
          selectedChoice.text,
          settings.language
        ),
        sender: "player",
        speaker: "YOU"
      }
    ]);
  }

  setNodeFinished(false);

  const nextState = chooseOption(gameState, choiceId);
  setGameState(nextState);
  saveGameState(nextState);
}

  function handlePuzzleSubmit(answer) {
    if (!activePuzzle) return;

    const result = submitPuzzleAnswer(gameState, activePuzzle.id, answer);

    setVisibleMessages((prev) => [
      ...prev,
      {
        type: "playerMessage",
        text: answer,
        sender: "player",
        speaker: "YOU"
      },
      {
        type: "systemAlert",
        text: result.isCorrect ? "[ACCESS GRANTED]" : "[ACCESS DENIED]",
        sender: "system",
        speaker: "SYSTEM"
      }
    ]);

    setNodeFinished(false);
    setGameState(result.nextState);
    saveGameState(result.nextState);
  }

  function handleFileRead(fileId) {
    setGameState((prevState) => {
      const nextState = markFileAsRead(prevState, fileId);
      saveGameState(nextState);
      return nextState;
    });
  }

  function handleReset() {
    resetGame();
    window.location.reload();
  }

  if (phase === "start") {
    return (
<StartScreen
  gameTitle={gameConfig.gameTitle}
  subtitle={gameConfig.subtitle}
  onStart={startGame}
  settings={settings}
  onChangeSettings={setSettings}
  onReset={handleReset}
/>
    );
  }

  if (phase === "blackout") {
    return <main className="min-h-dvh bg-black" />;
  }

  if (phase === "quote") {
    return (
      <QuoteScreen
        quote={gameConfig.introQuote}
        language={settings.language}
      />
    );
  }

  if (phase === "logo") {
    return (
      <LogoScreen
        gameTitle={gameConfig.gameTitle}
        onComplete={() => {
          stopIntroAudio();
          setPhase("booting");
        }}
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

  if (!currentNode) {
    return (
      <MissingNodeScreen
        nodeId={gameState.currentNodeId}
        onReset={handleReset}
        language={settings.language}
      />
    );
  }

  const hasChoices =
    Array.isArray(currentNode?.choices) && currentNode.choices.length > 0;

const canShowChoices =
  !gameState.busyState &&
  nodeFinished &&
  hasChoices &&
  !activePuzzle &&
  !isTyping &&
  !isGlitching &&
  !signalStatus &&
  !progressTask;

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
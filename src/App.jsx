import { useEffect, useState } from "react";
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
  clearPendingNotifications
} from "./engine/gameEngine";
import { playNodeEvents } from "./engine/eventPlayer";
import { runIntroTimeline } from "./engine/introEngine";
import { runBootStep } from "./engine/bootEngine";

import gameConfig from "./data/game.config.json";
import bootConfig from "./data/boot.config.json";

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
  const [currentNodeMessageCount, setCurrentNodeMessageCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isGlitching, setIsGlitching] = useState(false);
  const [signalStatus, setSignalStatus] = useState(null);
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

  function startGame() {
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
  localStorage.setItem(
    "echo_settings",
    JSON.stringify(settings)
  );
}, [settings]);

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

    setCurrentNodeMessageCount(0);
    setIsTyping(false);
    setIsGlitching(false);
    setSignalStatus(null);

    return playNodeEvents({
      events: currentNode.events || [],

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

      onMessage: (message) => {
        setCurrentNodeMessageCount((prev) => prev + 1);

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
    const nextState = setActivePuzzle(
      prevState,
      puzzleId
    );

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
            morale: Math.max(0, Math.min(100, prev.morale + (changes.morale || 0)))
          };

          saveGameState(nextState);

          return nextState;
        });
      }
    });
  }, [phase, currentNode?.id]);

  function handleChoice(choiceId) {
    const selectedChoice = currentNode?.choices?.find(
      (choice) => choice.id === choiceId
    );

    if (selectedChoice) {
      setVisibleMessages((prev) => [
        ...prev,
        {
          type: "playerMessage",
          text: selectedChoice.text,
          sender: "player",
          speaker: "YOU"
        }
      ]);
    }

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

    setGameState(result.nextState);
    saveGameState(result.nextState);
  }

  function handleFileRead(fileId) {
  setGameState((prevState) => {
    const nextState = markFileAsRead(
      prevState,
      fileId
    );

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
      />
    );
  }

  if (phase === "blackout") {
    return <main className="min-h-dvh bg-black" />;
  }

  if (phase === "quote") {
    return <QuoteScreen quote={gameConfig.introQuote} />;
  }

  if (phase === "logo") {
    return <LogoScreen gameTitle={gameConfig.gameTitle} />;
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
      />
    );
  }

  if (phase === "rebootConfirm") {
    return (
      <RebootConfirmScreen
        config={bootConfig.recovery}
        onRestart={startRecoveryBoot}
      />
    );
  }

  if (phase === "transmissionInit") {
    return (
      <TransmissionInitScreen
        config={bootConfig.transmissionInit}
        onComplete={() => setPhase("game")}
      />
    );
  }

  if (!currentNode) {
    return (
      <MissingNodeScreen
        nodeId={gameState.currentNodeId}
        onReset={handleReset}
      />
    );
  }

  const totalMessageEvents = (currentNode.events || []).filter((event) =>
    ["message", "corruptMessage", "systemAlert", "image", "file", "log", "map", "crew"].includes(
      event.type
    )
  ).length;

const canShowChoices =
  currentNodeMessageCount > 0 &&
  !activePuzzle &&
  !isTyping &&
  !isGlitching &&
  !signalStatus &&
  currentNodeMessageCount === totalMessageEvents;

  return (
    <TerminalScreen
      config={gameConfig}
      gameState={gameState}
      currentNode={currentNode}
      visibleMessages={visibleMessages}
      isTyping={isTyping}
      isGlitching={isGlitching}
      signalStatus={signalStatus}
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
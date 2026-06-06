import { DEFAULT_EPISODE_ID, getEpisode, correlations } from "../data";

const STORAGE_KEY = "project_echo_progress";

function clampStat(value, min = 0, max = 100) {
  const number = Number(value);

  if (Number.isNaN(number)) return min;

  return Math.max(min, Math.min(max, number));
}

function createFreshGameState() {
  const episode = getEpisode(DEFAULT_EPISODE_ID);

  return {
    episodeId: DEFAULT_EPISODE_ID,
    currentNodeId: episode.startNodeId,
    history: [],
    trust: 50,
    danger: 10,
    morale: 60,
    signalStrength: 96,
    solvedPuzzles: {},
    puzzleAttempts: {},
    knownClues: {},
    activePuzzleId: null,
    activeWaitTask: null,
    unlockedCorrelations: {},
    pendingNotifications: [],
    collectedFiles: []
  };
}

function normalizeGameState(state) {
  const fallback = createFreshGameState();

  if (!state || typeof state !== "object") return fallback;

  const episodeId = state.episodeId || DEFAULT_EPISODE_ID;
  const episode = getEpisode(episodeId);

  if (!episode || !episode.nodes) return fallback;

  const currentNodeId = state.currentNodeId || episode.startNodeId;

  if (!episode.nodes[currentNodeId]) {
    return {
      ...fallback,
      episodeId,
      currentNodeId: episode.startNodeId
    };
  }

  return {
    episodeId,
    currentNodeId,
    history: Array.isArray(state.history) ? state.history : [],
    trust: typeof state.trust === "number" ? state.trust : 50,
    danger: typeof state.danger === "number" ? state.danger : 10,
    morale: typeof state.morale === "number" ? state.morale : 60,
    signalStrength:
  typeof state.signalStrength === "number" ? state.signalStrength : 96,

    solvedPuzzles:
      state.solvedPuzzles && typeof state.solvedPuzzles === "object"
        ? state.solvedPuzzles
        : {},

    puzzleAttempts:
      state.puzzleAttempts && typeof state.puzzleAttempts === "object"
        ? state.puzzleAttempts
        : {},

    knownClues:
      state.knownClues && typeof state.knownClues === "object"
        ? state.knownClues
        : {},

    activePuzzleId:
      typeof state.activePuzzleId === "string" ? state.activePuzzleId : null,

    activeWaitTask:
      state.activeWaitTask && typeof state.activeWaitTask === "object"
        ? state.activeWaitTask
        : null,

    unlockedCorrelations:
      state.unlockedCorrelations &&
      typeof state.unlockedCorrelations === "object"
        ? state.unlockedCorrelations
        : {},

    pendingNotifications: Array.isArray(state.pendingNotifications)
      ? state.pendingNotifications
      : [],

    collectedFiles: Array.isArray(state.collectedFiles)
      ? state.collectedFiles
      : []
  };
}

function applyEffectsToState(gameState, effects = {}) {
  return {
    ...gameState,
    trust: clampStat(gameState.trust + (effects.trust || 0)),
    danger: clampStat(gameState.danger + (effects.danger || 0)),
    morale: clampStat(gameState.morale + (effects.morale || 0)),

    signalStrength: clampStat(
      (gameState.signalStrength ?? 96) + (effects.signalStrength || 0),
      5,
      100
    ),

    mayaTrust: clampStat((gameState.mayaTrust ?? 0) + (effects.mayaTrust || 0), -100, 100),
    haleTrust: clampStat((gameState.haleTrust ?? 0) + (effects.haleTrust || 0), -100, 100)
  };
}

function normalizeAnswer(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/-/g, "");
}

function findPuzzleById(episode, puzzleId) {
  if (!episode?.puzzles || typeof episode.puzzles !== "object") return null;
  return episode.puzzles[puzzleId] || null;
}

function buildRewardFile(reward, correlation) {
  return {
    id: reward.id,
    type: reward.fileType || reward.type || "file",
    title: reward.title || correlation.title || "UNLOCKED FILE",
    caption: reward.caption || "Unlocked from connected evidence.",
    src: reward.src || "",
    content: reward.content || "",
    source: reward.source || "SYSTEM_CORRELATION",
    tags: Array.isArray(reward.tags) ? reward.tags : [],
    correlationTags: Array.isArray(reward.correlationTags)
      ? reward.correlationTags
      : [],
    isNew: true,
    collectedAt: new Date().toISOString()
  };
}

function checkCorrelations(gameState) {
  let nextState = normalizeGameState(gameState);

  Object.values(correlations || {}).forEach((correlation) => {
    if (!correlation?.id) return;
    if (nextState.unlockedCorrelations?.[correlation.id]) return;

    const requiredFiles = Array.isArray(correlation.requiredFiles)
      ? correlation.requiredFiles
      : [];

    if (!requiredFiles.length) return;

    const allRequiredFilesRead = requiredFiles.every((requiredFileId) => {
      const file = nextState.collectedFiles.find(
        (item) => item.id === requiredFileId
      );

      return file && file.isNew === false;
    });

    if (!allRequiredFilesRead) return;

    const reward = correlation.reward;
    let collectedFiles = nextState.collectedFiles;

    if (reward?.type === "file") {
      const rewardFile = buildRewardFile(reward, correlation);
      const alreadyCollected = collectedFiles.some(
        (file) => file.id === rewardFile.id
      );

      if (!alreadyCollected) {
        collectedFiles = [...collectedFiles, rewardFile];
      }
    }

    const notification = {
      id: `correlation_${correlation.id}_${Date.now()}`,
      type: "correlation",
      title: correlation.title || "NEW CONNECTION DETECTED",
      message:
        reward?.message ||
        correlation.message ||
        "[NEW CONNECTION DETECTED]",
      createdAt: new Date().toISOString()
    };

    nextState = normalizeGameState({
      ...nextState,
      collectedFiles,
      unlockedCorrelations: {
        ...nextState.unlockedCorrelations,
        [correlation.id]: true
      },
      pendingNotifications: [
        ...nextState.pendingNotifications,
        notification
      ],
      history: [
        ...nextState.history,
        {
          type: "correlationUnlocked",
          correlationId: correlation.id,
          rewardType: reward?.type || null,
          rewardId: reward?.id || null,
          unlockedAt: new Date().toISOString()
        }
      ]
    });
  });

  return nextState;
}

export function getInitialGameState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return createFreshGameState();

    const parsed = JSON.parse(saved);
    const normalized = normalizeGameState(parsed);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));

    return normalized;
  } catch {
    const freshState = createFreshGameState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(freshState));
    return freshState;
  }
}

export function getCurrentEpisode(gameState) {
  const normalizedState = normalizeGameState(gameState);
  return getEpisode(normalizedState.episodeId);
}

export function getCurrentNode(gameState) {
  const normalizedState = normalizeGameState(gameState);
  const episode = getCurrentEpisode(normalizedState);

  if (!episode || !episode.nodes) return null;

  return episode.nodes[normalizedState.currentNodeId] || null;
}

export function chooseOption(gameState, choiceId) {
  const normalizedState = normalizeGameState(gameState);
  const episode = getCurrentEpisode(normalizedState);
  const currentNode = getCurrentNode(normalizedState);

  if (!currentNode) throw new Error("Current node not found");

  const selectedChoice = currentNode.choices?.find(
    (choice) => choice.id === choiceId
  );

  if (!selectedChoice) throw new Error("Choice not found");

  if (selectedChoice.puzzleId) {
    const nextState = normalizeGameState({
      ...normalizedState,
      activePuzzleId: selectedChoice.puzzleId
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    return nextState;
  }

  if (selectedChoice.waitTask) {
    const waitTask = selectedChoice.waitTask;

    const nextEpisodeId =
      waitTask.nextEpisodeId ||
      selectedChoice.nextEpisodeId ||
      normalizedState.episodeId;

    const nextEpisode = getEpisode(nextEpisodeId);

    const waitingNodeId =
      waitTask.waitingNodeId ||
      selectedChoice.nextNodeId ||
      normalizedState.currentNodeId;

    const completeNodeId = waitTask.completeNodeId || nextEpisode.startNodeId;

    const stateAfterEffects = applyEffectsToState(
      normalizedState,
      selectedChoice.effects
    );

    const nextState = normalizeGameState({
      ...stateAfterEffects,
      episodeId: nextEpisodeId,
      currentNodeId: waitingNodeId,
      activePuzzleId: null,
      activeWaitTask: {
        id: waitTask.id,
        startedAt: new Date().toISOString(),
        finishAt: Date.now() + (waitTask.durationMs || 60000),
        durationMs: waitTask.durationMs || 60000,
        waitingNodeId,
        completeNodeId,
        nextEpisodeId
      },
      history: [
        ...normalizedState.history,
        {
          type: "waitTask",
          episodeId: episode.id,
          nodeId: currentNode.id,
          choiceId: selectedChoice.id,
          choiceText: selectedChoice.text,
          effects: selectedChoice.effects || {},
          waitTaskId: waitTask.id,
          waitingNodeId,
          completeNodeId,
          nextEpisodeId
        }
      ]
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    return nextState;
  }

  const nextEpisodeId = selectedChoice.nextEpisodeId || normalizedState.episodeId;
  const nextEpisode = getEpisode(nextEpisodeId);
  const nextNodeId = selectedChoice.nextNodeId || nextEpisode.startNodeId;

  const stateAfterEffects = applyEffectsToState(
    normalizedState,
    selectedChoice.effects
  );

  const nextState = normalizeGameState({
    ...stateAfterEffects,
    episodeId: nextEpisodeId,
    currentNodeId: nextNodeId,
    activePuzzleId: null,
    activeWaitTask: null,
    history: [
      ...normalizedState.history,
      {
        episodeId: episode.id,
        nodeId: currentNode.id,
        choiceId: selectedChoice.id,
        choiceText: selectedChoice.text,
        effects: selectedChoice.effects || {},
        nextEpisodeId,
        nextNodeId
      }
    ]
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));

  return nextState;
}

export function submitPuzzleAnswer(gameState, puzzleId, answer) {
  const normalizedState = normalizeGameState(gameState);
  const episode = getCurrentEpisode(normalizedState);
  const puzzle = findPuzzleById(episode, puzzleId);

  if (!puzzle) throw new Error("Puzzle not found");

  const normalizedInput = normalizeAnswer(answer);

  const acceptedAnswers = Array.isArray(puzzle.acceptedAnswers)
    ? puzzle.acceptedAnswers
    : [];

  const isCorrect = acceptedAnswers.some(
    (acceptedAnswer) => normalizeAnswer(acceptedAnswer) === normalizedInput
  );

  const currentAttempts = normalizedState.puzzleAttempts?.[puzzleId] || 0;
  const nextAttempts = currentAttempts + 1;

  const nextPuzzleAttempts = {
    ...normalizedState.puzzleAttempts,
    [puzzleId]: nextAttempts
  };

  const baseState = {
    ...normalizedState,
    activePuzzleId: null,
    activeWaitTask: null,
    puzzleAttempts: nextPuzzleAttempts
  };

  if (isCorrect) {
    const nextNodeId = puzzle.successNodeId || normalizedState.currentNodeId;

    const nextState = normalizeGameState({
      ...baseState,
      currentNodeId: nextNodeId,
      solvedPuzzles: {
        ...normalizedState.solvedPuzzles,
        [puzzleId]: true
      },
      history: [
        ...normalizedState.history,
        {
          type: "puzzle",
          episodeId: episode.id,
          puzzleId,
          answer,
          result: "success",
          nextNodeId
        }
      ]
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));

    return {
      isCorrect: true,
      puzzle,
      nextState
    };
  }

  const nextNodeId = puzzle.failureNodeId || normalizedState.currentNodeId;

  const nextState = normalizeGameState({
    ...baseState,
    currentNodeId: nextNodeId,
    history: [
      ...normalizedState.history,
      {
        type: "puzzle",
        episodeId: episode.id,
        puzzleId,
        answer,
        result: "failure",
        nextNodeId
      }
    ]
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));

  return {
    isCorrect: false,
    puzzle,
    nextState
  };
}

export function clearActivePuzzle(gameState) {
  const normalizedState = normalizeGameState(gameState);

  const nextState = normalizeGameState({
    ...normalizedState,
    activePuzzleId: null
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));

  return nextState;
}

export function setActivePuzzle(gameState, puzzleId) {
  const normalizedState = normalizeGameState(gameState);

  const nextState = normalizeGameState({
    ...normalizedState,
    activePuzzleId: puzzleId
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));

  return nextState;
}

export function getActivePuzzle(gameState) {
  const normalizedState = normalizeGameState(gameState);

  if (!normalizedState.activePuzzleId) return null;

  const episode = getCurrentEpisode(normalizedState);

  return findPuzzleById(episode, normalizedState.activePuzzleId);
}

export function getRemainingWaitMs(gameState) {
  const normalizedState = normalizeGameState(gameState);

  if (!normalizedState.activeWaitTask?.finishAt) return 0;

  return Math.max(0, normalizedState.activeWaitTask.finishAt - Date.now());
}

export function resolveActiveWaitTask(gameState) {
  const normalizedState = normalizeGameState(gameState);
  const waitTask = normalizedState.activeWaitTask;

  if (!waitTask?.finishAt) return normalizedState;
  if (Date.now() < waitTask.finishAt) return normalizedState;

  const nextEpisodeId = waitTask.nextEpisodeId || normalizedState.episodeId;
  const nextEpisode = getEpisode(nextEpisodeId);
  const completeNodeId = waitTask.completeNodeId || nextEpisode.startNodeId;

  const nextState = normalizeGameState({
    ...normalizedState,
    episodeId: nextEpisodeId,
    currentNodeId: completeNodeId,
    activeWaitTask: null,
    activePuzzleId: null,
    history: [
      ...normalizedState.history,
      {
        type: "waitTaskComplete",
        waitTaskId: waitTask.id,
        episodeId: nextEpisodeId,
        nextNodeId: completeNodeId
      }
    ]
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));

  return nextState;
}

export function saveGameState(gameState) {
  const normalizedState = normalizeGameState(gameState);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedState));
}

export function resetGame() {
  localStorage.removeItem(STORAGE_KEY);
}

export function collectFile(gameState, file) {
  const normalizedState = normalizeGameState(gameState);

  const existingFile = normalizedState.collectedFiles.find(
    (item) => item.id === file.id
  );

  if (existingFile) return normalizedState;

  const nextState = normalizeGameState({
    ...normalizedState,
    collectedFiles: [
      ...normalizedState.collectedFiles,
      {
        id: file.id,
        type: file.type || "file",
        title: file.title || "UNKNOWN FILE",
        caption: file.caption || "",
        src: file.src || "",
        content: file.content || "",
        source: file.source || "",
        tags: Array.isArray(file.tags) ? file.tags : [],
        correlationTags: Array.isArray(file.correlationTags)
          ? file.correlationTags
          : [],
        isNew: file.isNew ?? true,
        collectedAt: file.collectedAt || new Date().toISOString()
      }
    ]
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));

  return nextState;
}

export function markFileAsRead(gameState, fileId) {
  const normalizedState = normalizeGameState(gameState);

  const readState = normalizeGameState({
    ...normalizedState,
    collectedFiles: normalizedState.collectedFiles.map((file) =>
      file.id === fileId
        ? {
            ...file,
            isNew: false,
            readAt: file.readAt || new Date().toISOString()
          }
        : file
    )
  });

  const nextState = checkCorrelations(readState);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));

  return nextState;
}

export function clearPendingNotifications(gameState) {
  const normalizedState = normalizeGameState(gameState);

  const nextState = normalizeGameState({
    ...normalizedState,
    pendingNotifications: []
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));

  return nextState;
}
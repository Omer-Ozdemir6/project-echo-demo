import { DEFAULT_EPISODE_ID, getEpisode } from "../data";

const STORAGE_KEY = "project_echo_progress";

function clampStat(value) {
  return Math.max(0, Math.min(100, value));
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
  solvedPuzzles: {},
  puzzleAttempts: {},
  knownClues: {},
  activePuzzleId: null,
  collectedFiles: []
};
}

function normalizeGameState(state) {
  const fallback = createFreshGameState();

  if (!state || typeof state !== "object") {
    return fallback;
  }

  const episodeId = state.episodeId || DEFAULT_EPISODE_ID;
  const episode = getEpisode(episodeId);

  if (!episode || !episode.nodes) {
    return fallback;
  }

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
  typeof state.activePuzzleId === "string"
    ? state.activePuzzleId
    : null,

collectedFiles:
  Array.isArray(state.collectedFiles)
    ? state.collectedFiles
    : []
};
}

function applyEffectsToState(gameState, effects = {}) {
  return {
    ...gameState,
    trust: clampStat(gameState.trust + (effects.trust || 0)),
    danger: clampStat(gameState.danger + (effects.danger || 0)),
    morale: clampStat(gameState.morale + (effects.morale || 0))
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
  if (!episode?.puzzles || typeof episode.puzzles !== "object") {
    return null;
  }

  return episode.puzzles[puzzleId] || null;
}

export function getInitialGameState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return createFreshGameState();
    }

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

  if (!episode || !episode.nodes) {
    return null;
  }

  return episode.nodes[normalizedState.currentNodeId] || null;
}

export function chooseOption(gameState, choiceId) {
  const normalizedState = normalizeGameState(gameState);
  const episode = getCurrentEpisode(normalizedState);
  const currentNode = getCurrentNode(normalizedState);

  if (!currentNode) {
    throw new Error("Current node not found");
  }

  const selectedChoice = currentNode.choices?.find(
    (choice) => choice.id === choiceId
  );

  if (!selectedChoice) {
    throw new Error("Choice not found");
  }

 if (selectedChoice.puzzleId) {
  const nextState = normalizeGameState({
    ...normalizedState,
    activePuzzleId: selectedChoice.puzzleId
  });

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(nextState)
  );

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

  if (!puzzle) {
    throw new Error("Puzzle not found");
  }

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

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(nextState)
  );

  return nextState;
}

export function getActivePuzzle(gameState) {
  const normalizedState = normalizeGameState(gameState);

  if (!normalizedState.activePuzzleId) {
    return null;
  }

  const episode = getCurrentEpisode(normalizedState);

  return findPuzzleById(episode, normalizedState.activePuzzleId);
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

  if (existingFile) {
    return normalizedState;
  }

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

        tags: Array.isArray(file.tags)
          ? file.tags
          : [],

        isNew: file.isNew ?? true,

        collectedAt:
          file.collectedAt ||
          new Date().toISOString()
      }
    ]
  });

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(nextState)
  );

  return nextState;
}

export function markFileAsRead(gameState, fileId) {
  const normalizedState = normalizeGameState(gameState);

  const nextState = normalizeGameState({
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

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(nextState)
  );

  return nextState;
}
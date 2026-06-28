import { DEFAULT_EPISODE_ID, getEpisode, correlations } from "../data";
import { applyChoice } from "./choiceEngine";
import { calculateEnding } from "./endingEngine";
import stateManager from "./stateManager";
import { Preferences } from '@capacitor/preferences';

const STORAGE_KEY = "project_echo_progress";

function clampStat(value, min = 0, max = 100) {
  const number = Number(value);
  if (Number.isNaN(number)) return min;
  return Math.max(min, Math.min(max, number));
}

// ─────────────────────────────────────────────
// CONDITIONAL NEXT NODE
// ─────────────────────────────────────────────

function evaluateConditionalNext(state, conditions) {
  if (!conditions || typeof conditions !== "object") return false;

  return Object.entries(conditions).every(([key, expected]) => {
    let actual;

    if (state.injuries && state.injuries[key] !== undefined) {
      actual = state.injuries[key];
    } else if (state.stats && state.stats[key] !== undefined) {
      actual = state.stats[key];
    } else if (state.story && state.story[key] !== undefined) {
      actual = state.story[key];
    } else if (state.flags && state.flags[key] !== undefined) {
      actual = state.flags[key];
    } else {
      return false;
    }

    if (typeof expected === "object" && expected !== null) {
      if (expected.min !== undefined && actual < expected.min) return false;
      if (expected.max !== undefined && actual > expected.max) return false;
      return true;
    }

    return actual === expected;
  });
}

function resolveNextNodeId(state, choice, fallbackEpisode) {
  if (Array.isArray(choice.conditionalNext)) {
    for (const branch of choice.conditionalNext) {
      if (evaluateConditionalNext(state, branch.if)) {
        return branch.nextNodeId;
      }
    }
  }

  return choice.nextNodeId || fallbackEpisode.startNodeId;
}

// ─────────────────────────────────────────────
// OBSERVER MODE HELPER
// ─────────────────────────────────────────────

function resolveObserverMode(state) {
  const mentalStability = state.stats?.mentalStability ?? 100;

  if (mentalStability <= 19) return "control";
  if (mentalStability <= 39) return "dialogue";
  if (mentalStability <= 59) return "whisper";
  return "passive";
}

function applyObserverMode(state) {
  const observerMode = resolveObserverMode(state);

  return {
    ...state,
    story: {
      ...state.story,
      observerMode
    }
  };
}

// ─────────────────────────────────────────────
// FRESH STATE
// ─────────────────────────────────────────────

export function createFreshGameState() {
  const episodeId = DEFAULT_EPISODE_ID;
  const episode = getEpisode(episodeId);

  // GÜVENLİK KONTROLÜ: Epizot bulunamazsa çökmesini engeller
  if (!episode) {
    console.error(`KRİTİK HATA: Epizot bulunamadı: ${episodeId}. Lütfen DEFAULT_EPISODE_ID ve merged_story.json anahtarlarını kontrol edin.`);
  }

  return {
    episodeId: episodeId,
    currentNodeId: episode ? episode.startNodeId : "error_node",
    history: [],
    stats: {
      trust: 50,
      humanity: 50,
      fear: 0,
      resentment: 0,
      dependency: 50,
      curiosity: 0,
      riskPattern: 0,
      deathRisk: 0,
      mentalStability: 100,
      identityFracture: 0,
      injury: 0,
      oxygen: 100,
      machinePath: 0,
      humanityPath: 0,
      eliasStress: 0,
      echoProximity: 0
    },
    injuries: {
      legInjury: false,
      armInjury: false,
      headTrauma: false,
      breathingIssue: false
    },
    flags: {},
    memory: {
      minor: [],
      major: [],
      critical: []
    },
    relationship: {
      currentState: "CAUTIOUS",
      lastArgumentEpisode: null,
      lastTrustChangeEpisode: null,
      timesRejectedOrders: 0
    },
    relationshipTags: [],
    callbackUsage: {},
    scheduledEvents: [],
    completedEvents: [],
    story: {
      replacementPreparationActive: false,
      candidateIdentified: false,
      unknownContactDiscovered: false,
      operatorTargetConfirmed: false,
      observerMode: "passive",
      kiraIdentityRevealed: false,
      operatorIdentityRevealed: false,
      eliasFullMemoryRestored: false,
      echoNatureUnderstood: false,
      siblingInsideFacility: false
    },
    death: {
      deathRouteActive: false,
      criticalDeathRisk: false,
      timesNearDeath: 0,
      loopCount: 0,
      signalLostCount: 0
    },
    checkpoint: {
      episode: 1,
      nodeId: episode ? episode.startNodeId : "error_node",
      timestamp: null
    },
    endings: {
      loyalEndingUnlocked: false,
      betrayalEndingUnlocked: false,
      sacrificeEndingUnlocked: false,
      replacementEndingUnlocked: false,
      trueEndingUnlocked: false
    },
    solvedPuzzles: {},
    puzzleAttempts: {},
    knownClues: {},
    activePuzzleId: null,
    activeWaitTask: null,
    unlockedCorrelations: {},
    pendingNotifications: [],
    collectedFiles: [],
    busyState: null
  };
}

export const getInitialGameState = createFreshGameState;

// ─────────────────────────────────────────────
// NORMALIZE
// ─────────────────────────────────────────────

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
    stats: state.stats && typeof state.stats === "object" ? state.stats : fallback.stats,
    injuries: state.injuries && typeof state.injuries === "object" ? state.injuries : fallback.injuries,
    flags: state.flags && typeof state.flags === "object" ? state.flags : {},
    memory: {
      minor: Array.isArray(state?.memory?.minor) ? state.memory.minor : [],
      major: Array.isArray(state?.memory?.major) ? state.memory.major : [],
      critical: Array.isArray(state?.memory?.critical) ? state.memory.critical : []
    },
    relationship: state.relationship && typeof state.relationship === "object" ? state.relationship : fallback.relationship,
    relationshipTags: Array.isArray(state.relationshipTags) ? state.relationshipTags : [],
    callbackUsage: state.callbackUsage && typeof state.callbackUsage === "object" ? state.callbackUsage : {},
    scheduledEvents: Array.isArray(state.scheduledEvents) ? state.scheduledEvents : [],
    completedEvents: Array.isArray(state.completedEvents) ? state.completedEvents : [],
    story: state.story && typeof state.story === "object" ? state.story : fallback.story,
    death: state.death && typeof state.death === "object" ? state.death : fallback.death,
    checkpoint: state.checkpoint && typeof state.checkpoint === "object" ? state.checkpoint : fallback.checkpoint,
    endings: state.endings && typeof state.endings === "object" ? state.endings : fallback.endings,
    solvedPuzzles: state.solvedPuzzles && typeof state.solvedPuzzles === "object" ? state.solvedPuzzles : {},
    puzzleAttempts: state.puzzleAttempts && typeof state.puzzleAttempts === "object" ? state.puzzleAttempts : {},
    knownClues: state.knownClues && typeof state.knownClues === "object" ? state.knownClues : {},
    activePuzzleId: typeof state.activePuzzleId === "string" ? state.activePuzzleId : null,
    activeWaitTask: state.activeWaitTask && typeof state.activeWaitTask === "object" ? state.activeWaitTask : null,
    unlockedCorrelations: state.unlockedCorrelations && typeof state.unlockedCorrelations === "object" ? state.unlockedCorrelations : {},
    pendingNotifications: Array.isArray(state.pendingNotifications) ? state.pendingNotifications : [],
    collectedFiles: Array.isArray(state.collectedFiles) ? state.collectedFiles : [],
    busyState: state.busyState && typeof state.busyState === "object" ? state.busyState : null
  };
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function normalizeAnswer(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "").replace(/-/g, "");
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
    correlationTags: Array.isArray(reward.correlationTags) ? reward.correlationTags : [],
    isNew: true,
    collectedAt: new Date().toISOString()
  };
}

// ─────────────────────────────────────────────
// CORRELATIONS
// ─────────────────────────────────────────────

function checkCorrelations(gameState) {
  let nextState = normalizeGameState(gameState);

  Object.values(correlations || {}).forEach((correlation) => {
    if (!correlation?.id) return;
    if (nextState.unlockedCorrelations?.[correlation.id]) return;

    const requiredFiles = Array.isArray(correlation.requiredFiles) ? correlation.requiredFiles : [];
    if (!requiredFiles.length) return;

    const allRequiredFilesRead = requiredFiles.every((requiredFileId) => {
      const file = nextState.collectedFiles.find((item) => item.id === requiredFileId);
      return file && file.isNew === false;
    });

    if (!allRequiredFilesRead) return;

    const reward = correlation.reward;
    let collectedFiles = nextState.collectedFiles;

    if (reward?.type === "file") {
      const rewardFile = buildRewardFile(reward, correlation);
      const alreadyCollected = collectedFiles.some((file) => file.id === rewardFile.id);
      if (!alreadyCollected) {
        collectedFiles = [...collectedFiles, rewardFile];
      }
    }

    const notification = {
      id: `correlation_${correlation.id}_${Date.now()}`,
      type: "correlation",
      title: correlation.title || "NEW CONNECTION DETECTED",
      message: reward?.message || correlation.message || "[NEW CONNECTION DETECTED]",
      createdAt: new Date().toISOString()
    };

    nextState = normalizeGameState({
      ...nextState,
      collectedFiles,
      unlockedCorrelations: { ...nextState.unlockedCorrelations, [correlation.id]: true },
      pendingNotifications: [...nextState.pendingNotifications, notification],
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

// ─────────────────────────────────────────────
// EXPORTS — READ
// ─────────────────────────────────────────────

export async function loadGameData() {
  try {
    const { value } = await Preferences.get({ key: STORAGE_KEY });
    if (!value) return createFreshGameState();
    
    const parsed = JSON.parse(value);
    const normalized = normalizeGameState(parsed);
    
    // Güvenlik amaçlı formatlanmış veriyi tekrar yaz
    await Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(normalized) });
    return normalized;
  } catch (error) {
    console.error("Kayıt okuma hatası, yeni oyun başlatılıyor:", error);
    return createFreshGameState();
  }
}

export function getCurrentEpisode(gameState) {
  const normalizedState = normalizeGameState(gameState);
  return getEpisode(normalizedState.episodeId);
}

export function getCurrentNode(gameState) {
  const normalizedState = normalizeGameState(gameState);
  const episode = getCurrentEpisode(normalizedState);
  return episode.nodes[normalizedState.currentNodeId] || null;
}

// ─────────────────────────────────────────────
// EXPORTS — CHOOSE OPTION
// ─────────────────────────────────────────────

export function chooseOption(gameState, choiceId) {
  const normalizedState = normalizeGameState(gameState);
  const episode = getCurrentEpisode(normalizedState);
  const currentNode = getCurrentNode(normalizedState);

  if (!currentNode) throw new Error("Current node not found");

  const selectedChoice = currentNode.choices?.find((choice) => choice.id === choiceId);
  if (!selectedChoice) throw new Error("Choice not found");

  // PUZZLE BRANCH
  if (selectedChoice.puzzleId) {
    return setActivePuzzle(normalizedState, selectedChoice.puzzleId);
  }

  // WAIT TASK BRANCH
  if (selectedChoice.waitTask) {
    const waitTask = selectedChoice.waitTask;
    const nextEpisodeId = waitTask.nextEpisodeId || selectedChoice.nextEpisodeId || normalizedState.episodeId;
    const nextEpisode = getEpisode(nextEpisodeId);
    const waitingNodeId = waitTask.waitingNodeId || selectedChoice.nextNodeId || normalizedState.currentNodeId;
    const completeNodeId = waitTask.completeNodeId || nextEpisode.startNodeId;
    const stateAfterEffects = applyChoice(normalizedState, selectedChoice);

    let nextState = normalizeGameState({
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
        checkpoint: {
          ...stateAfterEffects.checkpoint,
          episode: parseInt((nextEpisodeId || "").replace("episode_", "")) || 1,
          nodeId: waitingNodeId,
          timestamp: Date.now()
        },
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

    nextState = applyObserverMode(nextState);
    saveGameState(nextState);
    return nextState;
  }

  // NORMAL BRANCH
  const nextEpisodeId = selectedChoice.nextEpisodeId || normalizedState.episodeId;
  const nextEpisode = getEpisode(nextEpisodeId);

  // conditionalNext: injury/stat durumuna gore farkli node
  const nextNodeId = resolveNextNodeId(normalizedState, selectedChoice, nextEpisode);

  const stateAfterEffects = applyChoice(normalizedState, selectedChoice);

  let nextState = normalizeGameState({
    ...stateAfterEffects,
    checkpoint: {
      ...stateAfterEffects.checkpoint,
      episode: parseInt((nextEpisodeId || "").replace("episode_", "")) || 1,
      nodeId: nextNodeId,
      timestamp: Date.now()
    },
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

  nextState = applyObserverMode(nextState);

  // Ending check
  const ending = calculateEnding(nextState);

  switch (ending) {
    case "LOYAL_ENDING":      nextState.endings.loyalEndingUnlocked = true;       break;
    case "BETRAYAL_ENDING":   nextState.endings.betrayalEndingUnlocked = true;    break;
    case "SACRIFICE_ENDING":  nextState.endings.sacrificeEndingUnlocked = true;   break;
    case "REPLACEMENT_ENDING":nextState.endings.replacementEndingUnlocked = true; break;
    case "TRUE_ENDING":       nextState.endings.trueEndingUnlocked = true;        break;
    default: break;
  }

  saveGameState(nextState);
  return nextState;
}

// ─────────────────────────────────────────────
// EXPORTS — PUZZLE
// ─────────────────────────────────────────────

export function saveGameState(gameState) {
  const normalizedState = normalizeGameState(gameState);
  Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(normalizedState) })
    .catch(error => console.error("Kayıt yazma hatası:", error));
}

export async function resetGame() {
  await Preferences.remove({ key: STORAGE_KEY });
}

export function submitPuzzleAnswer(gameState, puzzleId, answer) {
  const normalizedState = normalizeGameState(gameState);
  const episode = getCurrentEpisode(normalizedState);
  const puzzle = findPuzzleById(episode, puzzleId);

  if (!puzzle) throw new Error("Puzzle not found");

  const normalizedInput = normalizeAnswer(answer);
  const acceptedAnswers = Array.isArray(puzzle.acceptedAnswers) ? puzzle.acceptedAnswers : [];
  const isCorrect = acceptedAnswers.some((a) => normalizeAnswer(a) === normalizedInput);

  const currentAttempts = normalizedState.puzzleAttempts?.[puzzleId] || 0;
  const nextPuzzleAttempts = { ...normalizedState.puzzleAttempts, [puzzleId]: currentAttempts + 1 };

  const baseState = { ...normalizedState, activePuzzleId: null, activeWaitTask: null, puzzleAttempts: nextPuzzleAttempts };

  if (isCorrect) {
    const nextNodeId = puzzle.successNodeId || normalizedState.currentNodeId;
    const nextState = normalizeGameState({
      ...baseState,
      currentNodeId: nextNodeId,
      solvedPuzzles: { ...normalizedState.solvedPuzzles, [puzzleId]: true },
      history: [...normalizedState.history, { type: "puzzle", episodeId: episode.id, puzzleId, answer, result: "success", nextNodeId }]
    });
    saveGameState(nextState);
    return { isCorrect: true, puzzle, nextState };
  }

  const nextNodeId = puzzle.failureNodeId || normalizedState.currentNodeId;
  const nextState = normalizeGameState({
    ...baseState,
    currentNodeId: nextNodeId,
    history: [...normalizedState.history, { type: "puzzle", episodeId: episode.id, puzzleId, answer, result: "failure", nextNodeId }]
  });
  saveGameState(nextState);
  return { isCorrect: false, puzzle, nextState };
}

export function clearActivePuzzle(gameState) {
  const normalizedState = normalizeGameState(gameState);
  const nextState = normalizeGameState({ ...normalizedState, activePuzzleId: null });
  saveGameState(nextState);
  return nextState;
}

export function setActivePuzzle(gameState, puzzleId) {
  const normalizedState = normalizeGameState(gameState);
  const nextState = normalizeGameState({ ...normalizedState, activePuzzleId: puzzleId });
  saveGameState(nextState);
  return nextState;
}

export function getActivePuzzle(gameState) {
  const normalizedState = normalizeGameState(gameState);
  if (!normalizedState.activePuzzleId) return null;
  const episode = getCurrentEpisode(normalizedState);
  return findPuzzleById(episode, normalizedState.activePuzzleId);
}

// ─────────────────────────────────────────────
// EXPORTS — WAIT TASK
// ─────────────────────────────────────────────

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
    history: [...normalizedState.history, { type: "waitTaskComplete", waitTaskId: waitTask.id, episodeId: nextEpisodeId, nextNodeId: completeNodeId }]
  });

  saveGameState(nextState);
  return nextState;
}

// ─────────────────────────────────────────────
// EXPORTS — BUSY STATE
// ─────────────────────────────────────────────

export function getRemainingBusyMs(gameState) {
  const busyState = gameState.busyState;
  if (!busyState?.busyUntil) return 0;
  return Math.max(0, busyState.busyUntil - Date.now());
}

export function resolveBusyState(gameState) {
  const busy = gameState.busyState;
  if (!busy) return gameState;
  if (Date.now() < busy.busyUntil) return gameState;

  const nextEpisodeId = busy.returnEpisodeId || gameState.episodeId;
  const nextEpisode = getEpisode(nextEpisodeId);
  const nextNodeId = busy.returnNodeId || nextEpisode.startNodeId;

  const nextState = normalizeGameState({ ...gameState, episodeId: nextEpisodeId, currentNodeId: nextNodeId, busyState: null });
  saveGameState(nextState);
  return nextState;
}

// ─────────────────────────────────────────────
// EXPORTS — FILES
// ─────────────────────────────────────────────

export function collectFile(gameState, file) {
  const normalizedState = normalizeGameState(gameState);
  const existingFile = normalizedState.collectedFiles.find((item) => item.id === file.id);
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
        correlationTags: Array.isArray(file.correlationTags) ? file.correlationTags : [],
        isNew: file.isNew ?? true,
        collectedAt: file.collectedAt || new Date().toISOString()
      }
    ]
  });

  saveGameState(nextState);
  return nextState;
}

export function markFileAsRead(gameState, fileId) {
  const normalizedState = normalizeGameState(gameState);
  const readState = normalizeGameState({
    ...normalizedState,
    collectedFiles: normalizedState.collectedFiles.map((file) =>
      file.id === fileId ? { ...file, isNew: false, readAt: file.readAt || new Date().toISOString() } : file
    )
  });
  const nextState = checkCorrelations(readState);
  saveGameState(nextState);
  return nextState;
}

// ─────────────────────────────────────────────
// EXPORTS — NOTIFICATIONS
// ─────────────────────────────────────────────

export function clearPendingNotifications(gameState) {
  const normalizedState = normalizeGameState(gameState);
  const nextState = normalizeGameState({ ...normalizedState, pendingNotifications: [] });
  saveGameState(nextState);
  return nextState;
}

// ─────────────────────────────────────────────
// EXPORTS — THE ECHO / SIGNAL LOST
// ─────────────────────────────────────────────

export function applySignalLost(gameState) {
  const normalizedState = normalizeGameState(gameState);

  const currentLoopCount = normalizedState.death?.loopCount ?? 0;
  const newLoopCount = currentLoopCount + 1;

  const penaltyState = stateManager.applyEffects(normalizedState, {
    mentalStability: -12,
    trust: -12,
    fear: 3,
    identityFracture: 5
  });

  const nextState = normalizeGameState({
    ...penaltyState,
    death: {
      ...penaltyState.death,
      loopCount: newLoopCount,
      signalLostCount: (penaltyState.death?.signalLostCount ?? 0) + 1,
      timesNearDeath: (penaltyState.death?.timesNearDeath ?? 0) + 1
    },
    history: [
      ...penaltyState.history,
      {
        type: "signalLost",
        loopCount: newLoopCount,
        episodeId: normalizedState.episodeId,
        nodeId: normalizedState.currentNodeId,
        timestamp: new Date().toISOString()
      }
    ]
  });

  saveGameState(nextState);
  return nextState;
}


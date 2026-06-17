import relationshipConfig from "../config/relationshipConfig.json";

function getLevel(value = 0, configSection = {}) {
  for (const [level, range] of Object.entries(configSection)) {
    if (value >= range.min && value <= range.max) {
      return level;
    }
  }

  return null;
}

export function getRelationshipLevels(stats = {}) {
  return {
    trust: getLevel(
      stats.trust,
      relationshipConfig.trust
    ),

    humanity: getLevel(
      stats.humanity,
      relationshipConfig.humanity
    ),

    fear: getLevel(
      stats.fear,
      relationshipConfig.fear
    ),

    resentment: getLevel(
      stats.resentment,
      relationshipConfig.resentment
    ),

    dependency: getLevel(
      stats.dependency,
      relationshipConfig.dependency
    ),

    curiosity: getLevel(
      stats.curiosity,
      relationshipConfig.curiosity
    ),

    riskPattern: getLevel(
      stats.riskPattern,
      relationshipConfig.riskPattern
    )
  };
}

export function getEliasState(stats = {}) {
  const levels =
    getRelationshipLevels(stats);

  if (
    levels.resentment ===
    "rebellious"
  ) {
    return "REBELLIOUS";
  }

  if (
    levels.fear === "breakdown" ||
    levels.fear === "panicked"
  ) {
    return "BROKEN";
  }

  if (
    levels.trust === "loyal" &&
    levels.resentment === "calm"
  ) {
    return "TRUSTING";
  }

  return "CAUTIOUS";
}

export function getEmotionalTone(
  stats = {}
) {
  const levels =
    getRelationshipLevels(stats);

  if (
    levels.resentment ===
    "rebellious"
  ) {
    return "HOSTILE";
  }

  if (
    levels.fear === "breakdown" ||
    levels.fear === "panicked"
  ) {
    return "PANICKED";
  }

  if (
    levels.trust === "loyal"
  ) {
    return "WARM";
  }

  return "NEUTRAL";
}
import { applyConsequence } from "../game/engine/consequenceEngine";
import { getEliasState } from "./relationshipEngine";
import { calculateDeathRisk } from "./deathEngine";

function clamp(value) {
  return Math.max(
    0,
    Math.min(100, value)
  );
}

export function applyChoice(
  save,
  choice
) {
  const nextSave =
    structuredClone(save);

  nextSave.stats =
    nextSave.stats || {};

  nextSave.flags =
    nextSave.flags || {};

  nextSave.relationship =
    nextSave.relationship || {};

  // --------------------
  // STAT EFFECTS
  // --------------------

  if (choice.effects) {
    Object.entries(
      choice.effects
    ).forEach(
      ([stat, value]) => {
        const current =
          nextSave.stats[stat] || 0;

        nextSave.stats[stat] =
          clamp(
            current + value
          );
      }
    );
  }

  // --------------------
  // FLAGS
  // --------------------

  if (choice.flags) {
    Object.entries(
      choice.flags
    ).forEach(
      ([key, value]) => {
        nextSave.flags[key] =
          value;
      }
    );
  }

  // --------------------
  // CONSEQUENCES
  // --------------------

  if (
    Array.isArray(
      choice.consequences
    )
  ) {
    choice.consequences.forEach(
      (consequenceId) => {
        applyConsequence(
          nextSave,
          consequenceId
        );
      }
    );
  }

  // --------------------
  // RELATIONSHIP
  // --------------------

  nextSave.relationship.currentState =
    getEliasState(
      nextSave.stats
    );

  // --------------------
  // DEATH RISK
  // --------------------

  nextSave.stats.deathRisk =
    calculateDeathRisk(
      nextSave
    );

  // --------------------
  // DEATH STATE
  // --------------------

  nextSave.death =
    nextSave.death || {};

  nextSave.death.deathRouteActive =
    nextSave.stats.deathRisk >=
    60;

  nextSave.death.criticalDeathRisk =
    nextSave.stats.deathRisk >=
    85;

  return nextSave;
}
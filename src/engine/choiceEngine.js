import { applyConsequence } from "../game/engine/consequenceEngine";
import { getEliasState } from "./relationshipEngine";
import { calculateDeathRisk } from "./deathEngine";
import stateManager from "./stateManager";

export function applyChoice(
  save,
  choice
) {

  let nextSave =
    structuredClone(save);

  nextSave.stats =
    nextSave.stats || {};

  nextSave.flags =
    nextSave.flags || {};

  nextSave.relationship =
    nextSave.relationship || {};

  // EFFECTLER

  if (
    choice?.effects
  ) {

    nextSave =
      stateManager.applyEffects(
        nextSave,
        choice.effects
      );
  }

  // EKSTRA FLAGLER

  if (
    choice?.flags
  ) {

    Object.entries(
      choice.flags
    ).forEach(
      ([key, value]) => {

        nextSave.flags[key] =
          value;
      }
    );
  }

  // CONSEQUENCES

  if (
    Array.isArray(
      choice?.consequences
    )
  ) {

    choice.consequences.forEach(
      consequenceId => {

        applyConsequence(
          nextSave,
          consequenceId
        );
      }
    );
  }

  // RELATIONSHIP

  nextSave.relationship.currentState =
    getEliasState(
      nextSave.stats
    );

  // DEATH RISK

  nextSave.stats.deathRisk =
    calculateDeathRisk(
      nextSave
    );

  return nextSave;
}
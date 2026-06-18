import memoryEngine from "./memoryEngine";
import injuryEngine from "./injuryEngine";

import {
  isDead
} from "./deathEngine";

function clamp(
  value,
  min = 0,
  max = 100
) {
  return Math.min(
    max,
    Math.max(min, value)
  );
}

class StateManager {

  applyEffects(
    gameState,
    effects = {}
  ) {



    const updatedState =
      structuredClone(
        gameState
      );

    const injuryKeys = [
      "legInjury",
      "armInjury",
      "headTrauma",
      "breathingIssue"
    ];

    Object.entries(
      effects
    ).forEach(
      ([key, value]) => {



        // MEMORY

        if (
          key === "memory"
        ) {

          const memories =
            Array.isArray(value)
              ? value
              : [value];

          memories.forEach(
            memoryId => {


              memoryEngine
                .recordMemory(
                  updatedState,
                  memoryId
                );
            }
          );

          return;
        }

        // INJURIES

        if (
          injuryKeys.includes(
            key
          )
        ) {

          if (
            value === true
          ) {

            injuryEngine
              .applyInjury(
                updatedState,
                key
              );
          }

          if (
            value === false
          ) {

            injuryEngine
              .healInjury(
                updatedState,
                key
              );
          }

          return;
        }

        // STATS

        if (
          updatedState.stats &&
          updatedState.stats[
            key
          ] !== undefined
        ) {

          updatedState.stats[
            key
          ] = clamp(
            updatedState.stats[
              key
            ] + value
          );

          return;
        }

// STATS
if (updatedState.stats && updatedState.stats[key] !== undefined) {
  updatedState.stats[key] = clamp(updatedState.stats[key] + value);
  return;
}

// STORY ← FLAGS'tan ÖNCE
if (updatedState.story && updatedState.story[key] !== undefined) {
  updatedState.story[key] = value;
  return;
}

// RELATIONSHIP ← FLAGS'tan ÖNCE
if (updatedState.relationship && updatedState.relationship[key] !== undefined) {
  updatedState.relationship[key] = value;
  return;
}
// RELATIONSHIP TAGS
if (key === "relationshipTags" && Array.isArray(value)) {
  if (!Array.isArray(updatedState.relationshipTags)) {
    updatedState.relationshipTags = [];
  }
  value.forEach(tag => {
    if (!updatedState.relationshipTags.includes(tag)) {
      updatedState.relationshipTags.push(tag);
    }
  });
  return;
}
      }
    );



    // DEATH CHECK

    if (
      isDead(
        updatedState
      )
    ) {

      updatedState.death =
        updatedState.death || {};

      updatedState.death
        .deathRouteActive = true;


    }

    return updatedState;
  }

  applyChoice(
    gameState,
    choice
  ) {

    return this.applyEffects(
      gameState,
      choice.effects || {}
    );
  }

  applyEvent(
    gameState,
    event
  ) {

    return this.applyEffects(
      gameState,
      event.effects || {}
    );
  }

  applyNode(
    gameState,
    node
  ) {

    return this.applyEffects(
      gameState,
      node.effects || {}
    );
  }
}

export default new StateManager();
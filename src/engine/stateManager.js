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

    console.log(
      "[StateManager] EFFECTS RECEIVED:",
      effects
    );

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

        console.log(
          "[StateManager] Processing:",
          key,
          value
        );

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

              console.log(
                "[StateManager] Adding memory:",
                memoryId
              );

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

        // FLAGS

        if (
          typeof value ===
            "boolean" &&
          updatedState.flags
        ) {

          updatedState.flags[
            key
          ] = value;

          return;
        }

        // STORY

        if (
          updatedState.story &&
          updatedState.story[
            key
          ] !== undefined
        ) {

          updatedState.story[
            key
          ] = value;

          return;
        }

        // RELATIONSHIP

        if (
          updatedState.relationship &&
          updatedState.relationship[
            key
          ] !== undefined
        ) {

          updatedState.relationship[
            key
          ] = value;

          return;
        }
      }
    );

    console.log(
      "[StateManager] Memory after update:",
      updatedState.memory
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

      console.log(
        "[StateManager] Death route activated"
      );
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
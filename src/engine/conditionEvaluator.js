import {hasMemory} from "./memoryEngine";

function checkRange(
  value,
  rule
) {
  if (
    rule?.min !== undefined &&
    value < rule.min
  ) {
    return false;
  }

  if (
    rule?.max !== undefined &&
    value > rule.max
  ) {
    return false;
  }

  return true;
}

export function evaluateConditions(
  save,
  conditions = {}
) {
  if (!conditions) {
    return true;
  }

  for (const [key, rule] of Object.entries(
    conditions
  )) {

    /*
     * MEMORY
     */

    if (
      key.startsWith("memory:")
    ) {
      const memoryId =
        key.replace(
          "memory:",
          ""
        );

      const exists =
        hasMemory(
          save,
          memoryId
        );

      if (exists !== rule) {
        return false;
      }

      continue;
    }

    /*
     * TAG
     */

    if (
      key.startsWith("tag:")
    ) {
      const tag =
        key.replace(
          "tag:",
          ""
        );

      const exists =
        (
          save.relationshipTags ||
          []
        ).includes(tag);

      if (exists !== rule) {
        return false;
      }

      continue;
    }

    /*
     * STATS
     */

    if (
      save.stats?.[key] !== undefined
    ) {
      if (
        !checkRange(
          save.stats[key],
          rule
        )
      ) {
        return false;
      }

      continue;
    }

    /*
     * FLAGS
     */

    if (
      save.flags?.[key] !== undefined
    ) {
      if (
        save.flags[key] !== rule
      ) {
        return false;
      }

      continue;
    }

    /*
     * STORY
     */

    if (
      save.story?.[key] !== undefined
    ) {
      if (
        save.story[key] !== rule
      ) {
        return false;
      }

      continue;
    }

    /*
     * INJURIES
     */

    if (
      save.injuries?.[key] !== undefined
    ) {
      if (
        save.injuries[key] !== rule
      ) {
        return false;
      }

      continue;
    }

    /*
     * EPISODE
     */

    if (key === "episode") {
      if (
        !checkRange(
          save.currentEpisode,
          rule
        )
      ) {
        return false;
      }

      continue;
    }
  }

  return true;
}
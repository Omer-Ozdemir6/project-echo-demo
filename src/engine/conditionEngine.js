import { hasMemory } from "./memoryEngine";

export function evaluateConditions(
  save,
  conditions
) {
  if (!conditions) {
    return true;
  }

  for (const [key, rule] of Object.entries(conditions)) {

    // --------------------------------
    // MEMORY
    // --------------------------------

    if (key.startsWith("memory:")) {
      const memoryId = key.replace(
        "memory:",
        ""
      );

      const exists = hasMemory(
        save,
        memoryId
      );

      if (exists !== rule) {
        return false;
      }

      continue;
    }

    // --------------------------------
    // RELATIONSHIP TAGS
    // --------------------------------

    if (key.startsWith("tag:")) {
      const tag = key.replace(
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

    // --------------------------------
    // STORY FLAGS
    // --------------------------------

    if (
      save.story &&
      key in save.story
    ) {
      if (
        save.story[key] !== rule
      ) {
        return false;
      }

      continue;
    }

    // --------------------------------
    // FLAGS
    // --------------------------------

    if (
      save.flags &&
      key in save.flags
    ) {
      if (
        save.flags[key] !== rule
      ) {
        return false;
      }

      continue;
    }

    // --------------------------------
    // STATS
    // --------------------------------

    if (
      typeof rule === "object" &&
      (
        rule.min !== undefined ||
        rule.max !== undefined
      )
    ) {
      const value =
        save.stats?.[key] ?? 0;

      if (
        rule.min !== undefined &&
        value < rule.min
      ) {
        return false;
      }
      if (key === "observerMode") {
  const currentMode = save.story?.observerMode || "passive";
  if (currentMode !== rule) {
    return false;
  }
  continue;
}

      if (
        rule.max !== undefined &&
        value > rule.max
      ) {
        return false;
      }

      continue;
    }
  }

  return true;
}
import endingConfig from "../config/endingConfig.json";

export function calculateEnding(save) {
  if (
    matchesEnding(
      save,
      endingConfig.TRUE_ENDING.conditions
    )
  ) {
    return "TRUE_ENDING";
  }

  if (
    matchesEnding(
      save,
      endingConfig.SACRIFICE_ENDING.conditions
    )
  ) {
    return "SACRIFICE_ENDING";
  }

  if (
    matchesEnding(
      save,
      endingConfig.LOYAL_ENDING.conditions
    )
  ) {
    return "LOYAL_ENDING";
  }

  if (
    matchesEnding(
      save,
      endingConfig.BETRAYAL_ENDING.conditions
    )
  ) {
    return "BETRAYAL_ENDING";
  }

  if (
    matchesEnding(
      save,
      endingConfig.REPLACEMENT_ENDING.conditions
    )
  ) {
    return "REPLACEMENT_ENDING";
  }

  return "DEFAULT_ENDING";
}

function checkRange(
  value,
  rule
) {
  if (
    rule.min !== undefined &&
    value < rule.min
  ) {
    return false;
  }

  if (
    rule.max !== undefined &&
    value > rule.max
  ) {
    return false;
  }

  return true;
}

function hasMemory(
  save,
  memoryId
) {
  return [
    ...(save.memory?.minor || []),
    ...(save.memory?.major || []),
    ...(save.memory?.critical || [])
  ].includes(memoryId);
}

function matchesEnding(
  save,
  conditions
) {
  for (
    const [key, rule]
    of Object.entries(
      conditions
    )
  ) {
    const statValue =
      save.stats?.[key];

    const flagValue =
      save.flags?.[key];

    const storyValue =
      save.story?.[key];

    if (
      typeof rule === "object" &&
      (rule.min !== undefined ||
        rule.max !== undefined)
    ) {
      const value =
        statValue ??
        flagValue ??
        storyValue;

      if (
        !checkRange(
          value ?? 0,
          rule
        )
      ) {
        return false;
      }

      continue;
    }

    // memory check

    if (
      key.startsWith(
        "memory:"
      )
    ) {
      const memoryId =
        key.replace(
          "memory:",
          ""
        );

      if (
        hasMemory(
          save,
          memoryId
        ) !== rule
      ) {
        return false;
      }

      continue;
    }

    // relationship tag check

    if (
      key.startsWith(
        "tag:"
      )
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

      if (
        exists !== rule
      ) {
        return false;
      }

      continue;
    }

    const value =
      flagValue ??
      storyValue;

    if (
      value !== rule
    ) {
      return false;
    }
  }

  return true;
}
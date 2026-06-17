import { getEliasState } from "./relationshipEngine";
import { ELIAS_DIALOGUE_PROFILES } from "./eliasDialogueProfiles";

export function getDialogueProfile(save) {
  const state = getEliasState(
    save?.stats || {}
  );

  return (
    ELIAS_DIALOGUE_PROFILES[state] ||
    ELIAS_DIALOGUE_PROFILES.CAUTIOUS
  );
}

export function resolveDialogue(
  save,
  variants
) {
  if (!variants) {
    return "";
  }

  const state = getEliasState(
    save?.stats || {}
  );

  return (
    variants[state] ||
    variants.CAUTIOUS ||
    Object.values(variants)[0] ||
    ""
  );
}

export function getDialogueContext(
  save
) {
  const state = getEliasState(
    save?.stats || {}
  );

  return {
    state,
    profile:
      ELIAS_DIALOGUE_PROFILES[state],
    stats:
      save?.stats || {},
    flags:
      save?.flags || {},
    memory:
      save?.memory || {}
  };
}
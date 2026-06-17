import { getEliasState } from "./relationshipEngine";
import {
ELIAS_DIALOGUE_PROFILES,
DEFAULT_DIALOGUE_PROFILE
} from "./eliasDialogueProfiles";

export function getDialogueContext(
save
) {
const state =
getEliasState(
save?.stats || {}
);

const profile =
ELIAS_DIALOGUE_PROFILES[
state
] ||
DEFAULT_DIALOGUE_PROFILE;

return {
state,
profile,
stats: save?.stats || {},
flags: save?.flags || {},
memory: save?.memory || {}
};
}

export function resolveDialogue(
save,
variants
) {
if (!variants) {
return "";
}

const state =
getEliasState(
save?.stats || {}
);

return (
variants[state] ||
variants.CAUTIOUS ||
Object.values(
variants
)[0] ||
""
);
}

export function shouldObeyOrder(
save
) {
const trust =
save?.stats?.trust || 0;

const resentment =
save?.stats?.resentment || 0;

if (resentment > 80) {
return false;
}

if (trust < 20) {
return false;
}

return true;
}

export function shouldShareSecret(
save
) {
const state =
getEliasState(
save?.stats || {}
);

const profile =
ELIAS_DIALOGUE_PROFILES[
state
] ||
DEFAULT_DIALOGUE_PROFILE;

return (
profile.sharesSecrets
);
}

export function getEmotionalTone(
save
) {
const fear =
save?.stats?.fear || 0;

const trust =
save?.stats?.trust || 0;

const resentment =
save?.stats?.resentment || 0;

if (resentment > 70) {
return "HOSTILE";
}

if (fear > 70) {
return "PANICKED";
}

if (trust > 80) {
return "WARM";
}

return "NEUTRAL";
}

export function canRejectOrder(
save
) {
const state =
getEliasState(
save?.stats || {}
);

const profile =
ELIAS_DIALOGUE_PROFILES[
state
] ||
DEFAULT_DIALOGUE_PROFILE;

return (
profile.canRejectOrders
);
}

export function shouldQuestionOrder(
save
) {
const state =
getEliasState(
save?.stats || {}
);

const profile =
ELIAS_DIALOGUE_PROFILES[
state
] ||
DEFAULT_DIALOGUE_PROFILE;

return (
profile.questionsOrders
);
}

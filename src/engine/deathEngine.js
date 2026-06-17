import deathConfig from "../config/deathConfig.json";

export function isDeathRouteActive(
save
) {
const risk =
calculateDeathRisk(save);

return (
risk >=
deathConfig.deathRouteThreshold
);
}

export function isCriticalDeathRisk(
save
) {
const risk =
calculateDeathRisk(save);

return (
risk >=
deathConfig.criticalDeathThreshold
);
}

export function addInjury(
save,
injuryType
) {
save.injuries =
save.injuries || {};

save.injuries[
injuryType
] = true;

return save;
}

export function removeInjury(
save,
injuryType
) {
if (
save.injuries?.[
injuryType
]
) {
delete save.injuries[
injuryType
];
}

return save;
}

export function hasInjury(
save,
injuryType
) {
return Boolean(
save.injuries?.[
injuryType
]
);
}

export function getActiveInjuries(
save
) {
return Object.keys(
save.injuries || {}
).filter(
(injury) =>
save.injuries[injury]
);
}

export function calculateDeathRisk(
save
) {
let risk =
save?.stats?.deathRisk || 0;

const injuries =
save?.injuries || {};

Object.entries(
deathConfig.injuryRisk
).forEach(
([injury, value]) => {
if (
injuries[injury]
) {
risk += value;
}
}
);

risk +=
(save?.stats?.fear || 0) *
deathConfig.fearRiskMultiplier;

risk +=
(save?.stats?.resentment || 0) *
deathConfig.resentmentRiskMultiplier;

risk -=
(save?.stats?.trust || 0) *
deathConfig.trustProtectionMultiplier;

return Math.max(
0,
Math.min(
100,
Math.round(risk)
)
);
}

export function isDead(
save
) {
return (
calculateDeathRisk(save) >=
100
);
}

export function shouldTriggerDeathEnding(
save
) {
return (
isCriticalDeathRisk(save) &&
getActiveInjuries(save)
.length >= 2
);
}

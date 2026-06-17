import consequenceConfig from "../../config/consequenceConfig.json";

function clamp(value, min = 0, max = 100) {
return Math.max(min, Math.min(max, value));
}

export function hasMemory(save, memoryId) {
return [
...(save?.memory?.minor || []),
...(save?.memory?.major || []),
...(save?.memory?.critical || [])
].includes(memoryId);
}

export function hasFutureEvent(save, eventId) {
return (save?.scheduledEvents || []).some((event) => {
return (
event.id === eventId &&
event.status === "pending"
);
});
}

export function completeFutureEvent(save, eventId) {
const event = save?.scheduledEvents?.find(
(e) => e.id === eventId
);

if (event) {
event.status = "completed";
}

save.completedEvents =
save.completedEvents || [];

if (!save.completedEvents.includes(eventId)) {
save.completedEvents.push(eventId);
}

return save;
}

export function applyConsequence(
save,
consequenceId
) {
const consequence =
consequenceConfig[consequenceId];

if (!consequence) {
console.warn(
`[ConsequenceEngine] Unknown consequence: ${consequenceId}`
);
return save;
}

save.flags = save.flags || {};

save.memory =
save.memory || {
minor: [],
major: [],
critical: []
};

save.stats = save.stats || {};

save.relationshipTags =
save.relationshipTags || [];

save.scheduledEvents =
save.scheduledEvents || [];

const flagName =
consequence.flag || consequenceId;

save.flags[flagName] = true;

const memoryType =
consequence.memoryType || "minor";

if (
!["minor", "major", "critical"].includes(
memoryType
)
) {
console.warn(
`[ConsequenceEngine] Invalid memory type: ${memoryType}`
);
return save;
}

if (
!save.memory[memoryType].includes(
consequenceId
)
) {
save.memory[memoryType].push(
consequenceId
);
}

if (consequence.statEffects) {
Object.entries(
consequence.statEffects
).forEach(([statName, amount]) => {
const currentValue =
save.stats[statName] || 0;


  save.stats[statName] = clamp(
    currentValue + amount
  );
});


}

if (
Array.isArray(
consequence.relationshipTags
)
) {
consequence.relationshipTags.forEach(
(tag) => {
if (
!save.relationshipTags.includes(
tag
)
) {
save.relationshipTags.push(tag);
}
}
);
}

if (
Array.isArray(
consequence.futureEvents
)
) {
consequence.futureEvents.forEach(
(eventId) => {
const exists =
save.scheduledEvents.some(
(event) =>
event.id === eventId
);

    if (!exists) {
      save.scheduledEvents.push({
        id: eventId,
        source: consequenceId,
        status: "pending",
        createdAt: Date.now()
      });
    }
  }
);


}

return save;
}

export function countRelationshipTag(
save,
tag
) {
return (
save?.relationshipTags || []
).filter(
(currentTag) =>
currentTag === tag
).length;
}

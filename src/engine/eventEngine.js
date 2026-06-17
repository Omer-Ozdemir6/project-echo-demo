import eventConfig from "../config/eventConfig.json";

export function scheduleEvent(
save,
eventId,
currentEpisode
) {
const config =
eventConfig[eventId];

if (!config) {
return save;
}

save.scheduledEvents =
save.scheduledEvents || [];

if (
  gameState.completedEvents.includes(eventId)
) {
  return;
}

const alreadyScheduled =
  gameState.scheduledEvents.some(
    event => event.id === eventId
  );

if (alreadyScheduled) {
  return;
}

save.scheduledEvents.push({
id: eventId,
sourceEpisode:
currentEpisode,
triggerEpisode:
currentEpisode +
config.triggerAfterEpisodes,
status: "pending"
});

return save;
}

export function getTriggeredEvents(
save,
currentEpisode
) {
return (
save?.scheduledEvents || []
).filter((event) => {
if (
event.status !== "pending"
) {
return false;
}

```
return (
  currentEpisode >=
  event.triggerEpisode
);
```

});
}

export function completeEvent(
save,
eventId
) {
save.scheduledEvents =
save.scheduledEvents || [];

save.completedEvents =
save.completedEvents || [];

const event =
save.scheduledEvents.find(
(e) =>
e.id === eventId
);

if (event) {
event.status =
"completed";
}

if (
!save.completedEvents.includes(
eventId
)
) {
save.completedEvents.push(
eventId
);
}

return save;
}

export function canTriggerEvent(
save,
eventId
) {
const config =
eventConfig[eventId];

if (!config) {
return false;
}

if (
config.requiredFlags
) {
const allFlagsExist =
config.requiredFlags.every(
(flag) =>
save.flags?.[flag]
);

```
if (!allFlagsExist) {
  return false;
}
```

}

if (
config.minimumTrust !==
undefined &&
save.stats?.trust <
config.minimumTrust
) {
return false;
}

if (
config.minimumResentment !==
undefined &&
save.stats?.resentment <
config.minimumResentment
) {
return false;
}

return true;
}

export function isEventCompleted(
save,
eventId
) {
return (
save?.completedEvents || []
).includes(eventId);
}

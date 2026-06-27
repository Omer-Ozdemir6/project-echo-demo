import eventConfig from "../config/eventConfig.json";

export function scheduleEvent(
 save,
 eventId
) {
const config =
eventConfig[eventId];

if (!config) {
return save;
}

save.scheduledEvents =
save.scheduledEvents || [];

if (
  save.completedEvents.includes(eventId)
 ) {
  return save;
 }

const alreadyScheduled =
  save.scheduledEvents.some(
    event => event.id === eventId
  );

if (alreadyScheduled) {
  return save;
 }

save.scheduledEvents.push({
id: eventId,
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
return (
  currentEpisode >=
  event.triggerEpisode
);
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
 if (
   !config.requiredFlags.every(
     (flag) =>
     save.flags?.[flag]
   )
 ) {
  return false;
 }

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

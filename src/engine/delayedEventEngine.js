import delayedEvents
from "../data/system/delayed-events.json";

class DelayedEventEngine {

  processEpisodeTransition(
    gameState,
    currentEpisode
  ) {

    Object.entries(delayedEvents)
      .forEach(([eventId, config]) => {

        if (
          gameState.completedEvents.includes(
            eventId
          )
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

        const hasFlags =
          config.requiredFlags.every(
            flag =>
              gameState.flags?.[flag]
          );

        if (!hasFlags) {
          return;
        }

        gameState.scheduledEvents.push({
          id: eventId,
          targetEpisode:
            currentEpisode +
            config.triggerAfterEpisodes
        });
      });

    return gameState;
  }

  getEventsForEpisode(
    gameState,
    episode
  ) {
    return gameState.scheduledEvents.filter(
      event =>
        event.targetEpisode === episode
    );
  }

  markCompleted(
    gameState,
    eventId
  ) {

    if (
      !gameState.completedEvents.includes(
        eventId
      )
    ) {
      gameState.completedEvents.push(
        eventId
      );
    }

    gameState.scheduledEvents =
      gameState.scheduledEvents.filter(
        e => e.id !== eventId
      );

    return gameState;
  }
}

export default new DelayedEventEngine();
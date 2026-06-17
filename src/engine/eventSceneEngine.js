import eventScenes from "../data/system/event-scenes.json";

import delayedEventEngine from "./delayedEventEngine";
import callbackEngine from "./callbackEngine";

class EventSceneEngine {

  getEpisodeEvents(
    gameState,
    currentEpisode
  ) {

    const delayedEvents =
      delayedEventEngine
        .getEventsForEpisode(
          gameState,
          currentEpisode
        );

    const callbackEvents =
      callbackEngine
        .getAvailableCallbacks(
          gameState,
          currentEpisode
        );

    const allEvents = [
      ...delayedEvents,
      ...callbackEvents.map(
        eventId => ({
          id: eventId,
          source: "callback"
        })
      )
    ];

    const resolvedEvents = [];

    allEvents.forEach(
      event => {

        const eventId =
          event.id;

        const scene =
          eventScenes[
            eventId
          ];

        if (!scene) {
          return;
        }

        resolvedEvents.push({
          eventId,
          source:
            event.source ||
            "delayed",
          ...scene
        });
      }
    );

    return resolvedEvents;
  }

  injectIntoEpisode(
    gameState,
    currentEpisode,
    episodeData
  ) {

    const episodeEvents =
      this.getEpisodeEvents(
        gameState,
        currentEpisode
      );

    if (
      episodeEvents.length === 0
    ) {
      return episodeData;
    }

    const updatedEpisode =
      structuredClone(
        episodeData
      );

    const startNode =
      updatedEpisode.nodes[
        updatedEpisode.startNodeId
      ];

    episodeEvents.forEach(
      eventScene => {

        if (
          eventScene.events
        ) {

          startNode.events = [
            ...eventScene.events,
            ...startNode.events
          ];
        }

        if (
          eventScene.source ===
          "delayed"
        ) {

          delayedEventEngine
            .markCompleted(
              gameState,
              eventScene.eventId
            );
        }

        if (
          eventScene.source ===
          "callback"
        ) {

          gameState.completedEvents =
            [
              ...new Set([
                ...(gameState.completedEvents || []),
                eventScene.eventId
              ])
            ];
        }
      }
    );

    return updatedEpisode;
  }
}

export default new EventSceneEngine();
import callbackConfig from "../config/callbackConfig.json";

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

class CallbackEngine {

  getAvailableCallbacks(
    save,
    currentEpisode
  ) {

    return Object.entries(
      callbackConfig
    )
      .filter(
        ([callbackId, config]) =>
          this.canTrigger(
            save,
            currentEpisode,
            callbackId,
            config
          )
      )
      .map(
        ([callbackId]) =>
          callbackId
      );
  }

  canTrigger(
    save,
    currentEpisode,
    callbackId,
    config
  ) {

    const usageCount =
      save.callbackUsage?.[
        callbackId
      ] || 0;

    if (
      usageCount >=
      (config.maxUses || 1)
    ) {
      return false;
    }

    if (
      currentEpisode <
      (config.minimumEpisode || 1)
    ) {
      return false;
    }

    // MEMORY

    if (
      config.requiredMemory
    ) {

      const memories =
        Array.isArray(
          config.requiredMemory
        )
          ? config.requiredMemory
          : [
              config.requiredMemory
            ];

      const hasAll =
        memories.every(
          memoryId =>
            hasMemory(
              save,
              memoryId
            )
        );

      if (!hasAll) {
        return false;
      }
    }

    // FLAGS

    if (
      config.requiredFlags
    ) {

      const hasFlags =
        config.requiredFlags.every(
          flag =>
            save.flags?.[
              flag
            ] === true
        );

      if (!hasFlags) {
        return false;
      }
    }

    // TRUST

    if (
      config.minimumTrust !==
      undefined
    ) {

      if (
        save.stats.trust <
        config.minimumTrust
      ) {
        return false;
      }
    }

    // RESENTMENT

    if (
      config.minimumResentment !==
      undefined
    ) {

      if (
        save.stats
          .resentment <
        config.minimumResentment
      ) {
        return false;
      }
    }

    // HUMANITY

    if (
      config.minimumHumanity !==
      undefined
    ) {

      if (
        save.stats.humanity <
        config.minimumHumanity
      ) {
        return false;
      }
    }

    return true;
  }

  markTriggered(
    save,
    callbackId
  ) {

    if (
      !save.callbackUsage
    ) {

      save.callbackUsage = {};
    }

    save.callbackUsage[
      callbackId
    ] =
      (
        save.callbackUsage[
          callbackId
        ] || 0
      ) + 1;
  }
}

export default new CallbackEngine();
import memoryDefinitions from "../config/memory-definitions.json";

class MemoryEngine {

  recordMemory(
    save,
    memoryId
  ) {

    console.log(
      "[MemoryEngine] recordMemory called:",
      memoryId
    );

    const config =
      memoryDefinitions[
        memoryId
      ];

    if (!config) {

      console.warn(
        `[MemoryEngine] Unknown memory: ${memoryId}`
      );

      return;
    }

    const memoryType =
      config.memoryType ||
      config.importance ||
      "minor";

    if (!save.memory) {

      save.memory = {
        minor: [],
        major: [],
        critical: []
      };
    }

    if (
      !save.memory[
        memoryType
      ]
    ) {

      save.memory[
        memoryType
      ] = [];
    }

    const alreadyExists =
      save.memory[
        memoryType
      ].includes(
        memoryId
      );

    if (
      alreadyExists
    ) {

      console.log(
        `[MemoryEngine] Memory already exists: ${memoryId}`
      );

      return;
    }

    save.memory[
      memoryType
    ].push(
      memoryId
    );

    console.log(
      `[MemoryEngine] Added ${memoryId} (${memoryType})`
    );

    console.log(
      "[MemoryEngine] Current memory:",
      save.memory
    );
  }

  hasMemory(
    save,
    memoryId
  ) {

    return [
      ...(save?.memory?.minor || []),
      ...(save?.memory?.major || []),
      ...(save?.memory?.critical || [])
    ].includes(
      memoryId
    );
  }

  getMemoryType(
    save,
    memoryId
  ) {

    if (
      save?.memory?.critical?.includes(
        memoryId
      )
    ) {
      return "critical";
    }

    if (
      save?.memory?.major?.includes(
        memoryId
      )
    ) {
      return "major";
    }

    if (
      save?.memory?.minor?.includes(
        memoryId
      )
    ) {
      return "minor";
    }

    return null;
  }

  getAllMemories(save) {

    return [
      ...(save?.memory?.minor || []),
      ...(save?.memory?.major || []),
      ...(save?.memory?.critical || [])
    ];
  }

  getAllMemoriesByType(
    save,
    type
  ) {

    return save?.memory?.[type] || [];
  }

  countMemories(save) {
    return this.getAllMemories(save).length;
  }

  countCriticalMemories(save) {
    return (save?.memory?.critical || []).length;
  }

  countMajorMemories(save) {
    return (save?.memory?.major || []).length;
  }

  countMinorMemories(save) {
    return (save?.memory?.minor || []).length;
  }

  getMostImportantMemories(save) {

    return [
      ...(save?.memory?.critical || []),
      ...(save?.memory?.major || [])
    ];
  }
}

const memoryEngine =
  new MemoryEngine();

export default memoryEngine;

export const hasMemory =
  memoryEngine.hasMemory.bind(
    memoryEngine
  );

export const getMemoryType =
  memoryEngine.getMemoryType.bind(
    memoryEngine
  );

export const getAllMemories =
  memoryEngine.getAllMemories.bind(
    memoryEngine
  );

export const getAllMemoriesByType =
  memoryEngine.getAllMemoriesByType.bind(
    memoryEngine
  );

export const countMemories =
  memoryEngine.countMemories.bind(
    memoryEngine
  );

export const countCriticalMemories =
  memoryEngine.countCriticalMemories.bind(
    memoryEngine
  );

export const countMajorMemories =
  memoryEngine.countMajorMemories.bind(
    memoryEngine
  );

export const countMinorMemories =
  memoryEngine.countMinorMemories.bind(
    memoryEngine
  );

export const getMostImportantMemories =
  memoryEngine.getMostImportantMemories.bind(
    memoryEngine
  );
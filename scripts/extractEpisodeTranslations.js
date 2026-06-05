import fs from "fs";
import path from "path";

const EPISODES_DIR = path.resolve("src/data/episodes");
const EN_LOCALE_PATH = path.resolve("src/locales/en/game.json");

const TRANSLATABLE_FIELDS = [
  "text",
  "title",
  "description",
  "content",
  "caption",
  "message",
  "prompt",
  "submitLabel",
  "placeholder",
  "completeText",
  "restoreMessage"
];

function toKeyField(field) {
  return `${field}Key`;
}

function readJson(filePath, fallback = {}) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function setNestedValue(obj, keyPath, value) {
  const parts = keyPath.split(".");
  let cursor = obj;

  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i];

    if (!cursor[part] || typeof cursor[part] !== "object") {
      cursor[part] = {};
    }

    cursor = cursor[part];
  }

  cursor[parts[parts.length - 1]] = value;
}

function normalizeEpisodeKey(episodeId) {
  return String(episodeId || "unknown_episode")
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/_+/g, "_");
}

function makeTranslationKey({ episodeId, nodeId, section, index, field }) {
  const safeEpisode = normalizeEpisodeKey(episodeId);
  const safeNode = String(nodeId || section || "meta").replace(/[^a-zA-Z0-9_]/g, "_");

  return `${safeEpisode}.${safeNode}.${section}${index}.${field}`;
}

function shouldTranslate(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function processObject({
  target,
  episodeId,
  nodeId,
  section,
  index,
  locale
}) {
  if (!target || typeof target !== "object") return;

  TRANSLATABLE_FIELDS.forEach((field) => {
    const keyField = toKeyField(field);

    if (!shouldTranslate(target[field])) return;
    if (target[keyField]) return;

    const translationKey = makeTranslationKey({
      episodeId,
      nodeId,
      section,
      index,
      field
    });

    target[keyField] = translationKey;
    setNestedValue(locale, translationKey, target[field]);
  });
}

function processEpisode(episode, locale) {
  const episodeId = episode.id;

  processObject({
    target: episode,
    episodeId,
    nodeId: "meta",
    section: "episode",
    index: 0,
    locale
  });

  Object.entries(episode.puzzles || {}).forEach(([puzzleId, puzzle], puzzleIndex) => {
    processObject({
      target: puzzle,
      episodeId,
      nodeId: puzzleId,
      section: "puzzle",
      index: puzzleIndex,
      locale
    });

    if (Array.isArray(puzzle.fragments)) {
      puzzle.fragments = puzzle.fragments.map((fragment, fragmentIndex) => {
        if (!shouldTranslate(fragment)) return fragment;

        const key = makeTranslationKey({
          episodeId,
          nodeId: puzzleId,
          section: "fragment",
          index: fragmentIndex,
          field: "text"
        });

        setNestedValue(locale, key, fragment);

        return {
          textKey: key,
          text: fragment
        };
      });
    }
  });

  Object.entries(episode.nodes || {}).forEach(([nodeId, node]) => {
    processObject({
      target: node,
      episodeId,
      nodeId,
      section: "node",
      index: 0,
      locale
    });

    (node.events || []).forEach((event, eventIndex) => {
      processObject({
        target: event,
        episodeId,
        nodeId,
        section: "event",
        index: eventIndex,
        locale
      });

      if (event.event && typeof event.event === "object") {
        processObject({
          target: event.event,
          episodeId,
          nodeId,
          section: "backgroundEvent",
          index: eventIndex,
          locale
        });
      }
    });

    (node.choices || []).forEach((choice, choiceIndex) => {
      processObject({
        target: choice,
        episodeId,
        nodeId,
        section: "choice",
        index: choiceIndex,
        locale
      });
    });
  });

  return episode;
}

function main() {
  if (!fs.existsSync(EPISODES_DIR)) {
    throw new Error(`Episodes folder not found: ${EPISODES_DIR}`);
  }

  const locale = readJson(EN_LOCALE_PATH, {});

  const episodeFiles = fs
    .readdirSync(EPISODES_DIR)
    .filter((file) => file.endsWith(".json"))
    .sort();

  episodeFiles.forEach((fileName) => {
    const filePath = path.join(EPISODES_DIR, fileName);
    const episode = readJson(filePath);

    const updatedEpisode = processEpisode(episode, locale);

    writeJson(filePath, updatedEpisode);

    console.log(`Updated: ${fileName}`);
  });

  writeJson(EN_LOCALE_PATH, locale);

  console.log("Done.");
  console.log(`Locale updated: ${EN_LOCALE_PATH}`);
}

main();
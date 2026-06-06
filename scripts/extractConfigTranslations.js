import fs from "fs";
import path from "path";

const CONFIG_FILES = [
  {
    name: "boot",
    filePath: path.resolve("src/data/boot.config.json")
  },
  {
    name: "game",
    filePath: path.resolve("src/data/game.config.json")
  }
];

const EN_LOCALE_PATH = path.resolve("src/locales/en/game.json");

const TRANSLATABLE_FIELDS = [
  "label",
  "kicker",
  "title",
  "buttonText",
  "buttonLoadingText",
  "restartingText",
  "countdownLabel",
  "gameTitle",
  "subtitle",
  "terminalTitle",
  "terminalSubtitle",
  "author",
  "link",
  "signal"
];

function readJson(filePath, fallback = {}) {
  if (!fs.existsSync(filePath)) return fallback;

  const content = fs.readFileSync(filePath, "utf8").trim();

  if (!content) return fallback;

  return JSON.parse(content);
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

function shouldTranslate(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function makeKey(configName, pathParts, field) {
  return [
    "config",
    configName,
    ...pathParts.map((part) =>
      String(part)
        .replace(/[^a-zA-Z0-9_]/g, "_")
        .replace(/_+/g, "_")
    ),
    field
  ].join(".");
}

function processObject(target, locale, configName, pathParts = []) {
  if (!target || typeof target !== "object") return;

  if (Array.isArray(target)) {
    target.forEach((item, index) => {
      if (typeof item === "string") {
        const key = makeKey(configName, [...pathParts, index], "text");

        setNestedValue(locale, key, item);

        target[index] = {
          text: item,
          textKey: key
        };

        return;
      }

      processObject(item, locale, configName, [...pathParts, index]);
    });

    return;
  }

  Object.entries(target).forEach(([field, value]) => {
    if (TRANSLATABLE_FIELDS.includes(field) && shouldTranslate(value)) {
      const keyField = `${field}Key`;

      if (!target[keyField]) {
        const key = makeKey(configName, pathParts, field);

        target[keyField] = key;
        setNestedValue(locale, key, value);
      }

      return;
    }

    if (Array.isArray(value) || (value && typeof value === "object")) {
      processObject(value, locale, configName, [...pathParts, field]);
    }
  });
}

function main() {
  const locale = readJson(EN_LOCALE_PATH, {});

  CONFIG_FILES.forEach((config) => {
    const data = readJson(config.filePath);

    processObject(data, locale, config.name);

    writeJson(config.filePath, data);

    console.log(`Updated config: ${config.filePath}`);
  });

  writeJson(EN_LOCALE_PATH, locale);

  console.log("Config translations extracted.");
}

main();
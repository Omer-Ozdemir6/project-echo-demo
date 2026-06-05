import fs from "fs";
import path from "path";

const EN_LOCALE_PATH = path.resolve("src/locales/en/game.json");
const TR_LOCALE_PATH = path.resolve("src/locales/tr/game.json");

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

function mirrorLocaleShape(enNode, trNode = {}) {
  if (typeof enNode === "string") {
    return typeof trNode === "string" && trNode.trim() ? trNode : enNode;
  }

  if (Array.isArray(enNode)) {
    return enNode.map((item, index) => mirrorLocaleShape(item, trNode[index]));
  }

  if (enNode && typeof enNode === "object") {
    const result = {};

    Object.entries(enNode).forEach(([key, value]) => {
      result[key] = mirrorLocaleShape(value, trNode?.[key]);
    });

    return result;
  }

  return enNode;
}

function main() {
  const enLocale = readJson(EN_LOCALE_PATH, {});
  const existingTrLocale = readJson(TR_LOCALE_PATH, {});

  const nextTrLocale = mirrorLocaleShape(enLocale, existingTrLocale);

  writeJson(TR_LOCALE_PATH, nextTrLocale);

  console.log("TR locale generated.");
  console.log(`Updated: ${TR_LOCALE_PATH}`);
}

main();
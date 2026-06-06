import fs from "fs";
import path from "path";

const EN_LOCALE_DIR = path.resolve("src/locales/en");
const TR_LOCALE_DIR = path.resolve("src/locales/tr");

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
    return enNode.map((item, index) => mirrorLocaleShape(item, trNode?.[index]));
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
  if (!fs.existsSync(EN_LOCALE_DIR)) {
    throw new Error(`EN locale folder not found: ${EN_LOCALE_DIR}`);
  }

  const localeFiles = fs
    .readdirSync(EN_LOCALE_DIR)
    .filter((file) => file.endsWith(".json"))
    .sort();

  localeFiles.forEach((fileName) => {
    const enPath = path.join(EN_LOCALE_DIR, fileName);
    const trPath = path.join(TR_LOCALE_DIR, fileName);

    const enLocale = readJson(enPath, {});
    const existingTrLocale = readJson(trPath, {});

    const nextTrLocale = mirrorLocaleShape(enLocale, existingTrLocale);

    writeJson(trPath, nextTrLocale);

    console.log(`TR locale generated: ${fileName}`);
  });

  console.log("Done.");
  console.log(`TR locale folder updated: ${TR_LOCALE_DIR}`);
}

main();
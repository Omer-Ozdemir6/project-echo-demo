import fs from "fs";
import path from "path";

const LOCALES_DIR = path.resolve("src/locales");
const LANGUAGES = ["en", "tr"];

function toImportName(fileName) {
  return fileName
    .replace(".json", "")
    .replace(/-/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "");
}

function generateIndex(language) {
  const localeDir = path.join(LOCALES_DIR, language);

  if (!fs.existsSync(localeDir)) {
    console.warn(`Skipped missing folder: ${localeDir}`);
    return;
  }

  const jsonFiles = fs
    .readdirSync(localeDir)
    .filter((file) => file.endsWith(".json"))
    .sort((a, b) => {
      if (a === "game.json") return -1;
      if (b === "game.json") return 1;
      return a.localeCompare(b);
    });

  const imports = jsonFiles
    .map((file) => {
      const name = toImportName(file);
      return `import ${name} from "./${file}";`;
    })
    .join("\n");

  const spreads = jsonFiles
    .map((file) => `  ...${toImportName(file)}`)
    .join(",\n");

  const content = `${imports}

const locale = {
${spreads}
};

export default locale;
`;

  fs.writeFileSync(path.join(localeDir, "index.js"), content, "utf8");

  console.log(`Generated: ${language}/index.js`);
}

LANGUAGES.forEach(generateIndex);
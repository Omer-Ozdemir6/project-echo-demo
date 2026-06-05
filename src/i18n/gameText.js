import enGame from "../locales/en/game.json";
import trGame from "../locales/tr/game.json";

const LOCALES = {
  en: enGame,
  tr: trGame
};

export function getGameText(key, fallback = "", language = "en") {
  if (!key) return fallback;

  const locale = LOCALES[language] || LOCALES.en;

  const value = key
    .split(".")
    .reduce((current, part) => current?.[part], locale);

  if (typeof value === "string" && value.trim()) {
    return value;
  }

  return fallback;
}
import enLocale from "../locales/en";
import trLocale from "../locales/tr";

const LOCALES = {
  en: enLocale,
  tr: trLocale
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
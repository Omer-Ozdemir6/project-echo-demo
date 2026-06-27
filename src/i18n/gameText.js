// src/i18n/gameText.js

// Scriptin oluşturduğu düz (flat) JSON dosyalarını import ediyoruz
import trData from "../locales/master_tr.json";
import enData from "../locales/master_en.json";

const LOCALES = {
  en: enData,
  tr: trData
};

/**
 * Oyun içi metinleri seçilen dile göre getirir.
 */
export function getGameText(key, fallback = "", language = "en") {
  console.log("🔍 getGameText aranan anahtar:", key, "Dil:", language);
  // 1. Anahtar yoksa fallback dön
  if (!key) return fallback;

  // 2. Seçilen dile göre locale objesini al, yoksa "en" varsay
  const locale = LOCALES[language] || LOCALES.en;

  // 3. Flat (düz) yapı olduğu için doğrudan anahtarı ara
  const value = locale[key];

  // 4. Eğer anahtar bulunamadıysa uyarı ver
  if (!value) {
    console.warn(`[Çeviri Hatası] Anahtar bulunamadı: "${key}" - Dil: "${language}"`);
    return fallback;
  }

  // 5. Değer bulunduysa dön
  return value;
}
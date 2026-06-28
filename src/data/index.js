import correlations from "./correlations.json";

// Birleştirilmiş hikaye dosyasını doğru yoldan (episodes klasörünün içinden) çekiyoruz
import mergedStory from "./episodes/merged_story.json"; 

// HATA AYIKLAMA İÇİN: Konsola JSON dosyasının gelip gelmediğini yazdırıyoruz
console.log("📦 YÜKLENEN HİKAYE VERİSİ:", mergedStory);

export const episodes = mergedStory;
export const DEFAULT_EPISODE_ID = "episode_01";

export function getEpisode(episodeId = DEFAULT_EPISODE_ID) {
  // Aranan epizotu değişkene al
  const ep = episodes[episodeId] || episodes[DEFAULT_EPISODE_ID];
  
  // Eğer epizot hala bulunamazsa (JSON boşsa veya yol yanlışsa) uyar
  if (!ep) {
    console.error(`🚨 getEpisode HATASI: '${episodeId}' bulunamadı! JSON verisi boş olabilir.`);
  }
  
  return ep;
}

export { correlations };
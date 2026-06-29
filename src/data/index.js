import correlations from "./correlations.json";

// Tüm bölüm dosyalarını içe aktarıyoruz
import episode_01 from "./episodes/episode-01.json";
import episode_02 from "./episodes/episode-02.json";
import episode_03 from "./episodes/episode-03.json";
import episode_04 from "./episodes/episode-04.json";
import episode_05 from "./episodes/episode-05.json";
import episode_06 from "./episodes/episode-06.json";
import episode_07 from "./episodes/episode-07.json";
import episode_08 from "./episodes/episode-08.json";
import episode_09 from "./episodes/episode-09.json";
import episode_10 from "./episodes/episode-10.json";
import episode_11 from "./episodes/episode-11.json";
import episode_12 from "./episodes/episode-12.json";
import episode_13 from "./episodes/episode-13.json";
import episode_14 from "./episodes/episode-14.json";
import episode_15 from "./episodes/episode-15.json";
import episode_16 from "./episodes/episode-16.json";
import episode_17 from "./episodes/episode-17.json";
import episode_18 from "./episodes/episode-18.json";
import episode_19 from "./episodes/episode-19.json";
import episode_20 from "./episodes/episode-20.json";

// Bölümleri bir nesne (dictionary) içinde topluyoruz
const episodes = {
  episode_01,
  episode_02,
  episode_03,
  episode_04,
  episode_05,
  episode_06,
  episode_07,
  episode_08,
  episode_09,
  episode_10,
  episode_11,
  episode_12,
  episode_13,
  episode_14,
  episode_15,
  episode_16,
  episode_17,
  episode_18,
  episode_19,
  episode_20,
};

export const DEFAULT_EPISODE_ID = "episode_01";

/**
 * İstenen bölümü döndürür. Eğer bulunamazsa varsayılanı döndürür.
 * @param {string} episodeId 
 */
export function getEpisode(episodeId = DEFAULT_EPISODE_ID) {
  const ep = episodes[episodeId];
  
  if (!ep) {
    console.warn(`⚠️ getEpisode: '${episodeId}' bulunamadı. Varsayılan bölüme dönülüyor.`);
    return episodes[DEFAULT_EPISODE_ID];
  }
  
  return ep;
}

export { correlations };
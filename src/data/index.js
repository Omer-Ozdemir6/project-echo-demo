import episode01 from "./episodes/episode-01.json";
import episode02 from "./episodes/episode-02.json";
import correlations from "./correlations.json";

export const episodes = {
  episode_01: episode01,
  episode_02: episode02
};

export const DEFAULT_EPISODE_ID = "episode_01";

export function getEpisode(episodeId = DEFAULT_EPISODE_ID) {
  return episodes[episodeId] || episodes[DEFAULT_EPISODE_ID];
}

export { correlations };
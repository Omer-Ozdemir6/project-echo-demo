import correlations from "./correlations.json";

const episodeModules = import.meta.glob("./episodes/episode-*.json", {
  eager: true,
  import: "default",
});

function toEpisodeId(path) {
  const match = path.match(/episode-(\d+)\.json$/);

  if (!match) {
    return null;
  }

  return `episode_${match[1]}`;
}

export const episodes = Object.fromEntries(
  Object.entries(episodeModules)
    .map(([path, episode]) => [toEpisodeId(path), episode])
    .filter(([episodeId]) => Boolean(episodeId))
);

export const DEFAULT_EPISODE_ID = "episode_01";

export function getEpisode(episodeId = DEFAULT_EPISODE_ID) {
  return episodes[episodeId] || episodes[DEFAULT_EPISODE_ID];
}

export { correlations };
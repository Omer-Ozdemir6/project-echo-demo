import correlations from "./correlations.json";

const episodeModules = import.meta.glob(
  "./episodes/episode-*.json",
  {
    eager: true,
    import: "default"
  }
);
console.log("LOADED EPISODES", Object.keys(episodes));
function toEpisodeId(path) {
  const match =
    path.match(
      /episode-(\d+)(?:-part-(\d+))?\.json$/
    );

  if (!match) {
    return null;
  }

  const episode =
    match[1];

  const part =
    match[2];

  if (part) {
    return `episode_${episode}_part_${part}`;
  }

  return `episode_${episode}`;
}

export const episodes =
  Object.fromEntries(
    Object.entries(
      episodeModules
    )
      .map(
        ([path, episode]) => [
          toEpisodeId(path),
          episode
        ]
      )
      .filter(
        ([episodeId]) =>
          Boolean(episodeId)
      )
  );

export const DEFAULT_EPISODE_ID =
  "episode_01";

export function getEpisode(
  episodeId = DEFAULT_EPISODE_ID
) {
  return (
    episodes[episodeId] ||
    episodes[DEFAULT_EPISODE_ID]
  );
}

export { correlations };
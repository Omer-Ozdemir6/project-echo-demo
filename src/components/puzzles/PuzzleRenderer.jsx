import CodePuzzleInput from "./CodePuzzleInput";
import DecryptPuzzleInput from "./DecryptPuzzleInput";
import FrequencyPuzzleInput from "./FrequencyPuzzleInput";
import MatchingPuzzleInput from "./MatchingPuzzleInput";
import SatellitePuzzleInput from "./SatellitePuzzleInput";
import { getGameText } from "../../i18n/gameText";

export default function PuzzleRenderer({
  puzzle,
  attempts = 0,
  onSubmit,
  language = "en"
}) {
  if (!puzzle) return null;

  function t(key) {
    return getGameText(key, key, language);
  }

  const sharedProps = {
    puzzle,
    attempts,
    onSubmit,
    t
  };

  if (puzzle.type === "decrypt") {
    return <DecryptPuzzleInput {...sharedProps} />;
  }

  if (puzzle.type === "frequency") {
    return <FrequencyPuzzleInput {...sharedProps} />;
  }

  if (puzzle.type === "satellite") {
    return <SatellitePuzzleInput {...sharedProps} />;
  }

  if (puzzle.type === "matching") {
    return <MatchingPuzzleInput {...sharedProps} />;
  }

  return <CodePuzzleInput {...sharedProps} />;
}
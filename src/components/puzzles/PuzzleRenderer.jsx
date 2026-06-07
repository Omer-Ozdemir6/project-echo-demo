import { useTranslation } from "react-i18next";

import CodePuzzleInput from "./CodePuzzleInput";
import DecryptPuzzleInput from "./DecryptPuzzleInput";
import FrequencyPuzzleInput from "./FrequencyPuzzleInput";
import MatchingPuzzleInput from "./MatchingPuzzleInput";
import SatellitePuzzleInput from "./SatellitePuzzleInput";

export default function PuzzleRenderer({
  puzzle,
  attempts = 0,
  onSubmit
}) {
  const { t } = useTranslation();

  if (!puzzle) return null;

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
  return (
    <MatchingPuzzleInput
      puzzle={puzzle}
      attempts={attempts}
      onSubmit={onSubmit}
      t={t}
    />
  );
}

  return <CodePuzzleInput {...sharedProps} />;
}
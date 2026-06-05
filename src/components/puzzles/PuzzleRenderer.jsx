import { useTranslation } from "react-i18next";

import CodePuzzleInput from "./CodePuzzleInput";
import DecryptPuzzleInput from "./DecryptPuzzleInput";
import FrequencyPuzzleInput from "./FrequencyPuzzleInput";

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

  return <CodePuzzleInput {...sharedProps} />;
}
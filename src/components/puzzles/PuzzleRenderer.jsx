import CodePuzzleInput from "./CodePuzzleInput";
import DecryptPuzzleInput from "./DecryptPuzzleInput";
import EchoIsolationPuzzleInput from "./EchoIsolationPuzzleInput";
import FrequencyPuzzleInput from "./FrequencyPuzzleInput";
import MatchingPuzzleInput from "./MatchingPuzzleInput";
import SatellitePuzzleInput from "./SatellitePuzzleInput";
import TerminalInterface from "./TerminalInterface";
import { getGameText } from "../../i18n/gameText";

export default function PuzzleRenderer({
  puzzle,
  attempts = 0,
  onSubmit,
  language = "en",
  gameState,
  onCollectFile
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

  if (puzzle.type === "echo_isolation") {
    return <EchoIsolationPuzzleInput {...sharedProps} />;
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

  if (puzzle.type === "terminal") {
    return (
      <TerminalInterface
        terminal={puzzle}
        gameState={gameState}
        onExit={() => onSubmit(puzzle.acceptedAnswers?.[0] || "TERMINAL_EXIT")}
        onCollectFile={onCollectFile}
        t={t}
      />
    );
  }

  // Varsayılan: kod/metin girişi
  return <CodePuzzleInput {...sharedProps} />;
}

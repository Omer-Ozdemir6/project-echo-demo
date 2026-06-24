import CodePuzzleInput from "./CodePuzzleInput";
import DecryptPuzzleInput from "./DecryptPuzzleInput";
import EchoIsolationPuzzleInput from "./EchoIsolationPuzzleInput";
import FrequencyPuzzleInput from "./FrequencyPuzzleInput";
import MatchingPuzzleInput from "./MatchingPuzzleInput";
import SatellitePuzzleInput from "./SatellitePuzzleInput";
import TerminalInterface from "./TerminalInterface";
import BreathControlMinigame from "./BreathControlMinigame";
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

  const sharedProps = { puzzle, attempts, onSubmit, t };

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

  // 🚀 GÜNCELLEME: Breath Control Parametreleri ve onSubmit Köprüsü Revize Edildi
  if (puzzle.type === "breath_control") {
    return (
      <BreathControlMinigame
        difficulty={Number(puzzle.difficulty) || 1}
        hitsNeeded={Number(puzzle.hitsNeeded || puzzle.roundsNeeded || 3)}
        echoLabel={puzzle.echoLabel || puzzle.echoDistance || "ECHO_PROXIMITY_WARN"}
        // Motorun successNodeId / failureNodeId ayrımına gidebilmesi için boolean veya onay kodu paslanır
        onSuccess={() => onSubmit(puzzle.acceptedAnswers?.[0] || true)}
        onFail={() => onSubmit(false)}
      />
    );
  }

  return <CodePuzzleInput {...sharedProps} />;
}
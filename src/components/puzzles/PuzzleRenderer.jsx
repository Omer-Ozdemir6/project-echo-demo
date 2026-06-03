import CodePuzzleInput from "./CodePuzzleInput";
import DecryptPuzzleInput from "./DecryptPuzzleInput";

export default function PuzzleRenderer({ puzzle, attempts = 0, onSubmit }) {
  if (!puzzle) return null;

  if (puzzle.type === "decrypt") {
    return (
      <DecryptPuzzleInput
        puzzle={puzzle}
        attempts={attempts}
        onSubmit={onSubmit}
      />
    );
  }

  return (
    <CodePuzzleInput
      puzzle={puzzle}
      attempts={attempts}
      onSubmit={onSubmit}
    />
  );
}
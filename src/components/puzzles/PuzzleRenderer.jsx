import CodePuzzleInput from "./CodePuzzleInput";
import DecryptPuzzleInput from "./DecryptPuzzleInput";
import EchoMapPuzzleInput from "./EchoMapPuzzleInput"; // YENİ: Eko Haritası
import InscriptionPuzzleInput from "./InscriptionPuzzleInput"; // YENİ: Yazıt Çözme
import VibrationPuzzleInput from "./VibrationPuzzleInput"; // YENİ: Titreşim Ritmi
import MatchingPuzzleInput from "./MatchingPuzzleInput";
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

  // 1 — DEŞİFRE MODÜLÜ (Klasik Şifre Çözme)
  if (puzzle.type === "decrypt") {
    return <DecryptPuzzleInput {...sharedProps} />;
  }

  // 2 — TİTREŞİM RİTMİ (vibration) -> Antik kapıların ritim mekanizması
  if (puzzle.type === "vibration") {
    return <VibrationPuzzleInput {...sharedProps} />;
  }

  // 3 — YAZIT ÇÖZME (inscription) -> Lore tabanlı sembol mantığı
  if (puzzle.type === "inscription") {
    return <InscriptionPuzzleInput {...sharedProps} />;
  }

  // 4 — EKO HARİTASI (echo_map) -> Sismik navigasyon ve Karaltı tespiti
  if (puzzle.type === "echo_map" || puzzle.type === "echo_isolation") {
    return <EchoMapPuzzleInput {...sharedProps} />;
  }

  // 5 — PARÇA EŞLEŞTİRME (matching) -> Belge ve yazıt parçaları
  if (puzzle.type === "matching") {
    return <MatchingPuzzleInput {...sharedProps} />;
  }

  // 6 — SIĞINAK TERMİNAL ARAYÜZÜ (terminal) -> Eski bilgisayar sistemleri
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

  // 7 — NEFES TUTMA (breath_control) -> Karaltıdan saklanma seansı
  if (puzzle.type === "breath_control") {
    return (
      <BreathControlMinigame
        difficulty={Number(puzzle.difficulty) || 1}
        hitsNeeded={Number(puzzle.hitsNeeded || puzzle.roundsNeeded || 3)}
        echoLabel={puzzle.echoLabel || puzzle.echoDistance || "KARALTI_YAKINLIK_UYARISI"}
        // Başarı veya başarısızlık durumunda düğüm (node) motoruna onay kodunu paslar
        onSuccess={() => onSubmit(puzzle.acceptedAnswers?.[0] || true)}
        onFail={() => onSubmit(false)}
      />
    );
  }

  // Varsayılan: Standart kod / kilitli kutu giriş paneli
  return <CodePuzzleInput {...sharedProps} />;
}
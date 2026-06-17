import { evaluateConditions } from "./conditionEvaluator";

/**
 * Kullanıcıya gösterilecek seçimleri döndürür.
 */
export function filterChoices(
  save,
  choices = []
) {
  return choices.filter(choice =>
    isChoiceAvailable(save, choice)
  );
}

/**
 * Tek bir seçimin kullanılabilir olup olmadığını kontrol eder.
 */
export function isChoiceAvailable(
  save,
  choice
) {
  if (!choice) {
    return false;
  }

  return evaluateConditions(
    save,
    choice.conditions || {}
  );
}

/**
 * Debug amaçlı.
 * Hangi seçimlerin neden gizlendiğini görebiliriz.
 */
export function getChoiceVisibility(
  save,
  choices = []
) {
  return choices.map(choice => ({
    id: choice.id,
    text: choice.text,
    visible: isChoiceAvailable(
      save,
      choice
    )
  }));
}
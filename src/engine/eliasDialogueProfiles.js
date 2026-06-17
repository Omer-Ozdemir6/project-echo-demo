export const ELIAS_DIALOGUE_PROFILES = {
  TRUSTING: {
    name: "TRUSTING",

    obeyChance: 100,

    asksForAdvice: true,
    sharesSecrets: true,

    questionsOrders: false,
    canRejectOrders: false,

    independentDecisionMaking: 10,
    argumentLikelihood: 5,
    rebellionLikelihood: 0,

    observesPlayerPatterns: true,
    remembersPastChoices: true,

    humorLevel: 90,
    emotionalOpenness: 90,

    trustGainMultiplier: 1.25,
    trustLossMultiplier: 0.75
  },

  CAUTIOUS: {
    name: "CAUTIOUS",

    obeyChance: 80,

    asksForAdvice: true,
    sharesSecrets: false,

    questionsOrders: true,
    canRejectOrders: false,

    independentDecisionMaking: 35,
    argumentLikelihood: 25,
    rebellionLikelihood: 10,

    observesPlayerPatterns: true,
    remembersPastChoices: true,

    humorLevel: 50,
    emotionalOpenness: 50,

    trustGainMultiplier: 1.0,
    trustLossMultiplier: 1.0
  },

  BROKEN: {
    name: "BROKEN",

    obeyChance: 60,

    asksForAdvice: false,
    sharesSecrets: false,

    questionsOrders: true,
    canRejectOrders: false,

    independentDecisionMaking: 50,
    argumentLikelihood: 40,
    rebellionLikelihood: 20,

    observesPlayerPatterns: true,
    remembersPastChoices: true,

    humorLevel: 10,
    emotionalOpenness: 20,

    trustGainMultiplier: 0.5,
    trustLossMultiplier: 1.5
  },

  REBELLIOUS: {
    name: "REBELLIOUS",

    obeyChance: 20,

    asksForAdvice: false,
    sharesSecrets: false,

    questionsOrders: true,
    canRejectOrders: true,

    independentDecisionMaking: 90,
    argumentLikelihood: 90,
    rebellionLikelihood: 95,

    observesPlayerPatterns: true,
    remembersPastChoices: true,

    humorLevel: 0,
    emotionalOpenness: 0,

    trustGainMultiplier: 0.25,
    trustLossMultiplier: 2.0
  }
};

export const DEFAULT_DIALOGUE_PROFILE =
  ELIAS_DIALOGUE_PROFILES.CAUTIOUS;
class InjuryEngine {
  applyInjury(
    save,
    injuryType
  ) {
    if (
      !save?.injuries ||
      !injuryType
    ) {
      return;
    }

    save.injuries[injuryType] = true;
  }

  healInjury(
    save,
    injuryType
  ) {
    if (
      !save?.injuries ||
      !injuryType
    ) {
      return;
    }

    save.injuries[injuryType] = false;
  }

  hasInjury(
    save,
    injuryType
  ) {
    return Boolean(
      save?.injuries?.[
        injuryType
      ]
    );
  }

  countInjuries(save) {
    return Object.values(
      save?.injuries || {}
    ).filter(Boolean).length;
  }

  getActiveInjuries(
    save
  ) {
    return Object.entries(
      save?.injuries || {}
    )
      .filter(
        ([, active]) => active
      )
      .map(([key]) => key);
  }
}

export default new InjuryEngine();
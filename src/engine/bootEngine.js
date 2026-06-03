function runBootStep({
  activeStep,
  bootStepIndex,
  bootAttempt,
  currentBoot,
  criticalErrorHoldMs = 4000,
  afterBootHoldMs = 1500,
  onProgress,
  onStepComplete,
  onCriticalError,
  onNextStep,
  onBootComplete
}) {
  if (!activeStep) {
    return () => {};
  }

  onProgress(0);

  const intervalMs = 70;
  const increment = activeStep.progress / (activeStep.duration / intervalMs);

  const progressTimer = setInterval(() => {
    onProgress((prev) => {
      const next = Math.min(activeStep.progress, prev + increment);
      return Math.round(next);
    });
  }, intervalMs);

  const finishTimer = setTimeout(() => {
    clearInterval(progressTimer);

    onStepComplete({
      ...activeStep,
      currentProgress: activeStep.progress
    });

    const isLastStep = bootStepIndex >= currentBoot.length - 1;

    if (bootAttempt === 1 && isLastStep) {
      onCriticalError(criticalErrorHoldMs);
      return;
    }

    setTimeout(
      () => {
        if (isLastStep) {
          onBootComplete();
        } else {
          onNextStep();
        }
      },
      isLastStep ? afterBootHoldMs : 700
    );
  }, activeStep.duration);

  return () => {
    clearInterval(progressTimer);
    clearTimeout(finishTimer);
  };
}

export { runBootStep };
export default runBootStep;
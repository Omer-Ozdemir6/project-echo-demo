export function runIntroTimeline({ timeline, onPhaseChange }) {
  const timers = [];

  onPhaseChange("blackout");

  timers.push(
    setTimeout(() => {
      onPhaseChange("quote");
    }, timeline.blackoutToQuoteMs)
  );

  timers.push(
    setTimeout(() => {
      onPhaseChange("logo");
    }, timeline.quoteToLogoMs)
  );

  timers.push(
    setTimeout(() => {
      onPhaseChange("booting");
    }, timeline.logoToBootMs)
  );

  return () => {
    timers.forEach(clearTimeout);
  };
}
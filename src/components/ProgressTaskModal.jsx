import { useEffect, useState } from "react";

function ProgressTaskModal({ task }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!task) return;

    setProgress(0);

    const duration = task.duration || 6000;
    const startedAt = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const nextProgress = Math.min(100, Math.round((elapsed / duration) * 100));

      setProgress(nextProgress);

      if (nextProgress >= 100) {
        clearInterval(interval);
      }
    }, 80);

    return () => clearInterval(interval);
  }, [task]);

  if (!task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-[min(420px,90vw)] rounded-2xl border border-emerald-400/30 bg-black p-6 shadow-2xl shadow-emerald-500/10">
        <div className="mb-4 text-center">
          <div className="text-xs tracking-[0.35em] text-emerald-300">
            SYSTEM PROCESS
          </div>

          <div className="mt-3 text-xl font-semibold tracking-[0.2em] text-emerald-100">
            {task.title}
          </div>

          {task.subtitle && (
            <div className="mt-3 text-sm text-emerald-300/70">
              {task.subtitle}
            </div>
          )}
        </div>

        <div className="mt-6 h-3 overflow-hidden rounded-full border border-emerald-400/30 bg-emerald-950/40">
          <div
            className="h-full bg-emerald-300 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-3 text-right font-mono text-sm text-emerald-200">
          {progress}%
        </div>
      </div>
    </div>
  );
}

export default ProgressTaskModal;
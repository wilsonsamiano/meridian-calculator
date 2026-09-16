import type { MouseEvent } from "react";
import { History } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCalcStore } from "@/store/calculator";

export function Display() {
  const input = useCalcStore((s) => s.input);
  const cursor = useCalcStore((s) => s.cursor);
  const result = useCalcStore((s) => s.result);
  const error = useCalcStore((s) => s.error);
  const keypadTarget = useCalcStore((s) => s.keypadTarget);
  const selectedPlotId = useCalcStore((s) => s.selectedPlotId);
  const plots = useCalcStore((s) => s.plots);
  const setCursor = useCalcStore((s) => s.setCursor);
  const setKeypadTarget = useCalcStore((s) => s.setKeypadTarget);
  const setHistoryOpen = useCalcStore((s) => s.setHistoryOpen);
  const historyOpen = useCalcStore((s) => s.historyOpen);

  const plot = plots.find((p) => p.id === selectedPlotId);
  const editingPlot = keypadTarget === "plot";
  const shown = editingPlot ? (plot?.expr ?? "") : input;
  const caret = editingPlot ? shown.length : cursor;

  const onDisplayClick = (event: MouseEvent<HTMLButtonElement>) => {
    setKeypadTarget("calc");
    if (editingPlot) return;
    const target = event.currentTarget.querySelector("[data-expr]");
    if (!target) {
      setCursor(shown.length);
      return;
    }
    const text = shown;
    const index = Math.round(
      ((event.clientX - target.getBoundingClientRect().left) / Math.max(1, target.clientWidth)) *
        text.length,
    );
    setCursor(Math.max(0, Math.min(text.length, index)));
  };

  return (
    <div
      className={cn(
        "flex min-h-[4.75rem] flex-col rounded-lg bg-inset px-3 py-2 shadow-[var(--shadow-border)]",
        "sm:min-h-[6.25rem] sm:px-4 squat:min-h-[4.5rem] squat:py-1.5 sm:squat:min-h-[4.75rem]",
        !editingPlot && "ring-1 ring-accent/35",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[0.68rem] font-medium uppercase tracking-[0.14em] text-subtle">
          {editingPlot ? `${selectedPlotId.toUpperCase()} =` : "Expression"}
        </p>
        <button
          type="button"
          onClick={() => setHistoryOpen(!historyOpen)}
          className="inline-flex size-9 items-center justify-center rounded-sm text-muted transition-colors duration-150 hover:text-fg squat:size-8"
          aria-label="Calculation history"
          aria-pressed={historyOpen}
        >
          <History className="size-4" strokeWidth={1.75} />
        </button>
      </div>
      <button
        type="button"
        onClick={onDisplayClick}
        className="mt-1 flex min-h-8 flex-1 items-center overflow-x-auto text-left"
        aria-label="Current expression"
      >
        <span
          data-expr
          className="font-mono text-xl font-medium tabular-nums tracking-tight text-fg sm:text-2xl squat:text-lg sm:squat:text-xl"
        >
          {shown ? (
            <>
              <span>{shown.slice(0, caret)}</span>
              <span className="caret inline-block h-[1.05em] w-px translate-y-[0.12em] bg-accent" />
              <span>{shown.slice(caret)}</span>
            </>
          ) : (
            <>
              <span className="text-subtle">{editingPlot ? "enter f(x)" : "0"}</span>
              <span className="caret inline-block h-[1.05em] w-px translate-y-[0.12em] bg-accent" />
            </>
          )}
        </span>
      </button>
      <div className="mt-0.5 flex min-h-6 items-end justify-end squat:min-h-5">
        {error ? (
          <p className="font-mono text-sm text-danger">{error}</p>
        ) : result && !editingPlot ? (
          <p className="font-mono text-2xl font-medium tabular-nums tracking-tight text-accent sm:text-[1.75rem]">
            {result}
          </p>
        ) : (
          <p className={cn("font-mono text-sm tabular-nums text-subtle", editingPlot && "opacity-80")}>
            {editingPlot ? "graphs as you type" : ""}
          </p>
        )}
      </div>
    </div>
  );
}

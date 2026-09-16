import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { tryEvaluate } from "@/lib/calc/math";
import { useCalcStore } from "@/store/calculator";

export function PlotList() {
  const plots = useCalcStore((s) => s.plots);
  const selectedPlotId = useCalcStore((s) => s.selectedPlotId);
  const angleMode = useCalcStore((s) => s.angleMode);
  const ans = useCalcStore((s) => s.ans);
  const selectPlot = useCalcStore((s) => s.selectPlot);
  const togglePlotVisible = useCalcStore((s) => s.togglePlotVisible);
  const setPlotExpr = useCalcStore((s) => s.setPlotExpr);

  return (
    <ul className="grid grid-cols-1 gap-1.5 wide:grid-cols-2 wide:gap-1.5">
      {plots.map((plot, index) => {
        const selected = plot.id === selectedPlotId;
        const check = plot.expr.trim()
          ? tryEvaluate(plot.expr, { x: 1, ans }, angleMode)
          : { ok: true as const, value: 0 };
        const invalid = plot.expr.trim().length > 0 && !check.ok;
        return (
          <li key={plot.id}>
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-md bg-raised px-2 py-0.5 shadow-[var(--shadow-border)] squat:py-0",
                selected && "shadow-[var(--shadow-border-hover)] ring-1 ring-accent/40",
              )}
            >
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: plot.visible ? plot.color : "transparent", boxShadow: `0 0 0 1.5px ${plot.color}` }}
                aria-hidden
              />
              <span className="w-7 shrink-0 font-mono text-xs font-medium text-muted">
                Y{index + 1}
              </span>
              <input
                value={plot.expr}
                onChange={(e) => setPlotExpr(plot.id, e.target.value)}
                onFocus={() => selectPlot(plot.id)}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                enterKeyHint="done"
                placeholder="f(x)"
                aria-label={`Function Y${index + 1}`}
                className={cn(
                  "min-h-11 min-w-0 flex-1 bg-transparent font-mono text-base text-fg outline-none",
                  "wide:min-h-10 squat:min-h-9",
                  "placeholder:text-subtle",
                  invalid && "text-danger",
                )}
              />
              <button
                type="button"
                onClick={() => togglePlotVisible(plot.id)}
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-sm text-muted transition-colors duration-150 hover:text-fg wide:size-10 squat:size-9"
                aria-label={plot.visible ? `Hide Y${index + 1}` : `Show Y${index + 1}`}
              >
                {plot.visible ? (
                  <Eye className="size-4" strokeWidth={1.75} />
                ) : (
                  <EyeOff className="size-4" strokeWidth={1.75} />
                )}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

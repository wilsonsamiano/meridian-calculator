import { evaluateAt } from "@/lib/calc/graph";
import { formatTableNumber } from "@/lib/calc/math";
import { useCalcStore } from "@/store/calculator";

const ROW_COUNT = 21;

export function TableView() {
  const plots = useCalcStore((s) => s.plots);
  const angleMode = useCalcStore((s) => s.angleMode);
  const ans = useCalcStore((s) => s.ans);
  const start = useCalcStore((s) => s.tableStart);
  const step = useCalcStore((s) => s.tableStep);
  const setTable = useCalcStore((s) => s.setTable);

  const active = plots.filter((p) => p.visible && p.expr.trim());
  const cols = active.length > 0 ? active : plots.slice(0, 1);

  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg bg-inset p-3 shadow-[var(--shadow-border)]">
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-[0.68rem] font-medium uppercase tracking-[0.12em] text-subtle">Start</span>
          <input
            type="number"
            step="any"
            value={start}
            onChange={(e) => setTable(Number(e.target.value) || 0, step)}
            className="min-h-11 rounded-md bg-raised px-3 font-mono text-base text-fg outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[0.68rem] font-medium uppercase tracking-[0.12em] text-subtle">Step</span>
          <input
            type="number"
            step="any"
            value={step}
            onChange={(e) => setTable(start, Number(e.target.value) || 1)}
            className="min-h-11 rounded-md bg-raised px-3 font-mono text-base text-fg outline-none"
          />
        </label>
      </div>
      <div className="mt-3 min-h-0 flex-1 overflow-auto overscroll-contain">
        <table className="w-full border-collapse text-left font-mono text-sm tabular-nums">
          <thead className="sticky top-0 bg-inset">
            <tr className="text-[0.68rem] uppercase tracking-[0.12em] text-subtle">
              <th className="px-2 py-2 font-medium">X</th>
              {cols.map((p, i) => (
                <th key={p.id} className="px-2 py-2 font-medium" style={{ color: p.color }}>
                  Y{plots.indexOf(p) + 1 || i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: ROW_COUNT }, (_, row) => {
              const x = start + row * step;
              return (
                <tr key={row} className="border-t border-border">
                  <td className="px-2 py-2 text-fg">{formatTableNumber(x)}</td>
                  {cols.map((p) => {
                    const y = p.expr.trim() ? evaluateAt(p.expr, x, angleMode, ans) : null;
                    return (
                      <td key={p.id} className="px-2 py-2 text-fg">
                        {y == null ? <span className="text-subtle">—</span> : formatTableNumber(y)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

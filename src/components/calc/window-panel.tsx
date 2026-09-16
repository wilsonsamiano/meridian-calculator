import { X } from "lucide-react";
import { squareWindow, STANDARD_WINDOW, TRIG_WINDOW } from "@/lib/calc/graph";
import { useCalcStore } from "@/store/calculator";

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[0.68rem] font-medium uppercase tracking-[0.12em] text-subtle">{label}</span>
      <input
        type="number"
        step="any"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(n);
        }}
        className="min-h-11 rounded-md bg-inset px-3 font-mono text-base text-fg shadow-[var(--shadow-border)] outline-none focus-visible:shadow-[var(--shadow-border-hover)]"
      />
    </label>
  );
}

export function WindowPanel() {
  const open = useCalcStore((s) => s.windowOpen);
  const win = useCalcStore((s) => s.window);
  const setWindow = useCalcStore((s) => s.setWindow);
  const setWindowOpen = useCalcStore((s) => s.setWindowOpen);

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-20 flex items-end justify-center bg-bg/70 p-3 sm:items-center">
      <div
        role="dialog"
        aria-label="Window settings"
        className="w-full max-w-md rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium tracking-tight">Window</h2>
          <button
            type="button"
            onClick={() => setWindowOpen(false)}
            className="inline-flex size-11 items-center justify-center rounded-sm text-muted hover:text-fg"
            aria-label="Close window settings"
          >
            <X className="size-4" strokeWidth={1.75} />
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="X min" value={win.xmin} onChange={(n) => setWindow({ ...win, xmin: n })} />
          <Field label="X max" value={win.xmax} onChange={(n) => setWindow({ ...win, xmax: n })} />
          <Field label="Y min" value={win.ymin} onChange={(n) => setWindow({ ...win, ymin: n })} />
          <Field label="Y max" value={win.ymax} onChange={(n) => setWindow({ ...win, ymax: n })} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            type="button"
            className="min-h-11 rounded-md bg-raised text-sm font-medium text-fg shadow-[var(--shadow-border)] transition-transform duration-150 active:scale-[0.96]"
            onClick={() => setWindow({ ...STANDARD_WINDOW })}
          >
            Standard
          </button>
          <button
            type="button"
            className="min-h-11 rounded-md bg-raised text-sm font-medium text-fg shadow-[var(--shadow-border)] transition-transform duration-150 active:scale-[0.96]"
            onClick={() => setWindow({ ...TRIG_WINDOW })}
          >
            Trig
          </button>
          <button
            type="button"
            className="min-h-11 rounded-md bg-raised text-sm font-medium text-fg shadow-[var(--shadow-border)] transition-transform duration-150 active:scale-[0.96]"
            onClick={() => setWindow(squareWindow(win, 16 / 10))}
          >
            Square
          </button>
        </div>
      </div>
    </div>
  );
}

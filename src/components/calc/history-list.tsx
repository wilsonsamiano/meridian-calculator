import { useCalcStore } from "@/store/calculator";

export function HistoryList() {
  const history = useCalcStore((s) => s.history);
  const recallHistory = useCalcStore((s) => s.recallHistory);

  if (history.length === 0) {
    return <p className="px-1 py-3 text-sm text-muted">No calculations yet.</p>;
  }

  return (
    <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto overscroll-contain pr-1">
      {history.map((item, i) => (
        <li key={`${item.expr}-${i}`}>
          <button
            type="button"
            onClick={() => recallHistory(item)}
            className="flex w-full items-baseline justify-between gap-3 rounded-md px-2 py-2 text-left transition-colors duration-150 hover:bg-raised"
          >
            <span className="min-w-0 truncate font-mono text-sm text-muted">{item.expr}</span>
            <span className="shrink-0 font-mono text-sm tabular-nums text-fg">{item.result}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

import { useEffect } from "react";
import type { ReactNode } from "react";
import { Calculator, Coffee, LineChart, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCalcStore } from "@/store/calculator";
import { Display } from "./display";
import { GraphCanvas } from "./graph-canvas";
import { GraphToolbar } from "./graph-toolbar";
import { HistoryList } from "./history-list";
import { InstallControls } from "./install-panel";
import { Keypad } from "./keypad";
import { PlotList } from "./plot-list";
import { TableView } from "./table-view";
import { WindowPanel } from "./window-panel";

export function CalculatorApp() {
  const tab = useCalcStore((s) => s.tab);
  const pane = useCalcStore((s) => s.pane);
  const setTab = useCalcStore((s) => s.setTab);
  const setPane = useCalcStore((s) => s.setPane);
  const insert = useCalcStore((s) => s.insert);
  const backspace = useCalcStore((s) => s.backspace);
  const equals = useCalcStore((s) => s.equals);
  const historyOpen = useCalcStore((s) => s.historyOpen);
  const keypadTarget = useCalcStore((s) => s.keypadTarget);
  const angleMode = useCalcStore((s) => s.angleMode);
  const leftHanded = useCalcStore((s) => s.leftHanded);
  const setLeftHanded = useCalcStore((s) => s.setLeftHanded);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) {
        if (e.key === "Enter" && el.tagName === "INPUT") {
          e.preventDefault();
          equals();
        }
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "Enter" || e.key === "=") {
        e.preventDefault();
        equals();
        return;
      }
      if (e.key === "Backspace") {
        e.preventDefault();
        backspace();
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        useCalcStore.getState().clearAll();
        return;
      }
      if (e.key === "Tab") return;

      const map: Record<string, string> = {
        "*": "*",
        x: "x",
        X: "x",
        "/": "/",
        "+": "+",
        "-": "-",
        "^": "^",
        "(": "(",
        ")": ")",
        ".": ".",
        π: "π",
      };
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        insert(e.key);
        return;
      }
      if (e.key in map) {
        e.preventDefault();
        insert(map[e.key]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [backspace, equals, insert]);

  const leftIsTable = pane === "table" || tab === "table";

  return (
    <main
      data-tab={tab}
      className={cn(
        "relative flex h-svh max-h-dvh min-h-0 flex-col overflow-hidden bg-bg text-fg",
        "pt-[max(0.45rem,env(safe-area-inset-top))]",
        "pr-[max(0.45rem,env(safe-area-inset-right))]",
        "pb-[max(0.3rem,env(safe-area-inset-bottom))]",
        "pl-[max(0.45rem,env(safe-area-inset-left))]",
      )}
    >
      <header className="flex shrink-0 items-center justify-between gap-3 px-1 pb-1.5 pt-0.5 squat:pb-1">
        <div className="min-w-0">
          <h1 className="text-[0.95rem] font-semibold tracking-tight">Meridian</h1>
          <p className="hidden text-[0.68rem] font-medium uppercase tracking-[0.16em] text-subtle wide:block">
            Graphing calculator
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://buymeacoffee.com/wilsonsamiano"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-muted transition-colors duration-150 hover:text-fg"
            aria-label="Buy me a coffee"
          >
            <Coffee className="size-4" strokeWidth={1.75} />
            <span className="hidden text-xs font-medium wide:inline squat:hidden">Coffee</span>
          </a>
          <InstallControls />
          <div
            className="hidden rounded-md bg-raised p-0.5 shadow-[var(--shadow-border)] wide:flex"
            role="group"
            aria-label="Keypad side"
          >
            <HandSeg
              label="L"
              title="Left-handed — keypad on the left"
              active={leftHanded}
              onClick={() => setLeftHanded(true)}
            />
            <HandSeg
              label="R"
              title="Right-handed — keypad on the right"
              active={!leftHanded}
              onClick={() => setLeftHanded(false)}
            />
          </div>
          <span className="rounded-full bg-raised px-2.5 py-1 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-muted">
            {angleMode}
          </span>
          <span className="hidden rounded-full bg-raised px-2.5 py-1 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-muted short:hidden squat:hidden wide:inline-flex">
            {keypadTarget === "plot" ? "Y=" : "Calc"}
          </span>
          <div className="hidden rounded-md bg-raised p-0.5 shadow-[var(--shadow-border)] wide:flex">
            <Seg label="Graph" active={pane === "graph"} onClick={() => setPane("graph")} />
            <Seg label="Table" active={pane === "table"} onClick={() => setPane("table")} />
          </div>
        </div>
      </header>

      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-2 wide:flex-row",
          leftHanded && "wide:flex-row-reverse",
        )}
      >
        <section
          className={cn(
            "relative flex min-h-0 flex-col gap-2 wide:min-w-0 wide:flex-1",
            tab === "calc" && "hidden wide:flex",
          )}
        >
          {leftIsTable ? (
            <TableView />
          ) : (
            <div className="relative flex min-h-0 flex-1 flex-col rounded-xl bg-surface p-2 shadow-[var(--shadow-border)]">
              <div className="flex items-center justify-between px-1 pb-1">
                <p className="text-[0.68rem] font-medium uppercase tracking-[0.14em] text-subtle">Plot</p>
                <GraphToolbar />
              </div>
              <div className="min-h-0 flex-1">
                <GraphCanvas />
              </div>
            </div>
          )}
          <div
            className={cn(
              "shrink-0 short:hidden",
              tab === "graph" ? "block" : "hidden wide:block",
            )}
          >
            <PlotList />
          </div>
        </section>

        <section
          className={cn(
            "flex min-h-0 flex-1 flex-col gap-2 wide:w-[min(26rem,42vw)] wide:min-w-[18rem] wide:flex-none wide:shrink-0",
            tab !== "calc" && "hidden wide:flex",
          )}
        >
          <Display />
          {historyOpen ? (
            <div className="rounded-lg bg-surface px-2 py-1 shadow-[var(--shadow-border)]">
              <HistoryList />
            </div>
          ) : null}
          <div className="min-h-0 flex-1">
            <div className="h-full min-h-0 overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
              <Keypad />
            </div>
          </div>
        </section>
      </div>

      <nav
        className="mt-2 grid shrink-0 grid-cols-3 gap-1 rounded-xl bg-surface p-1 shadow-[var(--shadow-border)] wide:hidden"
        aria-label="Modes"
      >
        <NavTab
          label="Calc"
          icon={<Calculator className="size-4" strokeWidth={1.75} />}
          active={tab === "calc"}
          onClick={() => setTab("calc")}
        />
        <NavTab
          label="Graph"
          icon={<LineChart className="size-4" strokeWidth={1.75} />}
          active={tab === "graph"}
          onClick={() => setTab("graph")}
        />
        <NavTab
          label="Table"
          icon={<Table2 className="size-4" strokeWidth={1.75} />}
          active={tab === "table"}
          onClick={() => setTab("table")}
        />
      </nav>
      <WindowPanel />
    </main>
  );
}

function HandSeg({
  label,
  title,
  active,
  onClick,
}: {
  label: string;
  title: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "min-h-9 min-w-9 rounded-sm px-2 font-mono text-sm font-medium transition-colors duration-150",
        active ? "bg-accent text-accent-fg" : "text-muted hover:text-fg",
      )}
    >
      {label}
    </button>
  );
}

function Seg({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-9 rounded-sm px-3 text-sm font-medium transition-colors duration-150",
        active ? "bg-accent text-accent-fg" : "text-muted hover:text-fg",
      )}
    >
      {label}
    </button>
  );
}

function NavTab({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-12 items-center justify-center gap-2 rounded-lg text-sm font-medium",
        "transition-colors duration-150",
        active ? "bg-accent text-accent-fg" : "text-muted",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

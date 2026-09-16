import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  backspaceAt,
  evaluate,
  formatNumber,
  insertAt,
  type AngleMode,
} from "@/lib/calc/math";
import {
  STANDARD_WINDOW,
  zoomAbout,
  type GraphWindow,
  type PlotSpec,
} from "@/lib/calc/graph";

export type TabId = "calc" | "graph" | "table";
export type KeypadTarget = "calc" | "plot";
export type PaneId = "graph" | "table";

export const PLOT_COLORS = ["#7eb6d4", "#e08a84", "#8fbf9a", "#c9b896"] as const;

export interface HistoryItem {
  expr: string;
  result: string;
}

interface CalcStore {
  input: string;
  cursor: number;
  result: string | null;
  error: string | null;
  afterEquals: boolean;
  second: boolean;
  angleMode: AngleMode;
  ans: number;
  history: HistoryItem[];
  plots: PlotSpec[];
  selectedPlotId: string;
  window: GraphWindow;
  tab: TabId;
  pane: PaneId;
  keypadTarget: KeypadTarget;
  traceOn: boolean;
  traceX: number;
  tableStart: number;
  tableStep: number;
  windowOpen: boolean;
  historyOpen: boolean;
  leftHanded: boolean;

  setInput: (value: string, cursor?: number) => void;
  setCursor: (cursor: number) => void;
  insert: (text: string) => void;
  backspace: () => void;
  clearAll: () => void;
  toggleSecond: () => void;
  setSecond: (value: boolean) => void;
  toggleAngle: () => void;
  equals: () => void;
  negate: () => void;
  setTab: (tab: TabId) => void;
  setPane: (pane: PaneId) => void;
  setKeypadTarget: (target: KeypadTarget) => void;
  selectPlot: (id: string) => void;
  setPlotExpr: (id: string, expr: string) => void;
  togglePlotVisible: (id: string) => void;
  setWindow: (win: GraphWindow) => void;
  zoom: (factor: number) => void;
  resetWindow: () => void;
  setTraceOn: (on: boolean) => void;
  setTraceX: (x: number) => void;
  setTable: (start: number, step: number) => void;
  setWindowOpen: (open: boolean) => void;
  setHistoryOpen: (open: boolean) => void;
  setLeftHanded: (left: boolean) => void;
  recallHistory: (item: HistoryItem) => void;
}

function defaultPlots(): PlotSpec[] {
  return [
    { id: "y1", expr: "sin(x)", color: PLOT_COLORS[0], visible: true },
    { id: "y2", expr: "", color: PLOT_COLORS[1], visible: true },
    { id: "y3", expr: "", color: PLOT_COLORS[2], visible: true },
    { id: "y4", expr: "", color: PLOT_COLORS[3], visible: true },
  ];
}

function clampCursor(value: string, cursor: number): number {
  return Math.max(0, Math.min(value.length, cursor));
}

export const useCalcStore = create<CalcStore>()(
  persist(
    (set, get) => ({
      input: "",
      cursor: 0,
      result: null,
      error: null,
      afterEquals: false,
      second: false,
      angleMode: "rad",
      ans: 0,
      history: [],
      plots: defaultPlots(),
      selectedPlotId: "y1",
      window: { ...STANDARD_WINDOW },
      tab: "graph",
      pane: "graph",
      keypadTarget: "calc",
      traceOn: false,
      traceX: 0,
      tableStart: -5,
      tableStep: 1,
      windowOpen: false,
      historyOpen: false,
      leftHanded: false,

      setInput: (value, cursor) =>
        set({
          input: value,
          cursor: clampCursor(value, cursor ?? value.length),
          afterEquals: false,
          error: null,
        }),

      setCursor: (cursor) => set((s) => ({ cursor: clampCursor(s.input, cursor) })),

      insert: (text) => {
        const s = get();
        if (s.keypadTarget === "plot") {
          const plot = s.plots.find((p) => p.id === s.selectedPlotId);
          if (!plot) return;
          const next = plot.expr + text;
          set({
            plots: s.plots.map((p) => (p.id === s.selectedPlotId ? { ...p, expr: next } : p)),
            second: false,
          });
          return;
        }

        let source = s.input;
        let cursor = s.cursor;
        if (s.afterEquals) {
          const isOp = "+-*/^".includes(text[0] ?? "");
          if (isOp && s.result) {
            source = s.result.replace(/−/g, "-");
            cursor = source.length;
          } else {
            source = "";
            cursor = 0;
          }
        }
        const next = insertAt(source, cursor, text);
        set({
          input: next.value,
          cursor: next.cursor,
          afterEquals: false,
          error: null,
          result: s.afterEquals && !"+-*/^".includes(text[0] ?? "") ? null : s.result,
          second: false,
        });
      },

      backspace: () => {
        const s = get();
        if (s.keypadTarget === "plot") {
          const plot = s.plots.find((p) => p.id === s.selectedPlotId);
          if (!plot) return;
          set({
            plots: s.plots.map((p) =>
              p.id === s.selectedPlotId ? { ...p, expr: p.expr.slice(0, -1) } : p,
            ),
            second: false,
          });
          return;
        }
        if (s.afterEquals) {
          set({ afterEquals: false, result: null, error: null, second: false });
          return;
        }
        const next = backspaceAt(s.input, s.cursor);
        set({ input: next.value, cursor: next.cursor, error: null, second: false });
      },

      clearAll: () => {
        const s = get();
        if (s.keypadTarget === "plot") {
          set({
            plots: s.plots.map((p) => (p.id === s.selectedPlotId ? { ...p, expr: "" } : p)),
            second: false,
          });
          return;
        }
        set({
          input: "",
          cursor: 0,
          result: null,
          error: null,
          afterEquals: false,
          second: false,
        });
      },

      toggleSecond: () => set((s) => ({ second: !s.second })),
      setSecond: (value) => set({ second: value }),
      toggleAngle: () => set((s) => ({ angleMode: s.angleMode === "rad" ? "deg" : "rad", second: false })),

      equals: () => {
        const s = get();
        if (s.keypadTarget === "plot") {
          set({ second: false, tab: "graph", pane: "graph" });
          return;
        }
        const expr = s.input.trim();
        if (!expr) return;
        try {
          const value = evaluate(expr, { x: 0, ans: s.ans }, s.angleMode);
          const formatted = formatNumber(value);
          const item: HistoryItem = { expr, result: formatted };
          set({
            result: formatted,
            error: null,
            afterEquals: true,
            ans: value,
            second: false,
            history: [item, ...s.history].slice(0, 24),
          });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : "Error",
            result: null,
            afterEquals: false,
            second: false,
          });
        }
      },

      negate: () => {
        const s = get();
        if (s.keypadTarget === "plot") {
          s.insert("(-");
          return;
        }
        if (s.afterEquals && s.result) {
          const raw = s.result.replace(/−/g, "-");
          const num = Number(raw);
          if (Number.isFinite(num)) {
            const next = formatNumber(-num).replace(/−/g, "-");
            set({ input: next, cursor: next.length, afterEquals: false, result: null });
            return;
          }
        }
        s.insert("(-");
      },

      setTab: (tab) =>
        set({
          tab,
          keypadTarget: tab === "calc" ? "calc" : "plot",
          second: false,
        }),
      setPane: (pane) => set({ pane }),
      setKeypadTarget: (target) => set({ keypadTarget: target, tab: target === "calc" ? "calc" : "graph" }),
      selectPlot: (id) => set({ selectedPlotId: id, keypadTarget: "plot", second: false }),
      setPlotExpr: (id, expr) =>
        set((s) => ({ plots: s.plots.map((p) => (p.id === id ? { ...p, expr } : p)) })),
      togglePlotVisible: (id) =>
        set((s) => ({
          plots: s.plots.map((p) => (p.id === id ? { ...p, visible: !p.visible } : p)),
        })),
      setWindow: (win) => set({ window: win }),
      zoom: (factor) =>
        set((s) => {
          const cx = (s.window.xmin + s.window.xmax) / 2;
          const cy = (s.window.ymin + s.window.ymax) / 2;
          return { window: zoomAbout(s.window, cx, cy, factor) };
        }),
      resetWindow: () => set({ window: { ...STANDARD_WINDOW } }),
      setTraceOn: (on) => set({ traceOn: on }),
      setTraceX: (x) => set({ traceX: x }),
      setTable: (start, step) => set({ tableStart: start, tableStep: step === 0 ? 1 : step }),
      setWindowOpen: (open) => set({ windowOpen: open, pane: open ? "graph" : get().pane, tab: open ? "graph" : get().tab }),
      setHistoryOpen: (open) => set({ historyOpen: open }),
      setLeftHanded: (left) => set({ leftHanded: left }),
      recallHistory: (item) =>
        set({
          input: item.expr,
          cursor: item.expr.length,
          result: item.result,
          error: null,
          afterEquals: false,
          keypadTarget: "calc",
          tab: "calc",
          historyOpen: false,
        }),
    }),
    {
      name: "meridian-calc",
      partialize: (s) => ({
        angleMode: s.angleMode,
        plots: s.plots,
        window: s.window,
        history: s.history,
        ans: s.ans,
        tableStart: s.tableStart,
        tableStep: s.tableStep,
        selectedPlotId: s.selectedPlotId,
        leftHanded: s.leftHanded,
      }),
    },
  ),
);

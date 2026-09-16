import { tryEvaluate, type AngleMode } from "./math";

export interface PlotSpec {
  id: string;
  expr: string;
  color: string;
  visible: boolean;
}

export interface GraphWindow {
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
}

export interface SamplePoint {
  x: number;
  y: number;
  defined: boolean;
}

export function xRange(win: GraphWindow): number {
  const span = win.xmax - win.xmin;
  return span === 0 ? 1 : span;
}

export function yRange(win: GraphWindow): number {
  const span = win.ymax - win.ymin;
  return span === 0 ? 1 : span;
}

export function samplePlot(
  expr: string,
  win: GraphWindow,
  samples: number,
  mode: AngleMode,
  ans: number,
): SamplePoint[] {
  const points: SamplePoint[] = [];
  const n = Math.max(32, Math.floor(samples));
  const dx = xRange(win) / n;
  for (let i = 0; i <= n; i += 1) {
    const x = win.xmin + dx * i;
    const result = tryEvaluate(expr, { x, ans }, mode);
    if (result.ok && Number.isFinite(result.value)) {
      points.push({ x, y: result.value, defined: true });
    } else {
      points.push({ x, y: NaN, defined: false });
    }
  }
  return points;
}

export function isDiscontinuity(prev: SamplePoint, next: SamplePoint, win: GraphWindow): boolean {
  if (!prev.defined || !next.defined) return true;
  const jump = Math.abs(next.y - prev.y);
  return jump > yRange(win) * 4;
}

export function niceTicks(min: number, max: number, target = 8): number[] {
  const span = max - min;
  if (!Number.isFinite(span) || span <= 0) return [min];
  const raw = span / Math.max(2, target);
  const pow = 10 ** Math.floor(Math.log10(raw));
  const err = raw / pow;
  let step = pow;
  if (err >= 7.5) step = 10 * pow;
  else if (err >= 3.5) step = 5 * pow;
  else if (err >= 1.5) step = 2 * pow;
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  const end = max + step * 0.5;
  for (let v = start; v <= end; v += step) {
    const rounded = Number(v.toPrecision(12));
    if (rounded >= min - step * 1e-6 && rounded <= max + step * 1e-6) ticks.push(rounded);
    if (ticks.length > 24) break;
  }
  return ticks;
}

export function zoomAbout(win: GraphWindow, cx: number, cy: number, factor: number): GraphWindow {
  const f = factor <= 0 ? 1 : factor;
  return {
    xmin: cx - (cx - win.xmin) * f,
    xmax: cx + (win.xmax - cx) * f,
    ymin: cy - (cy - win.ymin) * f,
    ymax: cy + (win.ymax - cy) * f,
  };
}

export function panWindow(win: GraphWindow, dxRatio: number, dyRatio: number): GraphWindow {
  const dx = xRange(win) * dxRatio;
  const dy = yRange(win) * dyRatio;
  return {
    xmin: win.xmin + dx,
    xmax: win.xmax + dx,
    ymin: win.ymin + dy,
    ymax: win.ymax + dy,
  };
}

export function squareWindow(win: GraphWindow, aspect: number): GraphWindow {
  const cx = (win.xmin + win.xmax) / 2;
  const cy = (win.ymin + win.ymax) / 2;
  let w = xRange(win);
  let h = yRange(win);
  if (aspect <= 0) return win;
  if (w / h > aspect) {
    h = w / aspect;
  } else {
    w = h * aspect;
  }
  return {
    xmin: cx - w / 2,
    xmax: cx + w / 2,
    ymin: cy - h / 2,
    ymax: cy + h / 2,
  };
}

export const STANDARD_WINDOW: GraphWindow = { xmin: -10, xmax: 10, ymin: -6, ymax: 6 };
export const TRIG_WINDOW: GraphWindow = {
  xmin: -2 * Math.PI,
  xmax: 2 * Math.PI,
  ymin: -2,
  ymax: 2,
};

export function evaluateAt(
  expr: string,
  x: number,
  mode: AngleMode,
  ans: number,
): number | null {
  const result = tryEvaluate(expr, { x, ans }, mode);
  if (!result.ok || !Number.isFinite(result.value)) return null;
  return result.value;
}

export function findZero(
  expr: string,
  a: number,
  b: number,
  mode: AngleMode,
  ans: number,
): number | null {
  const ya = evaluateAt(expr, a, mode, ans);
  const yb = evaluateAt(expr, b, mode, ans);
  if (ya == null || yb == null) return null;
  if (ya === 0) return a;
  if (yb === 0) return b;
  if (ya * yb > 0) return null;
  let lo = a;
  let hi = b;
  let ylo = ya;
  for (let i = 0; i < 48; i += 1) {
    const mid = (lo + hi) / 2;
    const ym = evaluateAt(expr, mid, mode, ans);
    if (ym == null) return null;
    if (Math.abs(ym) < 1e-10) return mid;
    if (ylo * ym <= 0) {
      hi = mid;
    } else {
      lo = mid;
      ylo = ym;
    }
  }
  return (lo + hi) / 2;
}

import { useCallback, useEffect, useRef } from "react";
import {
  evaluateAt,
  isDiscontinuity,
  niceTicks,
  panWindow,
  samplePlot,
  xRange,
  yRange,
  zoomAbout,
  type GraphWindow,
} from "@/lib/calc/graph";
import { formatNumber } from "@/lib/calc/math";
import { useCalcStore } from "@/store/calculator";

const PAD = { l: 44, r: 12, t: 14, b: 26 };

function formatTick(n: number): string {
  const abs = Math.abs(n);
  if (abs === 0) return "0";
  if (Math.abs(n - Math.PI) < 1e-6) return "π";
  if (Math.abs(n + Math.PI) < 1e-6) return "−π";
  if (Math.abs(n - 2 * Math.PI) < 1e-6) return "2π";
  if (Math.abs(n + 2 * Math.PI) < 1e-6) return "−2π";
  if (abs >= 1000 || (abs < 0.01 && abs > 0)) return n.toExponential(0).replace("e+", "e");
  const s = Number(n.toPrecision(6));
  return String(s).replace("-", "−");
}

export function GraphCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinch = useRef<{ dist: number; win: GraphWindow } | null>(null);
  const drag = useRef<{ x: number; y: number; win: GraphWindow } | null>(null);

  const plots = useCalcStore((s) => s.plots);
  const win = useCalcStore((s) => s.window);
  const angleMode = useCalcStore((s) => s.angleMode);
  const ans = useCalcStore((s) => s.ans);
  const traceOn = useCalcStore((s) => s.traceOn);
  const traceX = useCalcStore((s) => s.traceX);
  const selectedPlotId = useCalcStore((s) => s.selectedPlotId);
  const setWindow = useCalcStore((s) => s.setWindow);
  const setTraceX = useCalcStore((s) => s.setTraceX);
  const setTraceOn = useCalcStore((s) => s.setTraceOn);

  const winRef = useRef(win);
  winRef.current = win;

  const toPlot = useCallback((px: number, py: number, width: number, height: number, w: GraphWindow) => {
    const gw = width - PAD.l - PAD.r;
    const gh = height - PAD.t - PAD.b;
    const x = w.xmin + ((px - PAD.l) / gw) * xRange(w);
    const y = w.ymax - ((py - PAD.t) / gh) * yRange(w);
    return { x, y };
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(wrap.clientWidth));
    const height = Math.max(1, Math.round(wrap.clientHeight));
    if (width < 8 || height < 8) return;

    const bw = Math.round(width * dpr);
    const bh = Math.round(height * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const w = winRef.current;
    const gw = width - PAD.l - PAD.r;
    const gh = height - PAD.t - PAD.b;
    const xToPx = (x: number) => PAD.l + ((x - w.xmin) / xRange(w)) * gw;
    const yToPx = (y: number) => PAD.t + ((w.ymax - y) / yRange(w)) * gh;

    ctx.fillStyle = "#0c0e13";
    ctx.beginPath();
    roundRect(ctx, 0, 0, width, height, 12);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.rect(PAD.l, PAD.t, gw, gh);
    ctx.clip();

    const xTicks = niceTicks(w.xmin, w.xmax, Math.max(4, Math.floor(gw / 72)));
    const yTicks = niceTicks(w.ymin, w.ymax, Math.max(4, Math.floor(gh / 56)));

    ctx.strokeStyle = "rgba(232,238,242,0.05)";
    ctx.lineWidth = 1;
    for (const t of xTicks) {
      const px = xToPx(t);
      ctx.beginPath();
      ctx.moveTo(px, PAD.t);
      ctx.lineTo(px, PAD.t + gh);
      ctx.stroke();
    }
    for (const t of yTicks) {
      const py = yToPx(t);
      ctx.beginPath();
      ctx.moveTo(PAD.l, py);
      ctx.lineTo(PAD.l + gw, py);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(232,238,242,0.22)";
    ctx.lineWidth = 1.25;
    if (w.xmin < 0 && w.xmax > 0) {
      const px = xToPx(0);
      ctx.beginPath();
      ctx.moveTo(px, PAD.t);
      ctx.lineTo(px, PAD.t + gh);
      ctx.stroke();
    }
    if (w.ymin < 0 && w.ymax > 0) {
      const py = yToPx(0);
      ctx.beginPath();
      ctx.moveTo(PAD.l, py);
      ctx.lineTo(PAD.l + gw, py);
      ctx.stroke();
    }

    const samples = Math.min(1400, Math.max(240, Math.floor(gw * 1.6)));
    for (const plot of plots) {
      if (!plot.visible || !plot.expr.trim()) continue;
      const pts = samplePlot(plot.expr, w, samples, angleMode, ans);
      ctx.strokeStyle = plot.color;
      ctx.lineWidth = plot.id === selectedPlotId ? 2.35 : 1.85;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      let drawing = false;
      for (let i = 0; i < pts.length; i += 1) {
        const p = pts[i];
        if (!p.defined) {
          drawing = false;
          continue;
        }
        if (i > 0 && isDiscontinuity(pts[i - 1], p, w)) {
          drawing = false;
        }
        const px = xToPx(p.x);
        const py = yToPx(p.y);
        if (!drawing) {
          ctx.moveTo(px, py);
          drawing = true;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
    }

    if (traceOn) {
      const tx = Math.min(w.xmax, Math.max(w.xmin, traceX));
      const px = xToPx(tx);
      ctx.strokeStyle = "rgba(200,208,220,0.45)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(px, PAD.t);
      ctx.lineTo(px, PAD.t + gh);
      ctx.stroke();
      ctx.setLineDash([]);

      const selected = plots.find((p) => p.id === selectedPlotId) ?? plots.find((p) => p.visible && p.expr.trim());
      if (selected?.expr.trim()) {
        const y = evaluateAt(selected.expr, tx, angleMode, ans);
        if (y != null) {
          const py = yToPx(y);
          ctx.fillStyle = selected.color;
          ctx.beginPath();
          ctx.arc(px, py, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#0c0e13";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }
    }

    ctx.restore();

    ctx.fillStyle = "#8b919d";
    ctx.font = "500 11px 'IBM Plex Mono', ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (const t of xTicks) {
      if (Math.abs(t) < 1e-12) continue;
      ctx.fillText(formatTick(t), xToPx(t), PAD.t + gh + 6);
    }
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (const t of yTicks) {
      if (Math.abs(t) < 1e-12) continue;
      ctx.fillText(formatTick(t), PAD.l - 8, yToPx(t));
    }
    ctx.fillStyle = "#6b717c";
    ctx.textAlign = "right";
    ctx.fillText("0", PAD.l - 8, Math.min(PAD.t + gh - 8, Math.max(PAD.t + 8, yToPx(0))));
  }, [plots, angleMode, ans, traceOn, traceX, selectedPlotId]);

  useEffect(() => {
    draw();
  }, [draw, win]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(wrap);
    const onVp = () => draw();
    window.visualViewport?.addEventListener("resize", onVp);
    window.addEventListener("orientationchange", onVp);
    return () => {
      ro.disconnect();
      window.visualViewport?.removeEventListener("resize", onVp);
      window.removeEventListener("orientationchange", onVp);
    };
  }, [draw]);

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      drag.current = { x: e.clientX, y: e.clientY, win: { ...winRef.current } };
      pinch.current = null;
      if (traceOn) {
        const rect = canvas.getBoundingClientRect();
        const { x } = toPlot(e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height, winRef.current);
        setTraceX(x);
      }
    } else if (pointers.current.size === 2) {
      const pts = [...pointers.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinch.current = { dist: Math.max(1, dist), win: { ...winRef.current } };
      drag.current = null;
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    if (pointers.current.size === 2 && pinch.current) {
      const pts = [...pointers.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const factor = pinch.current.dist / Math.max(1, dist);
      const cx = (pinch.current.win.xmin + pinch.current.win.xmax) / 2;
      const cy = (pinch.current.win.ymin + pinch.current.win.ymax) / 2;
      setWindow(zoomAbout(pinch.current.win, cx, cy, factor));
      return;
    }

    if (traceOn && drag.current) {
      const { x } = toPlot(e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height, winRef.current);
      setTraceX(x);
      return;
    }

    if (drag.current) {
      const dx = e.clientX - drag.current.x;
      const dy = e.clientY - drag.current.y;
      const gw = rect.width - PAD.l - PAD.r;
      const gh = rect.height - PAD.t - PAD.b;
      setWindow(panWindow(drag.current.win, -dx / gw, dy / gh));
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) drag.current = null;
  };

  const onWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const { x, y } = toPlot(e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height, winRef.current);
    const factor = e.deltaY > 0 ? 1.12 : 0.88;
    setWindow(zoomAbout(winRef.current, x, y, factor));
  };

  const onDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const { x } = toPlot(e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height, winRef.current);
    setTraceOn(true);
    setTraceX(x);
  };

  const selected = plots.find((p) => p.id === selectedPlotId);
  const traceY =
    traceOn && selected?.expr.trim()
      ? evaluateAt(selected.expr, traceX, angleMode, ans)
      : null;

  return (
    <div ref={wrapRef} className="relative h-full min-h-0 w-full [transform:translateZ(0)]">
      <canvas
        ref={canvasRef}
        className="block touch-none"
        style={{ width: "100%", height: "100%" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onDoubleClick={onDoubleClick}
        aria-label="Function graph"
      />
      {traceOn ? (
        <div className="pointer-events-none absolute left-3 top-3 rounded-md bg-surface/90 px-2.5 py-1.5 font-mono text-xs tabular-nums text-fg shadow-[var(--shadow-border)]">
          <span className="text-muted">x</span> {formatNumber(traceX)}
          {traceY != null ? (
            <>
              {"  "}
              <span className="text-muted">y</span> {formatNumber(traceY)}
            </>
          ) : (
            <span className="text-muted">  undefined</span>
          )}
        </div>
      ) : null}
    </div>
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

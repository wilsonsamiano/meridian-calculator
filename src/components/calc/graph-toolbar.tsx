import type { ReactNode } from "react";
import { Crosshair, Home, Minus, Plus, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCalcStore } from "@/store/calculator";

export function GraphToolbar() {
  const traceOn = useCalcStore((s) => s.traceOn);
  const setTraceOn = useCalcStore((s) => s.setTraceOn);
  const zoom = useCalcStore((s) => s.zoom);
  const resetWindow = useCalcStore((s) => s.resetWindow);
  const setWindowOpen = useCalcStore((s) => s.setWindowOpen);
  const windowOpen = useCalcStore((s) => s.windowOpen);

  return (
    <div className="flex items-center gap-1">
      <ToolButton
        label="Trace"
        pressed={traceOn}
        onClick={() => setTraceOn(!traceOn)}
      >
        <Crosshair className="size-4" strokeWidth={1.75} />
      </ToolButton>
      <ToolButton label="Zoom in" onClick={() => zoom(0.5)}>
        <Plus className="size-4" strokeWidth={1.75} />
      </ToolButton>
      <ToolButton label="Zoom out" onClick={() => zoom(2)}>
        <Minus className="size-4" strokeWidth={1.75} />
      </ToolButton>
      <ToolButton label="Reset window" onClick={resetWindow}>
        <Home className="size-4" strokeWidth={1.75} />
      </ToolButton>
      <ToolButton label="Window settings" pressed={windowOpen} onClick={() => setWindowOpen(true)}>
        <SlidersHorizontal className="size-4" strokeWidth={1.75} />
      </ToolButton>
    </div>
  );
}

function ToolButton({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string;
  pressed?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-md text-muted",
        "transition-[transform,color,background-color] duration-150 ease-out",
        "hover:text-fg active:scale-[0.96]",
        pressed ? "bg-accent text-accent-fg" : "bg-transparent",
      )}
    >
      {children}
    </button>
  );
}

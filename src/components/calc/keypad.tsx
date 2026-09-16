import { cn } from "@/lib/utils";
import { useCalcStore } from "@/store/calculator";

type KeyVariant = "num" | "op" | "fn" | "eq" | "util" | "shift";

interface KeySpec {
  id: string;
  label: string;
  second?: string;
  insert?: string;
  secondInsert?: string;
  action?: "2nd" | "del" | "ac" | "eq" | "neg" | "angle" | "plot" | "win" | "table";
  variant: KeyVariant;
}

const KEYS: KeySpec[] = [
  { id: "2nd", label: "2nd", action: "2nd", variant: "shift" },
  { id: "angle", label: "RAD", second: "DEG", action: "angle", variant: "util" },
  { id: "plot", label: "Y=", action: "plot", variant: "util" },
  { id: "win", label: "WIN", action: "win", variant: "util" },
  { id: "del", label: "DEL", second: "AC", action: "del", variant: "util" },

  { id: "sin", label: "sin", second: "sin⁻¹", insert: "sin(", secondInsert: "asin(", variant: "fn" },
  { id: "cos", label: "cos", second: "cos⁻¹", insert: "cos(", secondInsert: "acos(", variant: "fn" },
  { id: "tan", label: "tan", second: "tan⁻¹", insert: "tan(", secondInsert: "atan(", variant: "fn" },
  { id: "ln", label: "ln", second: "eˣ", insert: "ln(", secondInsert: "exp(", variant: "fn" },
  { id: "log", label: "log", second: "10ˣ", insert: "log(", secondInsert: "10^", variant: "fn" },

  { id: "lpar", label: "(", second: "|x|", insert: "(", secondInsert: "abs(", variant: "fn" },
  { id: "rpar", label: ")", second: "n!", insert: ")", secondInsert: "!", variant: "fn" },
  { id: "pow", label: "^", second: "√", insert: "^", secondInsert: "sqrt(", variant: "fn" },
  { id: "sq", label: "x²", second: "x³", insert: "^2", secondInsert: "^3", variant: "fn" },
  { id: "x", label: "x", second: "1/x", insert: "x", secondInsert: "^(-1)", variant: "fn" },

  { id: "7", label: "7", insert: "7", variant: "num" },
  { id: "8", label: "8", insert: "8", variant: "num" },
  { id: "9", label: "9", insert: "9", variant: "num" },
  { id: "div", label: "÷", insert: "/", variant: "op" },
  { id: "pi", label: "π", second: "e", insert: "π", secondInsert: "e", variant: "fn" },

  { id: "4", label: "4", insert: "4", variant: "num" },
  { id: "5", label: "5", insert: "5", variant: "num" },
  { id: "6", label: "6", insert: "6", variant: "num" },
  { id: "mul", label: "×", insert: "*", variant: "op" },
  { id: "ans", label: "ANS", second: "π", insert: "ans", secondInsert: "π", variant: "fn" },

  { id: "1", label: "1", insert: "1", variant: "num" },
  { id: "2", label: "2", insert: "2", variant: "num" },
  { id: "3", label: "3", insert: "3", variant: "num" },
  { id: "sub", label: "−", insert: "-", variant: "op" },
  { id: "eq", label: "=", action: "eq", variant: "eq" },

  { id: "0", label: "0", insert: "0", variant: "num" },
  { id: "dot", label: ".", insert: ".", variant: "num" },
  { id: "neg", label: "(−)", action: "neg", variant: "op" },
  { id: "add", label: "+", insert: "+", variant: "op" },
];

const variantClass: Record<KeyVariant, string> = {
  num: "bg-key text-fg",
  op: "bg-key-op text-fg",
  fn: "bg-key-fn text-fg",
  util: "bg-key-fn text-muted",
  shift: "bg-key-fn text-muted",
  eq: "bg-accent text-accent-fg",
};

export function Keypad() {
  const second = useCalcStore((s) => s.second);
  const angleMode = useCalcStore((s) => s.angleMode);
  const insert = useCalcStore((s) => s.insert);
  const backspace = useCalcStore((s) => s.backspace);
  const clearAll = useCalcStore((s) => s.clearAll);
  const toggleSecond = useCalcStore((s) => s.toggleSecond);
  const toggleAngle = useCalcStore((s) => s.toggleAngle);
  const equals = useCalcStore((s) => s.equals);
  const negate = useCalcStore((s) => s.negate);
  const setTab = useCalcStore((s) => s.setTab);
  const setPane = useCalcStore((s) => s.setPane);
  const setKeypadTarget = useCalcStore((s) => s.setKeypadTarget);
  const setWindowOpen = useCalcStore((s) => s.setWindowOpen);

  const press = (key: KeySpec) => {
    const shifted = second && (key.second || key.secondInsert || key.action === "del");

    if (key.action === "2nd") {
      toggleSecond();
      return;
    }
    if (key.action === "angle") {
      toggleAngle();
      return;
    }
    if (key.action === "del") {
      if (shifted) clearAll();
      else backspace();
      return;
    }
    if (key.action === "eq") {
      equals();
      return;
    }
    if (key.action === "neg") {
      negate();
      return;
    }
    if (key.action === "plot") {
      setTab("graph");
      setPane("graph");
      setKeypadTarget("plot");
      return;
    }
    if (key.action === "win") {
      setPane("graph");
      setTab("graph");
      setWindowOpen(true);
      return;
    }

    const text = shifted ? (key.secondInsert ?? key.insert) : key.insert;
    if (text) insert(text);
  };

  return (
    <div className="grid h-full min-h-0 grid-cols-5 grid-rows-7 gap-1.5 p-1.5 wide:gap-1.5 wide:p-1.5 squat:gap-1 squat:p-1">
      {KEYS.map((key) => {
        const isShiftKey = key.id === "2nd" && second;
        const shifted = Boolean(second && key.second);
        const label =
          key.id === "angle"
            ? angleMode === "rad"
              ? "RAD"
              : "DEG"
            : key.id === "del" && second
              ? "AC"
              : shifted
                ? key.second
                : key.label;
        return (
          <button
            key={key.id}
            type="button"
            aria-label={key.second ? `${key.label}, 2nd ${key.second}` : key.label}
            aria-pressed={key.id === "2nd" ? second : undefined}
            onPointerDown={(e) => {
              e.preventDefault();
              press(key);
            }}
            className={cn(
              "relative flex h-full min-h-0 w-full touch-manipulation items-center justify-center overflow-hidden rounded-lg",
              "select-none font-sans text-[1.05rem] font-medium leading-none wide:rounded-md wide:text-sm squat:text-[0.85rem]",
              "shadow-[var(--shadow-border)]",
              "transition-[transform,box-shadow,background-color,color] duration-150 ease-out",
              "active:scale-[0.97] active:brightness-110",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              variantClass[key.variant],
              isShiftKey && "bg-accent text-accent-fg",
              shifted && !isShiftKey && "text-accent",
              key.variant === "num" && "text-[1.35rem] tabular-nums wide:text-base squat:text-[1.05rem]",
              key.id === "eq" && "row-span-2 text-2xl wide:text-lg",
            )}
          >
            <span className="px-0.5 text-center">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

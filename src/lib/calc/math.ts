export class CalcError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CalcError";
  }
}

export type AngleMode = "deg" | "rad";

type Token =
  | { kind: "num"; value: number }
  | { kind: "ident"; value: string }
  | { kind: "op"; value: string };

const KEYWORDS = [
  "arcsin",
  "arccos",
  "arctan",
  "asin",
  "acos",
  "atan",
  "sinh",
  "cosh",
  "tanh",
  "sqrt",
  "cbrt",
  "abs",
  "floor",
  "ceil",
  "round",
  "exp",
  "sign",
  "log10",
  "log2",
  "hypot",
  "sin",
  "cos",
  "tan",
  "min",
  "max",
  "ln",
  "log",
  "pi",
  "tau",
  "ans",
] as const;

const KEYWORD_SET = new Set<string>(KEYWORDS);
const FUNCTION_SET = new Set([
  "sin",
  "cos",
  "tan",
  "asin",
  "acos",
  "atan",
  "arcsin",
  "arccos",
  "arctan",
  "sinh",
  "cosh",
  "tanh",
  "sqrt",
  "cbrt",
  "abs",
  "floor",
  "ceil",
  "round",
  "exp",
  "sign",
  "log10",
  "log2",
  "ln",
  "log",
  "min",
  "max",
  "hypot",
]);

const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  tau: Math.PI * 2,
  e: Math.E,
};

function preprocess(source: string): string {
  return source
    .replace(/[π]/g, "pi")
    .replace(/[×]/g, "*")
    .replace(/[÷]/g, "/")
    .replace(/[−]/g, "-")
    .replace(/[–]/g, "-")
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    .replace(/√/g, "sqrt");
}

function tokenize(source: string): Token[] {
  const s = preprocess(source);
  const tokens: Token[] = [];
  let i = 0;

  while (i < s.length) {
    const ch = s[i];
    if (ch === " " || ch === "\t" || ch === "\n") {
      i += 1;
      continue;
    }

    if (ch === "." || (ch >= "0" && ch <= "9")) {
      const start = i;
      while (i < s.length && ((s[i] >= "0" && s[i] <= "9") || s[i] === ".")) i += 1;
      if (i < s.length && (s[i] === "e" || s[i] === "E")) {
        const peek = s[i + 1];
        const peek2 = s[i + 2];
        if (peek === "+" || peek === "-") {
          if (peek2 >= "0" && peek2 <= "9") {
            i += 2;
            while (i < s.length && s[i] >= "0" && s[i] <= "9") i += 1;
          }
        } else if (peek >= "0" && peek <= "9") {
          i += 1;
          while (i < s.length && s[i] >= "0" && s[i] <= "9") i += 1;
        }
      }
      const raw = s.slice(start, i);
      const value = Number(raw);
      if (!Number.isFinite(value)) throw new CalcError("Invalid number");
      tokens.push({ kind: "num", value });
      continue;
    }

    if ((ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch === "_") {
      const lower = s.slice(i).toLowerCase();
      let matched: string | null = null;
      for (const kw of KEYWORDS) {
        if (lower.startsWith(kw)) {
          const next = s[i + kw.length];
          const nextIsIdent =
            (next >= "a" && next <= "z") ||
            (next >= "A" && next <= "Z") ||
            (next >= "0" && next <= "9") ||
            next === "_";
          if (!nextIsIdent) {
            matched = kw;
            break;
          }
          if (kw.length > 1 && KEYWORD_SET.has(kw)) {
            matched = kw;
            break;
          }
        }
      }
      if (matched) {
        tokens.push({ kind: "ident", value: matched });
        i += matched.length;
        continue;
      }
      tokens.push({ kind: "ident", value: s[i].toLowerCase() });
      i += 1;
      continue;
    }

    if ("+-*/^%!(),".includes(ch)) {
      tokens.push({ kind: "op", value: ch });
      i += 1;
      continue;
    }

    if (ch === "=") {
      throw new CalcError("Unexpected '='");
    }

    throw new CalcError(`Unexpected character '${ch}'`);
  }

  return tokens;
}

class Parser {
  private i = 0;
  constructor(private tokens: Token[]) {}

  peek(): Token | undefined {
    return this.tokens[this.i];
  }

  eat(): Token {
    const t = this.tokens[this.i];
    if (!t) throw new CalcError("Unexpected end of expression");
    this.i += 1;
    return t;
  }

  matchOp(value: string): boolean {
    const t = this.peek();
    if (t?.kind === "op" && t.value === value) {
      this.i += 1;
      return true;
    }
    return false;
  }

  startsPrimary(t: Token | undefined): boolean {
    if (!t) return false;
    if (t.kind === "num" || t.kind === "ident") return true;
    return t.kind === "op" && t.value === "(";
  }

  parse(): Ast {
    if (this.tokens.length === 0) throw new CalcError("Empty expression");
    const node = this.parseExpr();
    if (this.peek()) throw new CalcError("Unexpected extra input");
    return node;
  }

  parseExpr(): Ast {
    let left = this.parseTerm();
    while (true) {
      if (this.matchOp("+")) left = { type: "bin", op: "+", left, right: this.parseTerm() };
      else if (this.matchOp("-")) left = { type: "bin", op: "-", left, right: this.parseTerm() };
      else break;
    }
    return left;
  }

  parseTerm(): Ast {
    let left = this.parseUnary();
    while (true) {
      if (this.matchOp("*")) left = { type: "bin", op: "*", left, right: this.parseUnary() };
      else if (this.matchOp("/")) left = { type: "bin", op: "/", left, right: this.parseUnary() };
      else if (this.matchOp("%")) left = { type: "bin", op: "%", left, right: this.parseUnary() };
      else if (this.startsPrimary(this.peek()) && !this.isBinOp(this.peek())) {
        left = { type: "bin", op: "*", left, right: this.parseUnary() };
      } else break;
    }
    return left;
  }

  isBinOp(t: Token | undefined): boolean {
    return t?.kind === "op" && "+-*/^%!),".includes(t.value);
  }

  parseUnary(): Ast {
    if (this.matchOp("+")) return this.parseUnary();
    if (this.matchOp("-")) return { type: "unary", op: "-", arg: this.parseUnary() };
    return this.parsePower();
  }

  parsePower(): Ast {
    const base = this.parsePostfix();
    if (this.matchOp("^")) return { type: "bin", op: "^", left: base, right: this.parseUnary() };
    return base;
  }

  parsePostfix(): Ast {
    let node = this.parsePrimary();
    while (this.matchOp("!")) node = { type: "unary", op: "!", arg: node };
    return node;
  }

  parsePrimary(): Ast {
    const t = this.peek();
    if (!t) throw new CalcError("Unexpected end of expression");

    if (t.kind === "num") {
      this.eat();
      return { type: "num", value: t.value };
    }

    if (t.kind === "ident") {
      this.eat();
      const name = t.value;
      if (this.matchOp("(")) {
        const args: Ast[] = [];
        if (!this.matchOp(")")) {
          args.push(this.parseExpr());
          while (this.matchOp(",")) args.push(this.parseExpr());
          if (!this.matchOp(")")) throw new CalcError("Missing ')'");
        }
        return { type: "call", name, args };
      }
      if (FUNCTION_SET.has(name) && this.startsPrimary(this.peek()) && this.peek()?.kind !== "op") {
        return { type: "call", name, args: [this.parseUnary()] };
      }
      if (FUNCTION_SET.has(name) && this.peek()?.kind === "op" && this.peek()?.value === "(") {
        return { type: "call", name, args: [this.parsePrimary()] };
      }
      return { type: "ident", name };
    }

    if (t.kind === "op" && t.value === "(") {
      this.eat();
      const inner = this.parseExpr();
      if (!this.matchOp(")")) throw new CalcError("Missing ')'");
      return inner;
    }

    throw new CalcError("Expected a number, variable, or '('");
  }
}

type Ast =
  | { type: "num"; value: number }
  | { type: "ident"; name: string }
  | { type: "unary"; op: string; arg: Ast }
  | { type: "bin"; op: string; left: Ast; right: Ast }
  | { type: "call"; name: string; args: Ast[] };

function factorial(n: number): number {
  if (!Number.isFinite(n) || n < 0) throw new CalcError("Factorial of negative");
  if (Math.abs(n - Math.round(n)) > 1e-10) throw new CalcError("Factorial needs an integer");
  const k = Math.round(n);
  if (k > 170) throw new CalcError("Overflow");
  let acc = 1;
  for (let i = 2; i <= k; i += 1) acc *= i;
  return acc;
}

function toRad(x: number, mode: AngleMode): number {
  return mode === "deg" ? (x * Math.PI) / 180 : x;
}

function fromRad(x: number, mode: AngleMode): number {
  return mode === "deg" ? (x * 180) / Math.PI : x;
}

function callFn(name: string, args: number[], mode: AngleMode): number {
  const n = name === "arcsin" ? "asin" : name === "arccos" ? "acos" : name === "arctan" ? "atan" : name;

  const one = (fn: (x: number) => number) => {
    if (args.length !== 1) throw new CalcError(`${name} takes 1 argument`);
    return fn(args[0]);
  };

  switch (n) {
    case "sin":
      return one((x) => Math.sin(toRad(x, mode)));
    case "cos":
      return one((x) => Math.cos(toRad(x, mode)));
    case "tan":
      return one((x) => {
        const r = toRad(x, mode);
        const c = Math.cos(r);
        if (Math.abs(c) < 1e-14) throw new CalcError("Undefined");
        return Math.sin(r) / c;
      });
    case "asin":
      return one((x) => {
        if (x < -1 || x > 1) throw new CalcError("Undefined");
        return fromRad(Math.asin(x), mode);
      });
    case "acos":
      return one((x) => {
        if (x < -1 || x > 1) throw new CalcError("Undefined");
        return fromRad(Math.acos(x), mode);
      });
    case "atan":
      return one((x) => fromRad(Math.atan(x), mode));
    case "sinh":
      return one(Math.sinh);
    case "cosh":
      return one(Math.cosh);
    case "tanh":
      return one(Math.tanh);
    case "sqrt":
      return one((x) => {
        if (x < 0) throw new CalcError("Undefined");
        return Math.sqrt(x);
      });
    case "cbrt":
      return one(Math.cbrt);
    case "abs":
      return one(Math.abs);
    case "floor":
      return one(Math.floor);
    case "ceil":
      return one(Math.ceil);
    case "round":
      return one(Math.round);
    case "exp":
      return one(Math.exp);
    case "sign":
      return one(Math.sign);
    case "ln":
      return one((x) => {
        if (x <= 0) throw new CalcError("Undefined");
        return Math.log(x);
      });
    case "log":
    case "log10":
      return one((x) => {
        if (x <= 0) throw new CalcError("Undefined");
        return Math.log10(x);
      });
    case "log2":
      return one((x) => {
        if (x <= 0) throw new CalcError("Undefined");
        return Math.log2(x);
      });
    case "min":
      if (args.length < 2) throw new CalcError("min takes 2 arguments");
      return Math.min(...args);
    case "max":
      if (args.length < 2) throw new CalcError("max takes 2 arguments");
      return Math.max(...args);
    case "hypot":
      if (args.length < 2) throw new CalcError("hypot takes 2 arguments");
      return Math.hypot(...args);
    default:
      throw new CalcError(`Unknown function '${name}'`);
  }
}

function evalAst(node: Ast, vars: Record<string, number>, mode: AngleMode): number {
  switch (node.type) {
    case "num":
      return node.value;
    case "ident": {
      if (node.name in vars) return vars[node.name];
      if (node.name in CONSTANTS) return CONSTANTS[node.name];
      if (FUNCTION_SET.has(node.name)) throw new CalcError(`Missing '(' after ${node.name}`);
      throw new CalcError(`Unknown name '${node.name}'`);
    }
    case "unary": {
      const v = evalAst(node.arg, vars, mode);
      if (node.op === "-") return -v;
      if (node.op === "!") return factorial(v);
      throw new CalcError("Unknown operator");
    }
    case "bin": {
      const l = evalAst(node.left, vars, mode);
      const r = evalAst(node.right, vars, mode);
      switch (node.op) {
        case "+":
          return l + r;
        case "-":
          return l - r;
        case "*":
          return l * r;
        case "/":
          if (r === 0) {
            if (l === 0) throw new CalcError("Undefined");
            return l > 0 ? Infinity : -Infinity;
          }
          return l / r;
        case "%":
          if (r === 0) throw new CalcError("Undefined");
          return l % r;
        case "^": {
          if (l < 0 && Math.abs(r - Math.round(r)) > 1e-10) throw new CalcError("Undefined");
          const p = l ** r;
          if (!Number.isFinite(p)) throw new CalcError("Overflow");
          return p;
        }
        default:
          throw new CalcError("Unknown operator");
      }
    }
    case "call":
      return callFn(
        node.name,
        node.args.map((a) => evalAst(a, vars, mode)),
        mode,
      );
  }
}

export function evaluate(
  expression: string,
  vars: Record<string, number> = {},
  mode: AngleMode = "rad",
): number {
  const tokens = tokenize(expression);
  const ast = new Parser(tokens).parse();
  const value = evalAst(ast, vars, mode);
  if (Number.isNaN(value)) throw new CalcError("Undefined");
  return value;
}

export function tryEvaluate(
  expression: string,
  vars: Record<string, number> = {},
  mode: AngleMode = "rad",
): { ok: true; value: number } | { ok: false; error: string } {
  const trimmed = expression.trim();
  if (!trimmed) return { ok: false, error: "" };
  try {
    return { ok: true, value: evaluate(trimmed, vars, mode) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error" };
  }
}

export function formatNumber(n: number): string {
  if (Number.isNaN(n)) return "undefined";
  if (n === Infinity) return "∞";
  if (n === -Infinity) return "−∞";
  if (Object.is(n, -0)) return "0";

  const abs = Math.abs(n);
  if (abs !== 0 && (abs >= 1e12 || abs < 1e-9)) {
    const exp = n.toExponential(8);
    return exp
      .replace("e+", "e")
      .replace(/\.?0+e/, "e")
      .replace("-", "−");
  }

  const rounded = Number(n.toPrecision(12));
  if (Object.is(rounded, -0)) return "0";
  let s = String(rounded);
  if (s.includes("e")) {
    return s.replace("e+", "e").replace("-", "−");
  }
  if (s.startsWith("-")) s = "−" + s.slice(1);
  return s;
}

export function formatTableNumber(n: number): string {
  if (Number.isNaN(n)) return "—";
  if (n === Infinity) return "∞";
  if (n === -Infinity) return "−∞";
  if (Object.is(n, -0) || n === 0) return "0";
  const abs = Math.abs(n);
  if (abs >= 1e6 || abs < 1e-4) {
    return n.toExponential(4).replace("e+", "e").replace(/-/, "−");
  }
  const rounded = Number(n.toPrecision(6));
  return String(rounded).replace("-", "−");
}

export function insertAt(source: string, cursor: number, text: string): { value: string; cursor: number } {
  const next = source.slice(0, cursor) + text + source.slice(cursor);
  return { value: next, cursor: cursor + text.length };
}

export function backspaceAt(source: string, cursor: number): { value: string; cursor: number } {
  if (cursor <= 0) return { value: source, cursor: 0 };
  return { value: source.slice(0, cursor - 1) + source.slice(cursor), cursor: cursor - 1 };
}

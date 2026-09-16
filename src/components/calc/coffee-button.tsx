import { useState } from "react";
import { Check, Coffee, Copy, ExternalLink, X } from "lucide-react";
import { COFFEE_URL, openExternalUrl } from "@/lib/calc/links";
import { cn } from "@/lib/utils";

export function CoffeeButton({
  className,
  label = "Coffee",
}: {
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(COFFEE_URL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      const input = document.getElementById("meridian-coffee-url") as HTMLInputElement | null;
      input?.select();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex min-h-11 min-w-11 items-center gap-1.5 rounded-md px-2 text-muted transition-colors duration-150 hover:text-fg",
          className,
        )}
        aria-label="Buy me a coffee"
      >
        <Coffee className="size-4" strokeWidth={1.75} />
        {label ? <span className="text-xs font-medium squat:hidden">{label}</span> : null}
      </button>
      {open ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-bg/70 p-3 sm:items-center">
          <div
            role="dialog"
            aria-label="Buy me a coffee"
            className="w-full max-w-md rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-medium tracking-tight">Buy me a coffee</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  Opens Wilson’s Buy Me a Coffee page. If your browser blocks the popup, copy the
                  link and paste it in Chrome or Brave.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-sm text-muted hover:text-fg"
                aria-label="Close"
              >
                <X className="size-4" strokeWidth={1.75} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => openExternalUrl(COFFEE_URL)}
              className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-[#FFDD00] text-sm font-semibold text-[#0d0c22] transition-transform duration-150 active:scale-[0.98]"
            >
              <Coffee className="size-4" strokeWidth={2} />
              Buy me a coffee
              <ExternalLink className="size-3.5" strokeWidth={2} />
            </button>

            <label className="mt-4 block text-[0.68rem] font-medium uppercase tracking-[0.14em] text-subtle">
              Link
              <input
                id="meridian-coffee-url"
                readOnly
                value={COFFEE_URL}
                onFocus={(e) => e.currentTarget.select()}
                className="mt-1.5 min-h-12 w-full rounded-md bg-inset px-3 font-mono text-[0.8rem] text-fg outline-none"
              />
            </label>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => void copy()}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md bg-raised text-sm font-medium shadow-[var(--shadow-border)]"
              >
                {copied ? <Check className="size-4" strokeWidth={1.75} /> : <Copy className="size-4" strokeWidth={1.75} />}
                {copied ? "Copied" : "Copy link"}
              </button>
              <a
                href={COFFEE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md bg-raised text-sm font-medium text-fg shadow-[var(--shadow-border)]"
              >
                Open page
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

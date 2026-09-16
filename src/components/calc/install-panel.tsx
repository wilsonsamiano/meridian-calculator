import { useEffect, useState } from "react";
import { Check, Copy, Download, Monitor, X } from "lucide-react";
import { APK_URL, LICENSE_URL, SOURCE_URL, isNativeShell } from "@/lib/calc/links";
import { CoffeeButton } from "./coffee-button";

type Platform = "linux" | "windows" | "mac" | "ios" | "android" | "other";
type Browser = "brave" | "chrome" | "edge" | "safari" | "firefox" | "other";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  const iPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  if (/iPhone|iPod/.test(ua) || iPadOS || /iPad/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  if (/Win/.test(ua)) return "windows";
  if (/Mac/.test(ua)) return "mac";
  if (/Linux|X11/.test(ua)) return "linux";
  return "other";
}

function detectBrowser(): Browser {
  const ua = navigator.userAgent;
  const nav = navigator as Navigator & { brave?: unknown };
  if (nav.brave || /Brave/i.test(ua)) return "brave";
  if (/Edg\/|EdgiOS/.test(ua)) return "edge";
  if (/Firefox|FxiOS/.test(ua)) return "firefox";
  if (/CriOS|Chrome\//.test(ua)) return "chrome";
  if (/Safari/i.test(ua) && !/Chrome|CriOS|Android/i.test(ua)) return "safari";
  return "other";
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

function linuxDesktop(origin: string): string {
  return `[Desktop Entry]
Version=1.0
Type=Application
Name=Meridian
GenericName=Graphing Calculator
Comment=Open-source offline graphing calculator
Exec=sh -c "command -v brave-browser >/dev/null && exec brave-browser --app=${origin} -- || command -v brave >/dev/null && exec brave --app=${origin} -- || command -v google-chrome >/dev/null && exec google-chrome --app=${origin} -- || command -v chromium >/dev/null && exec chromium --app=${origin} -- || command -v firefox >/dev/null && exec firefox --new-window ${origin} || exec xdg-open ${origin}"
Icon=accessories-calculator
Terminal=false
Categories=Education;Science;Math;Utility;
Keywords=calculator;graph;math;plot;
StartupNotify=true
StartupWMClass=meridian
`;
}

function macCommand(origin: string): string {
  return `#!/bin/bash
# Double-click, or: chmod +x ~/Downloads/meridian.command && ~/Downloads/meridian.command
open -na "Brave Browser" --args --app="${origin}" 2>/dev/null \\
  || open -na "Google Chrome" --args --app="${origin}" 2>/dev/null \\
  || open "${origin}"
`;
}

function windowsBat(origin: string): string {
  return `@echo off
set ORIGIN=${origin}
set BRAVE=%LOCALAPPDATA%\\BraveSoftware\\Brave-Browser\\Application\\brave.exe
set CHROME=%PROGRAMFILES%\\Google\\Chrome\\Application\\chrome.exe
set EDGE=%PROGRAMFILES(X86)%\\Microsoft\\Edge\\Application\\msedge.exe
if exist "%BRAVE%" (start "" "%BRAVE%" --app=%ORIGIN% & exit /b)
if exist "%CHROME%" (start "" "%CHROME%" --app=%ORIGIN% & exit /b)
if exist "%EDGE%" (start "" "%EDGE%" --app=%ORIGIN% & exit /b)
start "" %ORIGIN%
`;
}

function downloadText(filename: string, contents: string, type = "text/plain") {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function BraveMenuSteps() {
  return (
    <li>
      <span className="font-medium">Brave:</span> you can install this without Safari.
      <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-muted">
        <li>
          Look for the install icon on the <span className="text-fg">right of the address bar</span> (a plus / computer).
        </li>
        <li>
          Or open the Brave menu (☰) → <span className="text-fg">Save and share</span> →{" "}
          <span className="text-accent">Install page as app…</span>
        </li>
        <li>
          If that is missing: ☰ → <span className="text-fg">More tools</span> →{" "}
          <span className="text-accent">Create shortcut…</span> → check{" "}
          <span className="text-fg">Open as window</span>.
        </li>
        <li>
          Shields blocking the install? Tap the lion and set Shields{" "}
          <span className="text-fg">Down</span> for this site, then reload.
        </li>
      </ol>
    </li>
  );
}

export function InstallControls() {
  const [open, setOpen] = useState(false);
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [platform, setPlatform] = useState<Platform>("other");
  const [browser, setBrowser] = useState<Browser>("other");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());
    setPlatform(detectPlatform());
    setBrowser(detectBrowser());
    if ("serviceWorker" in navigator && !isNativeShell()) {
      const swUrl = `${import.meta.env.BASE_URL}sw.js`;
      navigator.serviceWorker.register(swUrl).catch(() => undefined);
    }
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setPromptEvent(null);
      setInstalled(true);
      setOpen(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || isNativeShell()) return null;

  const nativeInstall = async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") {
      setPromptEvent(null);
      setInstalled(true);
      setOpen(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const isBrave = browser === "brave";
  const isIos = platform === "ios";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-muted transition-colors duration-150 hover:text-fg"
        aria-label="Install Meridian"
      >
        <Download className="size-4" strokeWidth={1.75} />
        <span className="hidden text-xs font-medium wide:inline squat:hidden">Install</span>
      </button>
      {open ? (
        <div className="absolute inset-0 z-30 flex items-end justify-center bg-bg/70 p-3 sm:items-center">
          <div
            role="dialog"
            aria-label="Install Meridian"
            className="max-h-[min(36rem,88dvh)] w-full max-w-md overflow-y-auto rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-medium tracking-tight">Install Meridian</h2>
                <p className="mt-0.5 text-sm text-muted">
                  {isIos
                    ? "On iPhone and iPad, a real home-screen app has to come from Safari."
                    : isBrave
                      ? "Brave can install this as its own app — no Safari needed."
                      : "Works in Brave, Chrome, Edge, and Safari."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-sm text-muted hover:text-fg"
                aria-label="Close install"
              >
                <X className="size-4" strokeWidth={1.75} />
              </button>
            </div>

            {promptEvent ? (
              <button
                type="button"
                onClick={() => void nativeInstall()}
                className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-accent text-sm font-medium text-accent-fg transition-transform duration-150 active:scale-[0.98]"
              >
                <Monitor className="size-4" strokeWidth={1.75} />
                Install as an app
              </button>
            ) : null}

            {platform === "android" ? (
              <a
                href={APK_URL}
                className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-accent text-sm font-medium text-accent-fg"
              >
                <Download className="size-4" strokeWidth={1.75} />
                Download Android APK
              </a>
            ) : null}

            <ol className="mt-4 space-y-3 text-sm leading-relaxed text-fg">
              {isIos ? (
                <>
                  <li>
                    <span className="font-medium">If you are in Brave</span> (or Chrome): Apple does not let those
                    browsers install web apps on iOS. Use Share →{" "}
                    <span className="text-accent">Open in Safari</span>, then continue below.
                  </li>
                  <li>
                    <span className="font-medium">In Safari:</span> tap Share →{" "}
                    <span className="text-accent">Add to Home Screen</span> → Add. Meridian opens like a native app.
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => void copyLink()}
                      className="inline-flex min-h-11 items-center gap-2 rounded-md bg-raised px-3 text-sm font-medium shadow-[var(--shadow-border)]"
                    >
                      {copied ? <Check className="size-4" strokeWidth={1.75} /> : <Copy className="size-4" strokeWidth={1.75} />}
                      {copied ? "Copied" : "Copy link for Safari"}
                    </button>
                  </li>
                </>
              ) : null}

              {platform === "android" ? (
                <li>
                  Prefer the APK above if the browser install button is missing. After it downloads, open the file
                  and allow install from this source.
                </li>
              ) : null}

              {platform === "linux" || platform === "windows" || platform === "mac" || platform === "other"
                ? isBrave || browser === "other"
                  ? <BraveMenuSteps />
                  : (
                    <li>
                      <span className="font-medium">
                        {browser === "chrome" ? "Chrome" : browser === "edge" ? "Edge" : "Browser"}:
                      </span>{" "}
                      use the install icon in the address bar, or the menu →{" "}
                      <span className="text-accent">Install Meridian</span> /{" "}
                      <span className="text-accent">Apps → Install this site as an app</span>.
                      {browser === "safari" ? (
                        <>
                          {" "}
                          Safari: File → <span className="text-accent">Add to Dock</span>.
                        </>
                      ) : null}
                    </li>
                  )
                : null}

              {platform === "linux" ? (
                <li>
                  <span className="font-medium">Linux launcher:</span> works even if Brave hides the install button.
                  It opens Meridian in a Brave app window.
                  <pre className="mt-2 overflow-x-auto rounded-md bg-inset px-3 py-2 font-mono text-[0.72rem] text-muted">
                    {`chmod +x ~/Downloads/meridian.desktop
mv ~/Downloads/meridian.desktop ~/.local/share/applications/`}
                  </pre>
                  <button
                    type="button"
                    onClick={() => downloadText("meridian.desktop", linuxDesktop(window.location.origin))}
                    className="mt-2 min-h-11 rounded-md bg-raised px-3 text-sm font-medium shadow-[var(--shadow-border)]"
                  >
                    Download Linux launcher
                  </button>
                </li>
              ) : null}

              {platform === "mac" ? (
                <li>
                  <span className="font-medium">Mac fallback:</span> download this and double-click it. It launches
                  Meridian in a Brave app window.
                  <button
                    type="button"
                    onClick={() => downloadText("meridian.command", macCommand(window.location.origin))}
                    className="mt-2 min-h-11 rounded-md bg-raised px-3 text-sm font-medium shadow-[var(--shadow-border)]"
                  >
                    Download Mac launcher
                  </button>
                </li>
              ) : null}

              {platform === "windows" ? (
                <li>
                  <span className="font-medium">Windows fallback:</span> download and double-click. It starts Brave
                  with <span className="font-mono text-xs">--app</span> so there is no browser chrome.
                  <button
                    type="button"
                    onClick={() => downloadText("meridian.bat", windowsBat(window.location.origin))}
                    className="mt-2 min-h-11 rounded-md bg-raised px-3 text-sm font-medium shadow-[var(--shadow-border)]"
                  >
                    Download Windows launcher
                  </button>
                </li>
              ) : null}
            </ol>

            <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4 text-sm">
              <a
                href={APK_URL}
                className="inline-flex min-h-11 items-center rounded-md bg-raised px-3 font-medium text-fg shadow-[var(--shadow-border)]"
              >
                Android APK
              </a>
              <CoffeeButton
                className="min-h-11 rounded-md bg-raised px-3 font-medium text-fg shadow-[var(--shadow-border)]"
                label="Buy me a coffee"
              />
              <a
                href={SOURCE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center rounded-md bg-raised px-3 font-medium text-fg shadow-[var(--shadow-border)]"
              >
                Source on GitHub
              </a>
              <a
                href={LICENSE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center rounded-md px-3 text-muted hover:text-fg"
              >
                MIT License
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

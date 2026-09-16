import { useEffect, useState } from "react";
import { Download, Monitor, X } from "lucide-react";

const SOURCE_URL = "https://github.com/wilsonsamiano/meridian-calculator";
const LICENSE_URL = "https://github.com/wilsonsamiano/meridian-calculator/blob/main/LICENSE";

type Platform = "linux" | "windows" | "mac" | "ios" | "android" | "other";

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

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

function desktopFile(origin: string): string {
  return `[Desktop Entry]
Version=1.0
Type=Application
Name=Meridian
GenericName=Graphing Calculator
Comment=Open-source offline graphing calculator
Exec=sh -c "command -v brave-browser >/dev/null && exec brave-browser --app=${origin} -- || command -v google-chrome >/dev/null && exec google-chrome --app=${origin} -- || command -v chromium >/dev/null && exec chromium --app=${origin} -- || command -v firefox >/dev/null && exec firefox --new-window ${origin} || exec xdg-open ${origin}"
Icon=accessories-calculator
Terminal=false
Categories=Education;Science;Math;Utility;
Keywords=calculator;graph;math;plot;
StartupNotify=true
`;
}

function downloadDesktop() {
  const blob = new Blob([desktopFile(window.location.origin)], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "meridian.desktop";
  a.click();
  URL.revokeObjectURL(url);
}

export function InstallControls() {
  const [open, setOpen] = useState(false);
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [platform, setPlatform] = useState<Platform>("other");

  useEffect(() => {
    setInstalled(isStandalone());
    setPlatform(detectPlatform());
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
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

  if (installed) return null;

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
                <p className="mt-0.5 text-sm text-muted">Open-source desktop app for Linux, Windows, and Mac.</p>
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

            <ol className="mt-4 space-y-3 text-sm leading-relaxed text-fg">
              {platform === "linux" ? (
                <>
                  <li>
                    <span className="font-medium">Brave, Chrome, or Edge:</span> open the browser menu →{" "}
                    <span className="text-accent">Install Meridian</span> / <span className="text-accent">Install page as app</span>.
                    It lands in your app drawer like any other Linux program.
                  </li>
                  <li>
                    <span className="font-medium">Desktop launcher:</span> download the{" "}
                    <code className="font-mono text-xs">.desktop</code> file, then:
                    <pre className="mt-2 overflow-x-auto rounded-md bg-inset px-3 py-2 font-mono text-[0.72rem] text-muted">
                      {`chmod +x ~/Downloads/meridian.desktop
mv ~/Downloads/meridian.desktop ~/.local/share/applications/`}
                    </pre>
                    <button
                      type="button"
                      onClick={downloadDesktop}
                      className="mt-2 min-h-11 rounded-md bg-raised px-3 text-sm font-medium shadow-[var(--shadow-border)]"
                    >
                      Download Linux launcher
                    </button>
                  </li>
                </>
              ) : null}
              {platform === "windows" ? (
                <li>
                  In <span className="font-medium">Edge</span> or <span className="font-medium">Chrome</span>, open the
                  menu → <span className="text-accent">Install Meridian</span> /{" "}
                  <span className="text-accent">Apps → Install this site as an app</span>. Pin it to the taskbar or Start.
                </li>
              ) : null}
              {platform === "mac" ? (
                <li>
                  <span className="font-medium">Chrome:</span> menu → <span className="text-accent">Install Meridian</span>.
                  <br />
                  <span className="font-medium">Safari:</span> File → <span className="text-accent">Add to Dock</span>.
                </li>
              ) : null}
              {platform === "ios" ? (
                <li>
                  Tap Share → <span className="text-accent">Add to Home Screen</span>. Works on iPhone and every iPad.
                </li>
              ) : null}
              {platform === "android" ? (
                <li>
                  Chrome menu → <span className="text-accent">Install app</span> /{" "}
                  <span className="text-accent">Add to Home screen</span>.
                </li>
              ) : null}
              {platform === "other" ? (
                <li>Use Chrome, Edge, or Brave and choose Install / Add to Home screen from the browser menu.</li>
              ) : null}
            </ol>

            <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4 text-sm">
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


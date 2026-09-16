/** iPadOS 27 reports 0 top inset while Liquid Glass still sits on the webview. */
export function measureEnvPx(property: string): number {
  if (typeof document === "undefined") return 0;
  const probe = document.createElement("div");
  probe.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;padding-top:${property}`;
  document.body.appendChild(probe);
  const px = Number.parseFloat(getComputedStyle(probe).paddingTop) || 0;
  probe.remove();
  return px;
}

export function applyChromeInset() {
  if (typeof window === "undefined") return;
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  const iPad =
    /iPad/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const iOS = /iPhone|iPod/.test(navigator.userAgent) || iPad;

  const sat = measureEnvPx("env(safe-area-inset-top, 0px)");
  const title = measureEnvPx("env(titlebar-area-height, 0px)");

  let fallback = 0;
  if (iOS && (standalone || iPad) && sat < 16 && title < 16) {
    const landscape = window.innerWidth > window.innerHeight;
    fallback = iPad ? (landscape ? 44 : 54) : landscape ? 24 : 48;
  }
  document.documentElement.style.setProperty("--chrome-fallback", `${fallback}px`);
}

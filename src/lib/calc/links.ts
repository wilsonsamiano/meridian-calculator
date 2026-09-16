export const COFFEE_URL = "https://buymeacoffee.com/wilsonsamiano";
export const SOURCE_URL = "https://github.com/wilsonsamiano/meridian-calculator";
export const LICENSE_URL = "https://github.com/wilsonsamiano/meridian-calculator/blob/main/LICENSE";
export const WEB_APP_URL = "https://wilsonsamiano.github.io/meridian-calculator/";
export const APK_URL =
  "https://github.com/wilsonsamiano/meridian-calculator/releases/latest/download/meridian.apk";
export const RELEASES_URL = "https://github.com/wilsonsamiano/meridian-calculator/releases/latest";

export function isNativeShell() {
  if (typeof window === "undefined") return false;
  return (
    window.location.hostname === "appassets.androidplatform.net" ||
    window.location.protocol === "file:"
  );
}

declare global {
  interface Window {
    MeridianNative?: { openUrl?: (url: string) => void };
  }
}

export function openExternalUrl(url: string) {
  if (typeof window === "undefined") return false;
  try {
    if (window.MeridianNative?.openUrl) {
      window.MeridianNative.openUrl(url);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (opened) return true;
  } catch {
    /* fall through */
  }
  try {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
    return true;
  } catch {
    return false;
  }
}

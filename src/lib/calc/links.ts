export const COFFEE_URL = "https://www.buymeacoffee.com/wilsonsamiano";
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

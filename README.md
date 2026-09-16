# Meridian

Open-source **offline graphing calculator**. Plot functions, trace values, and calculate on Linux, Windows, macOS, iPad, iPhone, and Android.

## Android APK

**[Download Meridian for Android](https://github.com/wilsonsamiano/meridian-calculator/releases/latest)** — get `meridian-1.0.0.apk` from Releases.

1. Download the APK on your phone or tablet.
2. Open the file. Allow install from GitHub / your browser if Android asks.
3. Meridian shows up in the app drawer and works **offline**.

## Use / install the web app

**[Open Meridian](https://wilsonsamiano.github.io/meridian-calculator/)** — that is the live app. Open it in Brave, Chrome, Edge, or Safari, then install it:

| Device | How to install |
| --- | --- |
| **Brave / Chrome / Edge** (Linux, Windows, Mac, Android) | Address-bar install icon, or menu → **Install page as app** / **Add to Home screen** |
| **Safari on iPhone / iPad** | Share → **Add to Home Screen** |
| **Safari on Mac** | File → **Add to Dock** |

Brave on iPhone cannot install web apps (Apple). Open the same link in Safari, then Add to Home Screen.

**License:** [MIT](LICENSE) · **Source:** [github.com/wilsonsamiano/meridian-calculator](https://github.com/wilsonsamiano/meridian-calculator)

Support development: [buymeacoffee.com/wilsonsamiano](https://buymeacoffee.com/wilsonsamiano)

## Desktop launcher (optional)

After you open the [web app](https://wilsonsamiano.github.io/meridian-calculator/) once:

### Linux (CachyOS, Ubuntu, Fedora, Arch, …)

1. Open Meridian in **Brave**, **Chrome**, **Chromium**, or **Edge**.
2. Browser menu → **Install Meridian** / **Install page as app**.
3. Optional launcher file: in the app tap **Install → Download Linux launcher**, then:

```bash
chmod +x ~/Downloads/meridian.desktop
mv ~/Downloads/meridian.desktop ~/.local/share/applications/
```

### Windows

Edge, Brave, or Chrome → menu → **Apps → Install this site as an app**. Pin to Start or the taskbar.

### macOS

- **Brave / Chrome:** menu → **Install Meridian** / **Install page as app**
- **Safari:** File → **Add to Dock**

## Features

- Scientific keypad with 2nd functions, DEG/RAD, ANS, history
- Graph up to four functions, pan / pinch-zoom, trace
- Value table and window presets
- Left- or right-handed keypad
- Runs fully offline after the first visit

## Develop

```bash
git clone https://github.com/wilsonsamiano/meridian-calculator.git
cd meridian-calculator
npm install
npm run dev
```

Requires Node 22. The calculator is client-side only (no account, no database). GitHub Pages builds with `npm run build:pages`.

## License

MIT © 2026 Wilson Samiano. IBM Plex fonts are under the SIL Open Font License.

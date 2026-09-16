# Meridian

Open-source **offline graphing calculator**. Plot functions, trace values, and calculate on Linux, Windows, macOS, iPad, iPhone, and Android.

**License:** [MIT](LICENSE) · **Source:** [github.com/wilsonsamiano/meridian-calculator](https://github.com/wilsonsamiano/meridian-calculator)

Support development: [buymeacoffee.com/wilsonsamiano](https://buymeacoffee.com/wilsonsamiano)

## Install as a desktop app

Meridian is a Progressive Web App. After you open it once in a Chromium browser, it can live in your app launcher, Start menu, or Dock — no store account, works offline.

### Linux (CachyOS, Ubuntu, Fedora, Arch, …)

1. Open Meridian in **Brave**, **Chrome**, **Chromium**, or **Edge**.
2. Browser menu → **Install Meridian** / **Install page as app**.
3. Optional launcher file: in the app tap **Install → Download Linux launcher**, then:

```bash
chmod +x ~/Downloads/meridian.desktop
mv ~/Downloads/meridian.desktop ~/.local/share/applications/
```

### Windows

Edge or Chrome → menu → **Apps → Install this site as an app**. Pin to Start or the taskbar.

### macOS

- **Chrome:** menu → **Install Meridian**
- **Safari:** File → **Add to Dock**

### iPhone / iPad

Share → **Add to Home Screen**.

### Android

Chrome menu → **Install app**.

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

Requires Node 22. The calculator is client-side only (no account, no database).

## License

MIT © 2026 Wilson Samiano. IBM Plex fonts are under the SIL Open Font License.

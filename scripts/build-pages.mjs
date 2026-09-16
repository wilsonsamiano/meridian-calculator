import { spawn } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const env = {
  ...process.env,
  GITHUB_PAGES: "1",
};

const viteBin = join(process.cwd(), "node_modules", ".bin", "vite");
const child = spawn(
  process.execPath,
  ["scripts/with-app-env.mjs", viteBin, "build", "--config", "vite.pages.config.ts"],
  { stdio: "inherit", env },
);

child.on("exit", (code) => {
  const index = join(".output/public/index.html");
  if (!existsSync(index)) {
    process.exit(code ?? 1);
  }
  copyFileSync(index, join(".output/public/404.html"));
  process.exit(0);
});

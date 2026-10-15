import { spawn, spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const url = "http://localhost:3201";
const dataPath = join(root, "artifacts", "test-workspace.json");
const existing = await fetch(url, { signal: AbortSignal.timeout(1000) }).catch(
  () => null,
);
if (existing)
  throw new Error(
    "Port 3201 is already in use. Stop that server before running the integration suite.",
  );
mkdirSync(join(root, "artifacts"), { recursive: true });
const fixture = spawnSync(
  process.execPath,
  ["scripts/seed-retail.mjs", "--reset"],
  {
    cwd: root,
    windowsHide: true,
    env: { ...process.env, AR_CRM_DATA_PATH: dataPath },
    encoding: "utf-8",
  },
);
if (fixture.status !== 0)
  throw new Error(
    fixture.stderr || "Could not create the isolated test fixture.",
  );
const server = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "dev", "-p", "3201"],
  {
    cwd: root,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      AR_CRM_DATA_PATH: dataPath,
      AR_CRM_DIST_DIR: ".next-test",
    },
  },
);
let diagnostics = "";
server.stdout.on("data", (data) => {
  diagnostics = (diagnostics + data.toString()).slice(-6000);
});
server.stderr.on("data", (data) => {
  diagnostics = (diagnostics + data.toString()).slice(-6000);
});
try {
  console.log("Starting an isolated retail workspace on port 3201...");
  let ready = false;
  for (let attempt = 0; attempt < 90; attempt++) {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(3000),
    }).catch(() => null);
    if (response?.ok) {
      ready = true;
      break;
    }
    if (server.exitCode !== null) throw new Error(diagnostics);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!ready)
    throw new Error(`The test server did not become ready.\n${diagnostics}`);
  const exitCode = await new Promise((resolve, reject) => {
    const test = spawn(
      process.env.PYTHON || "python",
      ["scripts/test-retail.py"],
      {
        cwd: root,
        windowsHide: true,
        stdio: "inherit",
        env: { ...process.env, PYTHONIOENCODING: "utf-8" },
      },
    );
    test.on("error", reject);
    test.on("exit", resolve);
  });
  process.exitCode = Number(exitCode ?? 1);
} finally {
  if (server.pid && server.exitCode === null) {
    if (process.platform === "win32")
      spawnSync("taskkill", ["/PID", String(server.pid), "/T", "/F"], {
        windowsHide: true,
        stdio: "ignore",
      });
    else server.kill("SIGTERM");
  }
}

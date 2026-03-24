#!/usr/bin/env node

/**
 * moe-prototype-factory CLI
 * Checks prerequisites, installs dependencies, and launches the dashboard.
 */

const { execSync, spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const ROOT = path.resolve(__dirname, "..");
const BACKEND_DIR = path.join(ROOT, "dashboard", "backend");
const FRONTEND_DIR = path.join(ROOT, "dashboard", "frontend");

// ── Helpers ──────────────────────────────────────────────

function log(emoji, msg) {
  console.log(`${emoji}  ${msg}`);
}

function fail(msg) {
  console.error(`\n\x1b[31m[ERROR]\x1b[0m ${msg}\n`);
  process.exit(1);
}

function commandExists(cmd) {
  try {
    execSync(`command -v ${cmd}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function getVersion(cmd, flag = "--version") {
  try {
    return execSync(`${cmd} ${flag} 2>/dev/null`, { encoding: "utf-8" }).trim().split("\n")[0];
  } catch {
    return "unknown";
  }
}

// ── Prerequisite Check ───────────────────────────────────

function checkPrerequisites() {
  console.log("\n\x1b[1m--- Checking Prerequisites ---\x1b[0m\n");

  const required = [
    { cmd: "gemini", label: "Gemini CLI", install: "npm i -g @google/gemini-cli" },
    { cmd: "claude", label: "Claude Code CLI", install: "npm i -g @anthropic-ai/claude-code" },
    { cmd: "python3", label: "Python 3", install: "https://python.org" },
    { cmd: "node", label: "Node.js", install: "https://nodejs.org" },
  ];

  let allOk = true;

  for (const dep of required) {
    if (commandExists(dep.cmd)) {
      log("\x1b[32m✓\x1b[0m", `${dep.label}: ${getVersion(dep.cmd)}`);
    } else {
      log("\x1b[31m✗\x1b[0m", `${dep.label} not found — install: ${dep.install}`);
      allOk = false;
    }
  }

  if (!allOk) {
    fail("Missing prerequisites. Please install the tools above and try again.");
  }

  console.log("");
}

// ── Dependency Installation ──────────────────────────────

function installDeps() {
  console.log("\x1b[1m--- Installing Dependencies ---\x1b[0m\n");

  // Python deps
  log("📦", "Installing Python dependencies...");
  try {
    execSync("pip3 install -q -r requirements.txt", {
      cwd: BACKEND_DIR,
      stdio: "inherit",
    });
    log("\x1b[32m✓\x1b[0m", "Python dependencies installed");
  } catch (e) {
    fail("Failed to install Python dependencies. Check pip3 and requirements.txt.");
  }

  // Node deps
  if (!fs.existsSync(path.join(FRONTEND_DIR, "node_modules"))) {
    log("📦", "Installing frontend dependencies...");
    try {
      execSync("npm install", { cwd: FRONTEND_DIR, stdio: "inherit" });
      log("\x1b[32m✓\x1b[0m", "Frontend dependencies installed");
    } catch (e) {
      fail("Failed to install frontend dependencies.");
    }
  } else {
    log("\x1b[32m✓\x1b[0m", "Frontend dependencies already installed");
  }

  console.log("");
}

// ── Server Launch ────────────────────────────────────────

function startServers() {
  console.log("\x1b[1m--- Starting Servers ---\x1b[0m\n");

  // Backend
  const backend = spawn(
    "python3",
    ["-m", "uvicorn", "main:app_asgi", "--host", "0.0.0.0", "--port", "8000", "--reload", "--reload-dir", "."],
    { cwd: BACKEND_DIR, stdio: "inherit" }
  );

  // Frontend
  const frontend = spawn("npx", ["next", "dev", "--port", "3000"], {
    cwd: FRONTEND_DIR,
    stdio: "inherit",
  });

  // Startup banner
  setTimeout(() => {
    console.log(`
\x1b[1m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m
  \x1b[1m🏭 MoE Prototype Factory is running!\x1b[0m

  Dashboard:  \x1b[36mhttp://localhost:3000\x1b[0m
  Backend:    \x1b[36mhttp://localhost:8000\x1b[0m
  API Docs:   \x1b[36mhttp://localhost:8000/docs\x1b[0m
\x1b[1m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m

  Press \x1b[33mCtrl+C\x1b[0m to stop both servers.
`);
  }, 2000);

  // Cleanup on exit
  function cleanup() {
    console.log("\n\x1b[33mShutting down servers...\x1b[0m");
    backend.kill("SIGTERM");
    frontend.kill("SIGTERM");
    setTimeout(() => {
      backend.kill("SIGKILL");
      frontend.kill("SIGKILL");
    }, 3000);
    setTimeout(() => process.exit(0), 3500);
  }

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  backend.on("exit", (code) => {
    if (code !== null && code !== 0) {
      console.error(`\n\x1b[31mBackend exited with code ${code}\x1b[0m`);
    }
  });

  frontend.on("exit", (code) => {
    if (code !== null && code !== 0) {
      console.error(`\n\x1b[31mFrontend exited with code ${code}\x1b[0m`);
    }
  });
}

// ── Main ─────────────────────────────────────────────────

console.log(`
\x1b[1m🏭 MoE Prototype Factory\x1b[0m
\x1b[2mGemini CLI + Claude Code CLI Multi-Agent App Generator\x1b[0m
`);

checkPrerequisites();
installDeps();
startServers();

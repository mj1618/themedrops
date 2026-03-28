import chalk from "chalk";
import { ChildProcess, spawn } from "child_process";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import { execSync } from "child_process";
import { dirname, resolve } from "path";
import { parse as parseYaml } from "yaml";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TaskDef {
  "prompt-string": string;
  depends_on?: string[];
}

interface PipelineDef {
  iterations: number;
  tasks: string[];
}

interface SwarmConfig {
  version: string;
  tasks: Record<string, TaskDef>;
  pipelines: Record<string, PipelineDef>;
}

interface StateFile {
  pipeline: string;
  currentIteration: number;
  completedIterations: number;
  taskResults: Record<string, "pending" | "running" | "done" | "failed">;
}

type TaskStatus =
  | "pending"
  | "waiting"
  | "running"
  | "done"
  | "failed"
  | "stopped";

interface RunningTask {
  name: string;
  status: TaskStatus;
  process?: ChildProcess;
  startTime?: number;
  endTime?: number;
  output: string;
  killedByPause?: boolean;
}

// ---------------------------------------------------------------------------
// Globals
// ---------------------------------------------------------------------------

const PROJECT_ROOT = resolve(
  dirname(new URL(import.meta.url).pathname),
  "../..",
);
const SWARM_FILE = resolve(PROJECT_ROOT, "swarm/swarm.yaml");
const STATE_FILE = resolve(PROJECT_ROOT, "swarm-cli/.state.json");
const STOP_FILE = resolve(PROJECT_ROOT, "swarm-cli/.stop");
const LOGS_DIR = resolve(PROJECT_ROOT, "swarm-cli/logs");

let running = true;
let paused = false;
const activeProcesses: ChildProcess[] = [];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadConfig(): SwarmConfig {
  const raw = readFileSync(SWARM_FILE, "utf-8");
  return parseYaml(raw) as SwarmConfig;
}

function loadState(): StateFile | null {
  if (existsSync(STATE_FILE)) {
    const content = readFileSync(STATE_FILE, "utf-8").trim();
    if (!content) return null;
    try {
      return JSON.parse(content);
    } catch {
      return null;
    }
  }
  return null;
}

function saveState(state: StateFile) {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function clearState() {
  try {
    unlinkSync(STATE_FILE);
  } catch {}
}

function requestStop() {
  writeFileSync(STOP_FILE, String(Date.now()));
  console.log(
    chalk.yellow(
      "Stop signal sent. The pipeline will halt after the current task finishes.",
    ),
  );
}

function checkStopRequested(): boolean {
  if (existsSync(STOP_FILE)) {
    try {
      unlinkSync(STOP_FILE);
    } catch {}
    return true;
  }
  return false;
}

function showStatus() {
  const TASKS_DIR = resolve(PROJECT_ROOT, "swarm/tasks");
  const state = loadState();

  console.log("");

  // Pipeline state
  if (state) {
    console.log(chalk.bold.cyan(`  Pipeline: ${state.pipeline}`));
    console.log(
      chalk.gray(`  Completed iterations: ${state.completedIterations}`),
    );
    console.log(
      chalk.gray(`  Current iteration:    ${state.currentIteration}`),
    );
    if (Object.keys(state.taskResults).length > 0) {
      console.log("");
      console.log(chalk.bold("  Last iteration results:"));
      for (const [name, status] of Object.entries(state.taskResults)) {
        const icon =
          status === "done"
            ? chalk.green("✓")
            : status === "failed"
              ? chalk.red("✗")
              : chalk.gray("○");
        console.log(`  ${icon} ${name}: ${status}`);
      }
    }
  } else {
    console.log(
      chalk.gray("  No pipeline state found (not started or fully completed)."),
    );
  }

  // Running agents
  console.log("");
  try {
    const pids = execSync(
      "pgrep -f 'claude.*-p.*--dangerously-skip-permissions'",
      { encoding: "utf-8" },
    ).trim();
    const count = pids ? pids.split("\n").length : 0;
    if (count > 0) {
      console.log(chalk.blue.bold(`  Running agents: ${count}`));
      for (const pid of pids.split("\n")) {
        console.log(chalk.blue(`    PID ${pid}`));
      }
    } else {
      console.log(chalk.gray("  Running agents: none"));
    }
  } catch {
    console.log(chalk.gray("  Running agents: none"));
  }

  // Task files
  console.log("");
  if (existsSync(TASKS_DIR)) {
    const files = readdirSync(TASKS_DIR)
      .filter((f: string) => f.endsWith(".md"))
      .sort();
    if (files.length === 0) {
      console.log(chalk.gray("  No task files yet."));
    } else {
      console.log(chalk.bold("  Task files:"));
      for (const f of files) {
        let icon: string;
        if (f.includes(".todo.")) icon = chalk.gray("○");
        else if (f.includes(".processing.")) icon = chalk.blue("●");
        else if (f.includes(".done.")) icon = chalk.green("✓");
        else if (f.includes(".reviewing.")) icon = chalk.magenta("◉");
        else if (f.includes(".reviewed.")) icon = chalk.green("✓✓");
        else icon = chalk.gray("?");
        console.log(`  ${icon} ${f}`);
      }
    }
  } else {
    console.log(chalk.gray("  No swarm/tasks/ directory."));
  }

  // Stop signal pending?
  if (existsSync(STOP_FILE)) {
    console.log("");
    console.log(
      chalk.yellow.bold(
        "  ⚠ Stop signal is pending — pipeline will halt at next check.",
      ),
    );
  }

  console.log("");
}

function elapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rs = s % 60;
  return `${m}m${rs}s`;
}

// ---------------------------------------------------------------------------
// Display
// ---------------------------------------------------------------------------

function renderStatus(
  pipelineName: string,
  iteration: number,
  totalIterations: number,
  tasks: RunningTask[],
) {
  const lines: string[] = [];
  lines.push("");
  lines.push(
    chalk.bold.cyan(`  Pipeline: ${pipelineName}`) +
      chalk.gray(` — iteration ${iteration}/${totalIterations}`),
  );
  lines.push(chalk.gray("  ─".repeat(25)));

  for (const t of tasks) {
    let icon: string;
    let color: (s: string) => string;
    let extra = "";

    switch (t.status) {
      case "pending":
        icon = "○";
        color = chalk.gray;
        break;
      case "waiting":
        icon = "◌";
        color = chalk.yellow;
        extra = " (waiting on deps)";
        break;
      case "running":
        icon = "●";
        color = chalk.blue;
        if (t.startTime) extra = ` (${elapsed(Date.now() - t.startTime)})`;
        break;
      case "done":
        icon = "✓";
        color = chalk.green;
        if (t.startTime && t.endTime)
          extra = ` (${elapsed(t.endTime - t.startTime)})`;
        break;
      case "failed":
        icon = "✗";
        color = chalk.red;
        break;
      case "stopped":
        icon = "■";
        color = chalk.yellow;
        break;
      default:
        icon = "?";
        color = chalk.white;
    }

    lines.push(color(`  ${icon} ${t.name}${extra}`));
  }

  lines.push("");
  if (paused) {
    lines.push(
      chalk.yellow.bold("  ⏸  PAUSED — press [r] to resume, [q] to quit"),
    );
  } else {
    lines.push(chalk.gray("  Press [p] to pause, [q] to quit"));
  }
  lines.push("");

  // Clear screen and re-render
  process.stdout.write("\x1B[2J\x1B[H");
  process.stdout.write(lines.join("\n"));
}

// ---------------------------------------------------------------------------
// Run a single agent
// ---------------------------------------------------------------------------

function runAgent(
  taskName: string,
  prompt: string,
  iteration: number,
): Promise<{ success: boolean; output: string }> {
  mkdirSync(LOGS_DIR, { recursive: true });
  const logFile = resolve(LOGS_DIR, `${iteration}-${taskName}.log`);
  writeFileSync(
    logFile,
    `--- ${taskName} (iteration ${iteration}) started at ${new Date().toISOString()} ---\n`,
  );

  return new Promise((promResolve) => {
    const args = [
      "-p",
      "--verbose",
      "--model",
      "opus",
      "--dangerously-skip-permissions",
      "--output-format",
      "stream-json",
      prompt,
    ];

    const proc = spawn("claude", args, {
      cwd: PROJECT_ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env },
      detached: true,
    });

    activeProcesses.push(proc);

    let output = "";

    proc.stdout?.on("data", (data: Buffer) => {
      const chunk = data.toString();
      output += chunk;
      appendFileSync(logFile, chunk);
    });

    proc.stderr?.on("data", (data: Buffer) => {
      const chunk = data.toString();
      output += chunk;
      appendFileSync(logFile, chunk);
    });

    proc.on("close", (code) => {
      appendFileSync(
        logFile,
        `\n--- exited with code ${code} at ${new Date().toISOString()} ---\n`,
      );
      const idx = activeProcesses.indexOf(proc);
      if (idx !== -1) activeProcesses.splice(idx, 1);
      promResolve({ success: code === 0, output });
    });

    proc.on("error", (err) => {
      appendFileSync(logFile, `\n--- error: ${err.message} ---\n`);
      const idx = activeProcesses.indexOf(proc);
      if (idx !== -1) activeProcesses.splice(idx, 1);
      promResolve({ success: false, output: err.message });
    });
  });
}

// ---------------------------------------------------------------------------
// Kill all active processes
// ---------------------------------------------------------------------------

function killAll() {
  for (const proc of activeProcesses) {
    try {
      if (proc.pid) {
        process.kill(-proc.pid, "SIGTERM");
      }
    } catch {}
  }
  activeProcesses.length = 0;
}

// ---------------------------------------------------------------------------
// Run a pipeline iteration
// ---------------------------------------------------------------------------

async function runIteration(
  config: SwarmConfig,
  pipeline: PipelineDef,
  pipelineName: string,
  iteration: number,
): Promise<{
  success: boolean;
  taskResults: Record<string, "pending" | "running" | "done" | "failed">;
}> {
  const tasks: RunningTask[] = pipeline.tasks.map((name) => ({
    name,
    status: "pending" as TaskStatus,
    output: "",
  }));

  const taskMap = new Map(tasks.map((t) => [t.name, t]));

  function refresh() {
    renderStatus(pipelineName, iteration, pipeline.iterations, tasks);
  }

  // Refresh display periodically
  const refreshInterval = setInterval(refresh, 1000);

  function getDeps(taskName: string): string[] {
    return config.tasks[taskName]?.depends_on ?? [];
  }

  function canRun(taskName: string): boolean {
    const deps = getDeps(taskName);
    return deps.every((d) => {
      const dt = taskMap.get(d);
      return dt && dt.status === "done";
    });
  }

  async function executeTask(task: RunningTask): Promise<void> {
    const def = config.tasks[task.name];
    if (!def) {
      task.status = "failed";
      return;
    }

    task.status = "running";
    task.startTime = Date.now();
    refresh();

    const result = await runAgent(task.name, def["prompt-string"], iteration);
    task.endTime = Date.now();
    task.output = result.output;
    if (result.success) {
      task.status = "done";
    } else {
      task.status = "failed";
      if (paused) {
        task.killedByPause = true;
      }
    }
    refresh();
  }

  // Process tasks respecting dependencies
  while (running) {
    // If paused, wait for resume, then reset killed tasks to pending
    while (paused && running) {
      await new Promise((r) => setTimeout(r, 300));
    }
    if (!running) break;

    // Reset tasks that were killed due to pause back to pending
    tasks
      .filter((t) => t.status === "failed" && t.killedByPause)
      .forEach((t) => {
        t.status = "pending";
        t.killedByPause = false;
        t.startTime = undefined;
        t.endTime = undefined;
        t.output = "";
      });
    // Also reset waiting tasks
    tasks
      .filter((t) => t.status === "waiting")
      .forEach((t) => (t.status = "pending"));

    const pending = tasks.filter((t) => t.status === "pending");
    if (
      pending.length === 0 &&
      tasks.every((t) => t.status !== "running" && t.status !== "waiting")
    ) {
      break; // All done or failed
    }

    // Start tasks whose deps are met
    const toStart = pending.filter((t) => canRun(t.name));
    const blocked = pending.filter((t) => !canRun(t.name));
    blocked.forEach((t) => (t.status = "waiting"));

    if (toStart.length > 0) {
      // Run eligible tasks concurrently
      const promises = toStart.map((t) => executeTask(t));
      await Promise.all(promises);

      // Reset waiting tasks back to pending for next round
      tasks
        .filter((t) => t.status === "waiting")
        .forEach((t) => (t.status = "pending"));
    } else if (tasks.some((t) => t.status === "running")) {
      // Wait for running tasks
      await new Promise((r) => setTimeout(r, 500));
    } else {
      // Nothing can run — deps might have failed
      break;
    }
  }

  clearInterval(refreshInterval);
  refresh();

  const allDone = tasks.every((t) => t.status === "done");
  const taskResults: Record<string, "pending" | "running" | "done" | "failed"> =
    {};
  for (const t of tasks) {
    if (t.status === "waiting" || t.status === "stopped") {
      taskResults[t.name] = "pending";
    } else {
      taskResults[t.name] = t.status;
    }
  }
  return { success: allDone, taskResults };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // Handle subcommands
  if (process.argv[2] === "stop") {
    requestStop();
    process.exit(0);
  }
  if (process.argv[2] === "status") {
    showStatus();
    process.exit(0);
  }

  const config = loadConfig();

  // Pick the first pipeline (or accept CLI arg)
  const pipelineArg = process.argv[2];
  const pipelineName = pipelineArg ?? Object.keys(config.pipelines)[0];
  const pipeline = config.pipelines[pipelineName];

  if (!pipeline) {
    console.error(
      chalk.red(`Pipeline "${pipelineName}" not found in swarm/swarm.yaml`),
    );
    console.error(
      chalk.gray(`Available: ${Object.keys(config.pipelines).join(", ")}`),
    );
    process.exit(1);
  }

  // Load state to resume if possible
  let state = loadState();
  let startIteration = 1;
  if (
    state &&
    state.pipeline === pipelineName &&
    state.completedIterations > 0
  ) {
    startIteration = state.completedIterations + 1;
    console.log(
      chalk.yellow(
        `Resuming from iteration ${startIteration} (${state.completedIterations} completed)`,
      ),
    );
    await new Promise((r) => setTimeout(r, 1500));
  }

  // Setup keyboard input
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", (key: Buffer) => {
      const ch = key.toString();
      if (ch === "q" || ch === "\x03") {
        // q or Ctrl+C
        running = false;
        paused = false;
        killAll();
        console.log(chalk.yellow("\n  Stopping all agents..."));
        saveState({
          pipeline: pipelineName,
          currentIteration: startIteration,
          completedIterations: startIteration - 1,
          taskResults: {},
        });
        setTimeout(() => process.exit(0), 1000);
      } else if (ch === "p") {
        paused = true;
        killAll();
      } else if (ch === "r") {
        paused = false;
      }
    });
  }

  // Handle SIGTERM/SIGINT
  for (const sig of ["SIGINT", "SIGTERM"] as const) {
    process.on(sig, () => {
      running = false;
      killAll();
      process.exit(0);
    });
  }

  // Ensure tasks directory exists
  mkdirSync(resolve(PROJECT_ROOT, "swarm/tasks"), { recursive: true });

  // Clean up any stale stop file on startup
  checkStopRequested();

  // Run iterations
  for (let i = startIteration; i <= pipeline.iterations; i++) {
    if (!running) break;

    // Check for external stop signal
    if (checkStopRequested()) {
      console.log(chalk.yellow("\n  Stop signal received. Halting pipeline."));
      killAll();
      saveState({
        pipeline: pipelineName,
        currentIteration: i,
        completedIterations: i - 1,
        taskResults: {},
      });
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }
      process.exit(0);
    }

    const result = await runIteration(config, pipeline, pipelineName, i);

    saveState({
      pipeline: pipelineName,
      currentIteration: i,
      completedIterations: i,
      taskResults: result.taskResults,
    });

    if (!result.success) {
      console.log(chalk.red(`\n  Iteration ${i} had failures. Stopping.`));
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }
      process.exit(1);
    }
  }

  // Done — only clear state when all iterations completed successfully
  clearState();
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }

  console.log(chalk.green.bold("\n  All iterations complete!\n"));
  process.exit(0);
}

main().catch((err) => {
  console.error(chalk.red("Fatal error:"), err);
  process.exit(1);
});

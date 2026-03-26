import chalk from "chalk";
import { ChildProcess, spawn } from "child_process";
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "fs";
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
const SWARM_FILE = resolve(PROJECT_ROOT, "swarm.yaml");
const STATE_FILE = resolve(PROJECT_ROOT, "swarm-cli/.state.json");
const STOP_FILE = resolve(PROJECT_ROOT, "swarm-cli/.stop");

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
    return JSON.parse(readFileSync(STATE_FILE, "utf-8"));
  }
  return null;
}

function saveState(state: StateFile) {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function clearState() {
  try { unlinkSync(STATE_FILE); } catch {}
}

function requestStop() {
  writeFileSync(STOP_FILE, String(Date.now()));
  console.log(chalk.yellow("Stop signal sent. The pipeline will halt after the current task finishes."));
}

function checkStopRequested(): boolean {
  if (existsSync(STOP_FILE)) {
    try { unlinkSync(STOP_FILE); } catch {}
    return true;
  }
  return false;
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
): Promise<{ success: boolean; output: string }> {
  return new Promise((resolve) => {
    const args = [
      "-p",
      "--model",
      "opus",
      "--dangerously-skip-permissions",
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
      output += data.toString();
    });

    proc.stderr?.on("data", (data: Buffer) => {
      output += data.toString();
    });

    proc.on("close", (code) => {
      const idx = activeProcesses.indexOf(proc);
      if (idx !== -1) activeProcesses.splice(idx, 1);
      resolve({ success: code === 0, output });
    });

    proc.on("error", (err) => {
      const idx = activeProcesses.indexOf(proc);
      if (idx !== -1) activeProcesses.splice(idx, 1);
      resolve({ success: false, output: err.message });
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
): Promise<{ success: boolean; taskResults: Record<string, "pending" | "running" | "done" | "failed"> }> {
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

    const result = await runAgent(task.name, def["prompt-string"]);
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
  const taskResults: Record<string, "pending" | "running" | "done" | "failed"> = {};
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
  // Handle "stop" subcommand
  if (process.argv[2] === "stop") {
    requestStop();
    process.exit(0);
  }

  const config = loadConfig();

  // Pick the first pipeline (or accept CLI arg)
  const pipelineArg = process.argv[2];
  const pipelineName = pipelineArg ?? Object.keys(config.pipelines)[0];
  const pipeline = config.pipelines[pipelineName];

  if (!pipeline) {
    console.error(
      chalk.red(`Pipeline "${pipelineName}" not found in swarm.yaml`),
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

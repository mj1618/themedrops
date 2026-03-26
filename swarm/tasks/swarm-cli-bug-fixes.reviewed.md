# Fix swarm-cli bugs that prevent reliable operation

## Context
The swarm-cli (`swarm-cli/src/index.ts`) has several bugs that will cause crashes or unreliable behavior during pipeline runs. These need to be fixed before the CLI can be used to orchestrate agents.

## Bug 1: `clearState()` corrupts state file (line 89)

`clearState()` writes an empty string to the state file:
```ts
writeFileSync(STATE_FILE, "");
```
On next startup, `loadState()` (line 78) reads the file (it exists, so the `existsSync` check passes), then calls `JSON.parse("")` which throws a `SyntaxError`. This crashes the CLI on any restart after a completed run.

**Fix:** Use `unlinkSync(STATE_FILE)` instead of writing an empty string, wrapped in a try/catch like the existing pattern on line 100.

## Bug 2: Process tree not fully cleaned up (line 242-249)

`killAll()` sends SIGTERM only to the direct child process. The `claude` CLI spawns its own sub-processes (LSP servers, tool processes, etc.) which will be orphaned when the parent is killed.

**Fix:** Spawn processes with `detached: true` and use `process.kill(-proc.pid!, 'SIGTERM')` to kill the entire process group. Update the spawn call on line 206 to include `detached: true`, and update `killAll()` to use negative PID for group kill.

## Bug 3: Pause kills tasks but resume doesn't restart them (lines 410-414)

When the user presses 'p', `killAll()` is called which terminates running agent processes. The agents resolve with `success: false`. When 'r' is pressed, the main loop continues but the killed tasks are already marked as "failed" - they don't get retried. The iteration is recorded as a failure and the pipeline stops.

**Fix:** When pause is triggered, instead of killing processes immediately, set a flag that prevents new tasks from starting. For already-running tasks, let them complete. Alternatively, if kill-on-pause is desired, mark killed tasks as "pending" (not failed) so they restart on resume. The simplest approach: in `runIteration`, after the pause/resume wait loop, reset any "failed" tasks that were killed due to pause back to "pending" so they re-run.

## Bug 4: `swarm/tasks/` directory never created

The planner agent writes to `./swarm/tasks/` but nothing ensures this directory exists. The very first planner run will fail with ENOENT.

**Fix:** In `main()`, before running iterations, ensure the tasks directory exists:
```ts
import { mkdirSync } from "fs";
mkdirSync(resolve(PROJECT_ROOT, "swarm/tasks"), { recursive: true });
```

## Bug 5: State `taskResults` is always empty

`saveState()` is always called with `taskResults: {}` (lines 403, 440, 456-461), never recording actual per-task outcomes. This makes resume-from-state unreliable since there's no record of which tasks completed.

**Fix:** After each iteration, populate `taskResults` from the actual task statuses before saving state.

## Acceptance criteria
- CLI can complete a full pipeline run and restart cleanly afterward (no JSON parse crash)
- Pressing 'p' then 'r' resumes the pipeline without marking paused tasks as failed
- Pressing 'q' cleans up all child processes and their sub-processes
- The `swarm/tasks/` directory is auto-created on first run
- State file accurately records per-task results

## Completion Notes

All 5 bugs fixed in `swarm-cli/src/index.ts`:

1. **clearState() corruption** — Replaced `writeFileSync("")` with `unlinkSync()` wrapped in try/catch so `loadState()` won't crash on `JSON.parse("")`.

2. **Process tree cleanup** — Added `detached: true` to spawn options and changed `killAll()` to use `process.kill(-proc.pid, "SIGTERM")` to kill entire process groups.

3. **Pause/resume losing tasks** — Added `killedByPause` flag to `RunningTask`. When pause kills a running task, it's marked `killedByPause`. The main loop in `runIteration` now handles pause internally — when resumed, it resets killed tasks to "pending" so they re-run.

4. **Missing tasks directory** — Added `mkdirSync(resolve(PROJECT_ROOT, "swarm/tasks"), { recursive: true })` in `main()` before running iterations.

5. **Empty taskResults** — Changed `runIteration` to return `{ success, taskResults }` with actual per-task statuses. All `saveState` calls after iteration completion now use real task results.

TypeScript compiles cleanly with `tsc --noEmit`.

## Review Notes

All 5 bug fixes verified and look correct. One additional bug found and fixed during review:

**Bug found: `clearState()` defeats resume-from-state** — After the iteration loop, `clearState()` ran unconditionally. This meant that if an iteration failed or a stop signal was received, the state saved moments earlier was immediately deleted, making resume impossible. Fixed by exiting the process directly in the failure and stop-signal paths (before reaching `clearState()`), so `clearState()` only runs when all iterations complete successfully.

TypeScript still compiles cleanly after the fix.

# Swarm CLI

A CLI tool that runs and manages AI agent pipelines defined in `swarm/swarm.yaml`.

## Setup

```bash
cd swarm-cli
npm install
```

## Usage

### Start the pipeline

```bash
cd swarm-cli
npm start
```

Or run a specific pipeline by name:

```bash
npx tsx src/index.ts development
```

### Controls

While the pipeline is running, use these keyboard controls:

| Key      | Action                                                  |
| -------- | ------------------------------------------------------- |
| `p`      | Pause — stops all running agents and holds the pipeline |
| `r`      | Resume — continues the pipeline from where it paused    |
| `q`      | Quit — stops all agents and saves progress for later    |
| `Ctrl+C` | Same as quit                                            |

### Resume after stopping

Just run `npm start` again. The CLI saves its state and will pick up from the last completed iteration.

### Reset state

Delete the state file to start fresh:

```bash
rm swarm-cli/.state.json
```

## How it works

1. Reads `swarm.yaml` from the project root
2. For each iteration of the pipeline, runs tasks in dependency order
3. Each task spawns a fresh `claude` agent with `--model opus` and `--dangerously-skip-permissions`
4. Tasks with dependencies wait until their dependencies complete
5. Tasks without dependencies run concurrently
6. Progress is displayed in a live-updating terminal UI

## Project structure

```
swarm-cli/          # CLI tool (separate from project source)
  src/index.ts      # Main CLI entry point
  package.json
  .state.json       # Auto-generated state file for resume
swarm/
  swarm.yaml          # Pipeline definition
  PLAN.md           # Plan file referenced by planner agent
  tasks/            # Task files created/managed by agents
```

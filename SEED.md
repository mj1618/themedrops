Look at @swarm.yaml

Your job is to look for a tool that is available to you, and to build a small CLI tool that will run and manage the agents in swarm.yaml
swarm.yaml defines a pipeline with dependencies, each task in the pipeline is an agent run with a fresh context window.
The prompt is fed into the agent and run to completion.

Look at whether there is codex or claude available on the local machine.
Each agent should be run with skip permissions.
It should use the Sonnet model if in claude, or codex-5.3 if in codex.

The user should be able to see the progress of all agents, and be able to stop all of them from running and then restart when ready.

Make a CLEAR seperation between the folder this cli tool is running in, and the source code of the project itself.

Test the script out and make sure it works properly.

Save instructions to README.md on how to run the script, or stop the agents, etc.

Prefer using the following in order:

- Typescript/Node
- Golang
- Python
- fall back to whatever scripting is available on the machine

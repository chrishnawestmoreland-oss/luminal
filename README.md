# Luminal — AI Autonomous Copilot

Luminal is a small, transparent autonomous copilot. Give it a goal in plain
language and it plans the work, uses tools to do it, checks its own progress,
and asks you before doing anything risky.

> **Autonomous, not unsupervised.** Luminal can act on its own inside a
> workspace you choose, but destructive or outward-facing actions
> (deleting files, sending messages, spending money, publishing) always
> need your approval first.

## Quickstart

```bash
git clone https://github.com/chrishnawestmoreland-oss/luminal.git
cd luminal
npm install
npm run build

# Run a goal — no API key needed for the built-in offline planner
npm start -- "Summarise the notes in ./examples and write a plan in PLAN.md"

# With a real model (any OpenAI-compatible API)
export LUMINAL_API_KEY="sk-..."
export LUMINAL_MODEL="gpt-4o-mini"   # optional
npm start -- "Research the best budget laptop and save a shortlist to LAPTOPS.md"
```

## How it works

```
Goal ──► Planner ──► Agent loop ──► Tools ──► Memory
              ▲           │  plan / act / reflect
              └───────────┘
                    ▲
              Safety gate (approval for risky actions)
```

1. **Planner** — decomposes a goal into small, checkable steps.
2. **Agent loop** — runs one step at a time: pick a tool, act, observe the
   result, reflect, and re-plan if something fails.
3. **Tools** — file read/write, shell (allow-listed commands), HTTP fetch,
   and notes. New tools are one file in `src/tools.ts`.
4. **Memory** — Luminal remembers goals, decisions and lessons in
   `.luminal/memory.json` inside the workspace, so the next run starts
   smarter.
5. **Safety gate** — every action is classified `safe`, `caution` or
   `risky`. Risky actions pause for your yes/no before they run.

## Project layout

```
src/
  index.ts      CLI entrypoint
  agent.ts      the plan → act → reflect loop
  planner.ts    goal decomposition
  providers.ts  LLM providers (OpenAI-compatible + offline heuristic)
  tools.ts      file, shell, http and note tools
  safety.ts     risk classification + approval
  memory.ts     persistent workspace memory
  config.ts     environment + defaults
examples/
  goal.md       a sample goal to try
```

## Configuration

| Variable | Default | What it does |
| --- | --- | --- |
| `LUMINAL_API_KEY` | — | API key for an OpenAI-compatible model. Without it, Luminal uses the offline heuristic planner. |
| `LUMINAL_API_BASE` | `https://api.openai.com/v1` | Base URL for the model API. |
| `LUMINAL_MODEL` | `gpt-4o-mini` | Model name. |
| `LUMINAL_MAX_STEPS` | `20` | Max agent steps per goal. |
| `LUMINAL_WORKSPACE` | current directory | Workspace Luminal may work in. |
| `LUMINAL_AUTO_APPROVE` | `false` | Never set this to `true` on a machine you care about. |

## Roadmap

- [ ] Web research tool with citations
- [ ] Long-term memory search
- [ ] Multi-agent mode: a planner, a builder and a reviewer
- [ ] Browser tool for checking live pages
- [ ] Skill files (reusable playbooks, like Luminal's own memory)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Keep changes small, add a test or an
example goal when you change the agent loop, and never bypass the safety
gate to make a demo look smoother.

## License

MIT — see [LICENSE](LICENSE).

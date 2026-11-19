#!/usr/bin/env node
/** Luminal CLI: `luminal "your goal in plain language"` */
import { runGoal } from "./agent.js";

const HELP = `Luminal — AI autonomous copilot

Usage:
  luminal "your goal in plain language"
  luminal --help

Environment:
  LUMINAL_API_KEY     API key for an OpenAI-compatible model (optional;
                      without it Luminal uses its offline planner)
  LUMINAL_API_BASE    Model API base URL (default: https://api.openai.com/v1)
  LUMINAL_MODEL       Model name (default: gpt-4o-mini)
  LUMINAL_MAX_STEPS   Max steps per goal (default: 20)
  LUMINAL_WORKSPACE   Workspace Luminal may work in (default: current dir)
`;

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const goal = args.filter((arg) => !arg.startsWith("-")).join(" ").trim();

  if (args.includes("--help") || args.includes("-h") || !goal) {
    console.log(HELP);
    process.exit(goal ? 0 : 1);
  }

  const result = await runGoal(goal);
  console.log(
    result.completed
      ? `\n✅ Done — ${result.stepsRun} step(s) completed.`
      : `\n⚠ Finished partially — ${result.stepsRun} step(s) completed. Check the output above.`,
  );
}

main().catch((error: unknown) => {
  console.error("Luminal failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});

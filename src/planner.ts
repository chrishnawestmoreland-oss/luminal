import type { LlmProvider } from "./providers.js";

export interface Step {
  tool: string;
  input: string;
  description: string;
}

const KNOWN_TOOLS = new Set(["read_file", "write_file", "shell", "http_get"]);

/** Turn a goal into ordered steps, using the provider's plan text. */
export async function planGoal(
  goal: string,
  provider: LlmProvider,
): Promise<Step[]> {
  const planText = await provider.complete(`Goal: ${goal}`);
  const steps: Step[] = [];

  for (const line of planText.split("\n")) {
    const match = line.match(/^\s*\d+[.)]\s*(read_file|write_file|shell|http_get)\b\s*[-—:]\s*(.+)$/i);
    if (!match) continue;
    const tool = match[1].toLowerCase();
    if (!KNOWN_TOOLS.has(tool)) continue;
    steps.push({
      tool,
      input: match[2].trim(),
      description: `${tool}: ${match[2].trim()}`,
    });
  }

  // Fallback: if the provider returned no parseable steps, do the
  // smallest useful thing — read the goal's context, then write a plan.
  if (steps.length === 0) {
    steps.push(
      { tool: "shell", input: "ls", description: "shell: list the workspace" },
      {
        tool: "write_file",
        input: `PLAN.md\n# Plan\n\nGoal: ${goal}\n\n- [ ] Gather context\n- [ ] Produce the deliverable\n- [ ] Verify it\n`,
        description: "write_file: draft PLAN.md for the goal",
      },
    );
  }
  return steps;
}

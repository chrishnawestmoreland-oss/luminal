import { loadConfig } from "./config.js";
import { loadMemory, remember, relevantLessons } from "./memory.js";
import { planGoal, type Step } from "./planner.js";
import { providerFor } from "./providers.js";
import { classifyRisk, terminalApprover, type Approver } from "./safety.js";
import { toolByName } from "./tools.js";

export interface AgentResult {
  goal: string;
  completed: boolean;
  stepsRun: number;
  observations: string[];
}

export interface AgentOptions {
  workspace?: string;
  maxSteps?: number;
  autoApprove?: boolean;
  approver?: Approver;
  onEvent?: (message: string) => void;
}

/**
 * The Luminal agent loop: plan, then for each step — check safety,
 * get approval when needed, act, observe, and remember the outcome.
 */
export async function runGoal(goal: string, options: AgentOptions = {}): Promise<AgentResult> {
  const config = loadConfig(options.workspace);
  const maxSteps = options.maxSteps ?? config.maxSteps;
  const approver = options.approver ?? terminalApprover();
  const log = options.onEvent ?? ((message: string) => console.log(message));
  const observations: string[] = [];

  const memory = await loadMemory(config.workspace);
  const lessons = relevantLessons(memory, goal);
  if (lessons.length > 0) {
    log(`💡 Lessons from earlier goals: ${lessons.join(" | ")}`);
  }

  const provider = providerFor(config);
  log(`✨ Luminal (${provider.name}) — goal: ${goal}`);
  const steps = await planGoal(goal, provider);
  log(`📋 Plan (${steps.length} steps):`);
  steps.forEach((step, i) => log(`  ${i + 1}. ${step.description}`));

  let stepsRun = 0;
  for (const step of steps.slice(0, maxSteps)) {
    const risk = classifyRisk(step.description);
    const approved =
      config.autoApprove || options.autoApprove
        ? true
        : await approver.approve(step.description, risk);
    if (!approved) {
      log(`⏸ Skipped (not approved): ${step.description}`);
      observations.push(`Skipped: ${step.description}`);
      continue;
    }

    const tool = toolByName(step.tool);
    if (!tool) {
      log(`⚠ Unknown tool: ${step.tool}`);
      continue;
    }

    // The offline planner names a file for write_file; the agent fills in
    // the content from the goal and what it has observed so far.
    let input = step.input;
    if (step.tool === "write_file" && !input.includes("\n")) {
      const seen = observations.length
        ? `\n\nContext observed:\n${observations.join("\n")}`
        : "";
      input = `${input}\n# Luminal output\n\nGoal: ${goal}\n\nProduced by Luminal (offline planner).${seen}\n`;
    }

    try {
      const output = await tool.run(input, config.workspace);
      stepsRun += 1;
      observations.push(output.slice(0, 500));
      log(`✓ ${step.description}\n  → ${output.slice(0, 200)}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      observations.push(`Failed: ${step.description} — ${message}`);
      log(`✗ ${step.description} — ${message}`);
      // Reflect: stop the plan rather than guessing forward blindly.
      break;
    }
  }

  const completed = stepsRun > 0 && observations.every((o) => !o.startsWith("Failed:"));
  await remember(config.workspace, {
    goal,
    outcome: completed ? "completed" : "partially completed",
    lessons: completed
      ? [`Goal completed with ${stepsRun} step(s): ${goal}`]
      : [`Goal needs a retry: ${goal}`],
    at: new Date().toISOString(),
  });

  return { goal, completed, stepsRun, observations };
}

export type { Step };

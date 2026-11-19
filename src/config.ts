/** Configuration for Luminal, loaded from the environment. */
export interface LuminalConfig {
  apiKey: string | undefined;
  apiBase: string;
  model: string;
  maxSteps: number;
  workspace: string;
  autoApprove: boolean;
}

export function loadConfig(workspaceOverride?: string): LuminalConfig {
  const maxSteps = Number.parseInt(
    process.env.LUMINAL_MAX_STEPS ?? "20",
    10,
  );
  return {
    apiKey: process.env.LUMINAL_API_KEY ?? process.env.OPENAI_API_KEY,
    apiBase:
      process.env.LUMINAL_API_BASE ?? "https://api.openai.com/v1",
    model: process.env.LUMINAL_MODEL ?? "gpt-4o-mini",
    maxSteps: Number.isFinite(maxSteps) && maxSteps > 0 ? maxSteps : 20,
    workspace: workspaceOverride ?? process.env.LUMINAL_WORKSPACE ?? process.cwd(),
    // Safety default: never auto-approve unless the user explicitly opts in.
    autoApprove: process.env.LUMINAL_AUTO_APPROVE === "true",
  };
}

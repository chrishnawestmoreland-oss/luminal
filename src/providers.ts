/** LLM providers. Luminal works offline with the heuristic provider,
 *  and uses any OpenAI-compatible API when a key is configured. */

export interface LlmProvider {
  name: string;
  /** Return the model's reply to a plain-text prompt. */
  complete(prompt: string): Promise<string>;
}

/** Offline fallback: deterministic, rule-based planning. No network, no key.
 *  It picks concrete files out of the goal text (e.g. README.md, SUMMARY.md)
 *  so every step names a real tool input the agent can run. */
export const heuristicProvider: LlmProvider = {
  name: "heuristic (offline)",
  async complete(prompt) {
    const goal = prompt.replace(/^Goal:\s*/i, "").split("\n")[0] ?? prompt;
    const files = goal.match(/[\w./-]+\.(md|txt|ts|js|json)/g) ?? [];
    const readTarget = files[0] ?? "README.md";
    const writeTarget =
      files.length > 1 ? files[files.length - 1] : "PLAN.md";
    return [
      `Plan for: ${goal}`,
      `1. read_file — ${readTarget}`,
      "2. shell — ls",
      `3. write_file — ${writeTarget}`,
    ].join("\n");
  },
};

/** Any OpenAI-compatible chat-completions API. */
export function openAiCompatibleProvider(
  apiBase: string,
  apiKey: string,
  model: string,
): LlmProvider {
  return {
    name: `openai-compatible (${model})`,
    async complete(prompt) {
      const response = await fetch(`${apiBase.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content:
                "You are Luminal, an autonomous copilot. Break the user's goal into small, checkable steps. Each step names one tool (read_file, write_file, shell, http_get) and what it should do.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
        }),
        signal: AbortSignal.timeout(60_000),
      });
      if (!response.ok) {
        throw new Error(`Model API returned HTTP ${response.status}`);
      }
      const data = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      return data.choices?.[0]?.message?.content?.trim() ?? "";
    },
  };
}

export function providerFor(config: {
  apiKey: string | undefined;
  apiBase: string;
  model: string;
}): LlmProvider {
  return config.apiKey
    ? openAiCompatibleProvider(config.apiBase, config.apiKey, config.model)
    : heuristicProvider;
}

/** Risk classification and the human-approval gate. */

export type RiskLevel = "safe" | "caution" | "risky";

/** Anything matching a risky pattern needs explicit human approval. */
const RISKY_PATTERNS = [
  /\brm\b/,
  /\bdelete\b/,
  /\bdrop\b/,
  /\bpublish\b/,
  /\bsend\b/,
  /\bemail\b/,
  /\bpay\b/,
  /\bcharge\b/,
  /\bcurl\b.*\b(-X\s+POST|POST)\b/,
  /\bsudo\b/,
  /\bchmod\b/,
  /\bshutdown\b/,
];

const CAUTION_PATTERNS = [
  /\bwrite\b/,
  /\bcreate\b/,
  /\bupdate\b/,
  /\binstall\b/,
  /\bnpm\b/,
  /\bgit\s+(push|commit)\b/,
];

export function classifyRisk(description: string): RiskLevel {
  const text = description.toLowerCase();
  if (RISKY_PATTERNS.some((re) => re.test(text))) return "risky";
  if (CAUTION_PATTERNS.some((re) => re.test(text))) return "caution";
  return "safe";
}

export interface Approver {
  /** Return true only when the human approves this action. */
  approve(action: string, risk: RiskLevel): Promise<boolean>;
}

/** Ask on the terminal. Used by the CLI; tests can inject a fake. */
export function terminalApprover(): Approver {
  return {
    async approve(action, risk) {
      if (risk === "safe") return true;
      const { createInterface } = await import("node:readline");
      const rl = createInterface({ input: process.stdin, output: process.stdout });
      const answer = await new Promise<string>((resolve) => {
        rl.question(
          `\n⚠ ${risk.toUpperCase()} action — approve?\n  ${action}\n  [y/N] `,
          resolve,
        );
      });
      rl.close();
      return answer.trim().toLowerCase() === "y";
    },
  };
}

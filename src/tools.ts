import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** A tool Luminal can call. Keep tools small, named and observable. */
export interface Tool {
  name: string;
  description: string;
  /** Run the tool inside the workspace. Returns human-readable output. */
  run(input: string, workspace: string): Promise<string>;
}

function insideWorkspace(workspace: string, path: string): string {
  const resolved = resolve(workspace, path);
  if (!resolved.startsWith(resolve(workspace) + "/") && resolved !== resolve(workspace)) {
    throw new Error(`Refusing path outside workspace: ${path}`);
  }
  return resolved;
}

const readFileTool: Tool = {
  name: "read_file",
  description: "Read a file in the workspace. Input: relative path.",
  async run(input, workspace) {
    return readFile(insideWorkspace(workspace, input.trim()), "utf-8");
  },
};

const writeFileTool: Tool = {
  name: "write_file",
  description:
    "Write a file in the workspace. Input: first line is the relative path, the rest is the content.",
  async run(input, workspace) {
    const newline = input.indexOf("\n");
    if (newline === -1) throw new Error("write_file needs a path line and content");
    const path = insideWorkspace(workspace, input.slice(0, newline).trim());
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, input.slice(newline + 1), "utf-8");
    return `Wrote ${input.slice(0, newline).trim()}`;
  },
};

const ALLOWED_SHELL_COMMANDS = new Set([
  "ls", "pwd", "cat", "echo", "node", "npm", "npx", "git", "grep", "wc",
]);

const shellTool: Tool = {
  name: "shell",
  description:
    "Run an allow-listed shell command in the workspace. Input: the command.",
  async run(input, workspace) {
    const [command, ...args] = input.trim().split(/\s+/);
    if (!ALLOWED_SHELL_COMMANDS.has(command)) {
      throw new Error(`Shell command not allowed: ${command}`);
    }
    const { stdout, stderr } = await execFileAsync(command, args, {
      cwd: workspace,
      timeout: 30_000,
      maxBuffer: 1024 * 1024,
    });
    return (stdout + stderr).trim() || "(no output)";
  },
};

const httpTool: Tool = {
  name: "http_get",
  description: "Fetch a URL (GET) and return the first 8,000 characters. Input: URL.",
  async run(input) {
    const url = input.trim();
    if (!/^https?:\/\//.test(url)) throw new Error("http_get needs an http(s) URL");
    const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
    return (await response.text()).slice(0, 8000);
  },
};

export const tools: Tool[] = [readFileTool, writeFileTool, shellTool, httpTool];

export function toolByName(name: string): Tool | undefined {
  return tools.find((tool) => tool.name === name);
}

export function toolList(): string {
  return tools.map((t) => `- ${t.name}: ${t.description}`).join("\n");
}

/** Absolute path of Luminal's notes file inside a workspace. */
export function notesPath(workspace: string): string {
  return join(workspace, ".luminal", "notes.md");
}

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export interface MemoryEntry {
  goal: string;
  outcome: string;
  lessons: string[];
  at: string;
}

export interface Memory {
  entries: MemoryEntry[];
}

const EMPTY: Memory = { entries: [] };

export function memoryPath(workspace: string): string {
  return join(workspace, ".luminal", "memory.json");
}

export async function loadMemory(workspace: string): Promise<Memory> {
  try {
    return JSON.parse(await readFile(memoryPath(workspace), "utf-8")) as Memory;
  } catch {
    return { ...EMPTY, entries: [] };
  }
}

export async function remember(
  workspace: string,
  entry: MemoryEntry,
): Promise<void> {
  const memory = await loadMemory(workspace);
  memory.entries.push(entry);
  await mkdir(join(workspace, ".luminal"), { recursive: true });
  await writeFile(memoryPath(workspace), JSON.stringify(memory, null, 2), "utf-8");
}

export function relevantLessons(memory: Memory, goal: string): string[] {
  const words = new Set(goal.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
  return memory.entries
    .flatMap((entry) => entry.lessons)
    .filter((lesson) =>
      lesson.toLowerCase().split(/[^a-z0-9]+/).some((word) => words.has(word)),
    )
    .slice(0, 5);
}

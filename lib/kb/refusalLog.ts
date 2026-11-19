import fs from "node:fs";
import path from "node:path";

// Append-only log of assistant refusals (dosage, out-of-scope, suspected
// prompt injection) for human review — required by the voice-assistant
// safety principle ("log refusals for review"). Kept as local JSONL rather
// than a database, consistent with this app's local-first design; an
// operator can ship this file elsewhere for review if they want.
const LOG_DIR = path.join(process.cwd(), "data", "logs");
const LOG_FILE = path.join(LOG_DIR, "refusals.jsonl");

export interface RefusalLogEntry {
  timestamp: string;
  kind: "dose_refusal" | "out_of_scope" | "suspected_injection";
  question: string;
  detail?: string;
}

export function logRefusal(entry: Omit<RefusalLogEntry, "timestamp">): void {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    const full: RefusalLogEntry = { ...entry, timestamp: new Date().toISOString() };
    fs.appendFileSync(LOG_FILE, JSON.stringify(full) + "\n", "utf-8");
  } catch {
    // Logging must never break the user-facing answer path.
  }
}

export function readRefusalLog(limit = 200): RefusalLogEntry[] {
  try {
    const raw = fs.readFileSync(LOG_FILE, "utf-8");
    return raw
      .split("\n")
      .filter(Boolean)
      .slice(-limit)
      .map((line) => JSON.parse(line) as RefusalLogEntry);
  } catch {
    return [];
  }
}

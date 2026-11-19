import fs from "node:fs";
import path from "node:path";
import type { KbDocument } from "@/lib/kb/types";

// Server-only: loads every *.json file in data/kb/ at module init. Kept as a
// plain directory scan (rather than a hand-maintained index) so adding a new
// approved-source document is just "drop a JSON file here" — see the
// ingestion note in README "Knowledge base and the retrieval assistant".
const KB_DIR = path.join(process.cwd(), "data", "kb");

let cached: KbDocument[] | null = null;

export function loadKbDocuments(): KbDocument[] {
  if (cached) return cached;
  const files = fs.readdirSync(KB_DIR).filter((f) => f.endsWith(".json"));
  cached = files.map((file) => {
    const raw = fs.readFileSync(path.join(KB_DIR, file), "utf-8");
    return JSON.parse(raw) as KbDocument;
  });
  return cached;
}

export function getKbDocument(id: string): KbDocument | undefined {
  return loadKbDocuments().find((d) => d.id === id);
}

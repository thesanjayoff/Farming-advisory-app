import { NextRequest, NextResponse } from "next/server";
import { loadKbDocuments } from "@/lib/kb/documents";
import { retrieveRelevantDocs } from "@/lib/kb/retrieve";

// This endpoint does NOT analyse any photo — this app has no image
// classification model. It matches the farmer's own symptom checklist
// against the knowledge base's identification write-ups, same as any other
// KB question. See app/photo-help/page.tsx and principle 6 (photo help):
// never a single confident diagnosis, always recommend expert confirmation.
export async function POST(req: NextRequest) {
  const { cropId, symptoms, lang } = (await req.json()) as {
    cropId?: string;
    symptoms?: string[];
    lang?: "ta" | "en";
  };

  const query = [cropId, ...(symptoms ?? [])].filter(Boolean).join(" ");
  if (!query) {
    return NextResponse.json({ matches: [] });
  }

  const docs = loadKbDocuments().filter((d) => !d.containsDoseInfo);
  const scored = retrieveRelevantDocs(query, docs, lang ?? "en", 3);

  const matches = scored.map(({ doc, score }, i) => ({
    titleEn: doc.titleEn,
    titleTa: doc.titleTa,
    bodyEn: doc.bodyEn,
    bodyTa: doc.bodyTa,
    source: doc.source,
    sourceUrl: doc.sourceUrl,
    expertVerified: doc.expertVerified,
    confidenceBand: i === 0 && score >= 4 ? "medium" : "low",
  }));

  return NextResponse.json({ matches });
}

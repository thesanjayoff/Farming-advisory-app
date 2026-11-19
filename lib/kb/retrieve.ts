import type { KbDocument } from "@/lib/kb/types";
import type { LanguageCode } from "@/lib/types";

export interface ScoredDoc {
  doc: KbDocument;
  score: number;
}

/** Minimum score for a document to be considered "relevant enough" to answer
 * from. Below this, the assistant must refuse rather than stretch a weak
 * match into an answer (principle 3 / "refuse outside the knowledge base").
 * Calibrated against the 110-item eval set (data/eval/assistant_test_set.json):
 * a sweep from 1 to 12 showed accuracy on the retrieval-dependent categories
 * (crop identification / prices / schemes / out-of-scope) rising from 35/55
 * at threshold 1 to 49/55 at 7-8, then falling again past 10 as real matches
 * start getting excluded too — see README "Evaluation and limitations" for
 * why this is still imperfect with keyword-overlap-only scoring. */
export const RELEVANCE_THRESHOLD = 7;

const STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "of", "in", "on", "for", "to", "and", "my", "i",
  "can", "do", "does", "it", "this", "that", "what", "when", "how",
  "ஒரு", "இது", "அது", "நான்", "என", "என்ன", "எப்போது", "எப்படி",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    // \p{M} (combining marks) MUST be kept alongside \p{L}\p{N}: Tamil (and
    // Hindi/Telugu) vowel signs and the virama are Unicode category Mark,
    // not Letter — stripping them corrupts words like "தலைநகரம்" into
    // meaningless fragments like "தல", producing near-random cross-document
    // overlap and defeating the whole relevance threshold. Found via the
    // 110-item eval set: see README "Evaluation and limitations".
    .replace(/[^\p{L}\p{N}\p{M}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

function docText(doc: KbDocument, lang: LanguageCode): string {
  const body = lang === "ta" ? doc.bodyTa : doc.bodyEn;
  const title = lang === "ta" ? doc.titleTa : doc.titleEn;
  // Topics and both-language title/body are included regardless of lang so a
  // Tamil-English code-mixed query (common per the voice-assistant spec)
  // still matches English topic tags or vice versa.
  return [title, body, doc.titleEn, doc.bodyEn, doc.titleTa, doc.bodyTa, doc.topics.join(" ")].join(
    " "
  );
}

/**
 * Deterministic keyword-overlap retrieval (no embeddings / vector DB, so it
 * works fully offline from a cached KB and needs no extra provider). Scoring
 * is simple term-frequency overlap with a bonus for exact topic-tag matches,
 * which is enough for a knowledge base of this size and keeps the model
 * strictly retrieval-grounded rather than guessing from parametric memory.
 */
export function retrieveRelevantDocs(
  query: string,
  docs: KbDocument[],
  lang: LanguageCode,
  topK = 3
): ScoredDoc[] {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];
  const queryTokenSet = new Set(queryTokens);

  const scored = docs.map((doc) => {
    const tokens = tokenize(docText(doc, lang));
    const tokenCounts = new Map<string, number>();
    for (const t of tokens) tokenCounts.set(t, (tokenCounts.get(t) ?? 0) + 1);

    let score = 0;
    for (const qt of queryTokens) {
      score += tokenCounts.get(qt) ?? 0;
    }
    // Topic-tag exact match bonus: a direct hit on a tag like "stem_borer"
    // is a much stronger signal than an incidental word overlap in prose.
    for (const topic of doc.topics) {
      if (queryTokenSet.has(topic.toLowerCase())) score += 3;
    }
    return { doc, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

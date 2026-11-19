import type { CropId } from "@/lib/types";

export interface KbDoseExcerpt {
  textEn: string;
  textTa: string;
  page: string;
}

export interface KbDocument {
  id: string;
  titleEn: string;
  titleTa: string;
  cropIds?: CropId[];
  /** Free-text topic tags used by the retrieval scorer, e.g. "stem_borer", "irrigation". */
  topics: string[];
  source: string;
  sourceUrl: string;
  licence: string;
  /** Date the source document/edition is dated, or the date we last checked it. */
  versionDate: string;
  bodyEn: string;
  bodyTa: string;
  /** True if this document is about a pesticide/herbicide/fertilizer dose,
   * mixing ratio or branded product. If true, the assistant must show
   * `doseExcerpt` verbatim and MUST NOT let the LLM paraphrase a number —
   * see lib/kb/dosageGuard.ts and lib/kb/assistantEngine.ts. */
  containsDoseInfo: boolean;
  doseExcerpt?: KbDoseExcerpt;
  /** False for every document shipped in this repo's seed knowledge base —
   * see README "Evaluation and limitations". A real deployment must have an
   * agriculture-domain expert review and flip this before the document is
   * trusted for dose-related answers. */
  expertVerified: boolean;
}

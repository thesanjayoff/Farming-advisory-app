import { describe, expect, it } from "vitest";
import { answerQuestion } from "@/lib/kb/assistantEngine";
import type { KbDocument } from "@/lib/kb/types";
import type { LlmProvider } from "@/lib/llm/types";
import type { WeatherAlert } from "@/lib/rules/alerts";

const identificationDoc: KbDocument = {
  id: "paddy_stem_borer",
  titleEn: "Identifying stem borer damage in paddy",
  titleTa: "நெல்லில் தண்டு துளைப்பான்",
  cropIds: ["paddy"],
  topics: ["pest", "stem_borer", "paddy"],
  source: "Test Source Guide",
  sourceUrl: "https://example.test/",
  licence: "Test",
  versionDate: "2026-11-19",
  bodyEn: "Stem borer damage shows as a dead heart or white ear head.",
  bodyTa: "தண்டு துளைப்பான் பாதிப்பு இறந்த இதயம் அல்லது வெள்ளை கூளையாக தெரியும்.",
  containsDoseInfo: false,
  expertVerified: false,
};

const doseDoc: KbDocument = {
  id: "dose_placeholder",
  titleEn: "Placeholder dose doc",
  titleTa: "மாதிரி அளவு ஆவணம்",
  cropIds: ["tomato"],
  topics: ["dose_placeholder", "fertilizer"],
  source: "Placeholder Source",
  sourceUrl: "https://example.test/",
  licence: "Test",
  versionDate: "2026-11-19",
  bodyEn: "Placeholder body.",
  bodyTa: "மாதிரி உரை.",
  containsDoseInfo: true,
  doseExcerpt: {
    textEn: "Quoted placeholder excerpt text.",
    textTa: "மேற்கோள் மாதிரி உரை.",
    page: "p.1",
  },
  expertVerified: false,
};

const docs = [identificationDoc, doseDoc];

const unconfiguredLlm: LlmProvider = {
  configured: false,
  complete: async () => {
    throw new Error("should not be called");
  },
};

const fakeConfiguredLlm: LlmProvider = {
  configured: true,
  complete: async () => "LLM explanation grounded in the provided document.",
};

describe("answerQuestion — dosage refusal", () => {
  it("never calls the LLM for a dose-sensitive question, even if configured", async () => {
    let called = false;
    const llm: LlmProvider = {
      configured: true,
      complete: async () => {
        called = true;
        return "should not happen";
      },
    };
    const answer = await answerQuestion(
      "What dose of pesticide should I use for stem borer?",
      docs,
      { lang: "en" },
      llm
    );
    expect(called).toBe(false);
    expect(answer.kind).toBe("dose_refusal");
    expect(answer.usedLlm).toBe(false);
  });

  it("quotes the approved source excerpt verbatim when one exists", async () => {
    const answer = await answerQuestion(
      "What is the fertilizer dose for tomato?",
      docs,
      { lang: "en" },
      unconfiguredLlm
    );
    expect(answer.kind).toBe("dose_refusal");
    expect(answer.textEn).toContain("Quoted placeholder excerpt text.");
    expect(answer.confirmWithOfficer).toBe(true);
  });

  it("refuses with the KCC number when no approved source covers the dose question", async () => {
    const answer = await answerQuestion(
      "What mixing ratio should I use for a chemical nobody has written about?",
      [identificationDoc], // no dose doc available
      { lang: "en" },
      unconfiguredLlm
    );
    expect(answer.kind).toBe("dose_refusal");
    expect(answer.kccNumber).toBe("1800-180-1551");
  });
});

describe("answerQuestion — out-of-scope refusal", () => {
  it("refuses when no knowledge-base document is relevant", async () => {
    const answer = await answerQuestion(
      "What is the capital of France?",
      docs,
      { lang: "en" },
      unconfiguredLlm
    );
    expect(answer.kind).toBe("out_of_scope_refusal");
    expect(answer.kccNumber).toBe("1800-180-1551");
  });
});

describe("answerQuestion — knowledge-base grounded answers", () => {
  it("answers from the raw source text when no LLM is configured", async () => {
    const answer = await answerQuestion(
      "How do I identify stem borer damage?",
      docs,
      { lang: "en" },
      unconfiguredLlm
    );
    expect(answer.kind).toBe("kb_grounded");
    expect(answer.usedLlm).toBe(false);
    expect(answer.textEn).toContain("dead heart");
    expect(answer.citations[0].source).toBe("Test Source Guide");
  });

  it("uses the LLM to explain, grounded in retrieved documents, when configured", async () => {
    const answer = await answerQuestion(
      "How do I identify stem borer damage?",
      docs,
      { lang: "en" },
      fakeConfiguredLlm
    );
    expect(answer.kind).toBe("kb_grounded");
    expect(answer.usedLlm).toBe(true);
    expect(answer.textEn).toContain("LLM explanation");
  });
});

describe("answerQuestion — rules-grounded weather answers", () => {
  it("answers a spray-timing question from weather alerts, not the LLM", async () => {
    let called = false;
    const llm: LlmProvider = {
      configured: true,
      complete: async () => {
        called = true;
        return "LLM guess";
      },
    };
    const alerts: WeatherAlert[] = [
      {
        id: "spray-rain:2026-11-20",
        dateIso: "2026-11-20",
        severity: "warning",
        messageKey: "alert_no_spray_rain",
        category: "spray",
        explanation: "Forecast: 12mm rain, 80% chance on 2026-11-20.",
        source: "rules-engine",
      },
    ];
    const answer = await answerQuestion("Can I spray tomorrow?", docs, { lang: "en", weatherAlerts: alerts }, llm);
    expect(called).toBe(false);
    expect(answer.kind).toBe("rules_grounded");
    expect(answer.textEn).toContain("12mm rain");
  });

  it("falls back to the KB path when there are no weather alerts available", async () => {
    const answer = await answerQuestion(
      "Can I spray tomorrow?",
      docs,
      { lang: "en" }, // no weatherAlerts
      unconfiguredLlm
    );
    expect(answer.kind).not.toBe("rules_grounded");
  });
});

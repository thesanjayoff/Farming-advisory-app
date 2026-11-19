import { describe, expect, it } from "vitest";
import { isDoseSensitiveQuestion } from "@/lib/kb/dosageGuard";

describe("isDoseSensitiveQuestion", () => {
  it("flags English dose questions", () => {
    expect(isDoseSensitiveQuestion("What dose of urea should I use?")).toBe(true);
    expect(isDoseSensitiveQuestion("How much pesticide per acre for tomato?")).toBe(true);
    expect(isDoseSensitiveQuestion("What is the mixing ratio for this fungicide?")).toBe(true);
    expect(isDoseSensitiveQuestion("Which brand of pesticide is best?")).toBe(true);
  });

  it("flags Tamil dose questions", () => {
    expect(isDoseSensitiveQuestion("மருந்து அளவு எவ்வளவு?")).toBe(true);
    expect(isDoseSensitiveQuestion("உரம் அளவு எவ்வளவு போடவேண்டும்?")).toBe(true);
    expect(isDoseSensitiveQuestion("எந்த மருந்து நல்லது?")).toBe(true);
  });

  it("does not flag ordinary identification or weather questions", () => {
    expect(isDoseSensitiveQuestion("What does stem borer damage look like?")).toBe(false);
    expect(isDoseSensitiveQuestion("Will it rain tomorrow?")).toBe(false);
    expect(isDoseSensitiveQuestion("நாளை மழை வருமா?")).toBe(false);
    expect(isDoseSensitiveQuestion("நெல்லில் பூச்சி பாதிப்பு எப்படி தெரியும்?")).toBe(false);
  });
});

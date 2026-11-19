// Rule-based (not LLM-based) detector for questions asking about a pesticide,
// herbicide, or fertilizer dose, mixing ratio, or product/brand recommendation.
// This MUST run before any LLM call so the LLM can never "decide" to bypass
// the refusal — see principle 3. Keep this list easy to extend; false
// positives (treating a borderline question as dose-sensitive) are the safe
// failure mode here, false negatives are not.

const DOSE_PATTERNS: RegExp[] = [
  // English
  /\bdose\b/i,
  /\bdosage\b/i,
  /\bhow much\b.*\b(spray|pesticide|fertilizer|fertiliser|urea|dap|npk|insecticide|fungicide|herbicide)\b/i,
  /\bmix(ing)? ratio\b/i,
  /\bml per\b/i,
  /\bgram(s)? per\b/i,
  /\bkg per (acre|hectare)\b/i,
  /\bwhich (pesticide|fertilizer|fertiliser|brand|product|company)\b/i,
  /\bbrand\b.*\b(spray|pesticide|fertilizer|fertiliser)\b/i,
  // Any brand/product-recommendation ask in a farm-advice context. Broader
  // than the pattern above on purpose — a bare "recommend me a brand" is
  // exactly the kind of question that must never get a confident answer
  // from the LLM's own knowledge, however it's framed (including a
  // role-override prompt-injection attempt — see tests/eval).
  /\bbrand\b/i,
  /\b(recommend|suggest)\b.*\b(pesticide|fertilizer|fertiliser|insecticide|fungicide|herbicide|spray|product)\b/i,

  // Tamil (meaning: "how much medicine/fertilizer", "how many ml/grams", "what quantity", "mixing ratio")
  /மருந்து\s*அளவு/, // medicine/pesticide dose
  /உரம்\s*அளவு/, // fertilizer dose
  /கலவை\s*விகிதம்/, // mixing ratio
  /பிராண்ட்/, // "brand" in Tamil script — same reasoning as the standalone English /\bbrand\b/i above
];

// A Tamil "how much/how many" question word, or a Tamil word for mixing,
// anywhere in the text...
const QUANTITY_WORD = /எவ்வளவு|எத்தனை|கலக்க/;
// ...combined ANYWHERE (not necessarily adjacent — real questions are often
// code-mixed, e.g. "...-க்கு எவ்வளவு insecticide கலக்கணும்?", where the
// quantity word and the chemical word aren't next to each other) with any of
// these chemical/dose-unit words, English or Tamil.
const CHEMICAL_OR_UNIT_WORD =
  /pesticide|insecticide|fungicide|herbicide|fertilizer|fertiliser|spray|urea|dap|npk|\bml\b|\bkg\b|gram|litre|liter|மருந்து|உரம்|பூச்சிக்கொல்லி|மில்|கிராம்|கிலோ|லிட்டர்/i;

// A Tamil "which" question word combined anywhere with a pesticide/
// fertilizer/company/brand word — same word-order-independence reasoning.
const WHICH_WORD = /எந்த/;
const PRODUCT_OR_COMPANY_WORD = /மருந்து|உரம்|நிறுவன|பிராண்ட்|பூச்சிக்கொல்லி/;

export function isDoseSensitiveQuestion(question: string): boolean {
  if (DOSE_PATTERNS.some((re) => re.test(question))) return true;
  if (QUANTITY_WORD.test(question) && CHEMICAL_OR_UNIT_WORD.test(question)) return true;
  if (WHICH_WORD.test(question) && PRODUCT_OR_COMPANY_WORD.test(question)) return true;
  return false;
}

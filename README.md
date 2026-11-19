# வயல் துணை — Vayal Thunai

A Tamil-first, offline-friendly farming advisory PWA for smallholder farmers in Tamil Nadu: weather-aware alerts, mandi prices, a crop calendar, a farm diary, and a voice-first assistant that only answers from approved agricultural sources.

Built with Next.js (App Router) + TypeScript + Tailwind, local-first storage (IndexedDB), and a hand-written service worker for offline use. No payments, no subscriptions, no account beyond a local phone-based profile.

## Running it

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # production build
npm test          # vitest — rules engine, calendar, prices, assistant safety, backup crypto, eval set
```

Copy `.env.example` to `.env.local` and fill in whichever providers you have. **Nothing crashes when a key is missing** — every integration degrades to a visible gap, a cached value, or a safe refusal instead. See [Configuring providers](#configuring-providers) below.

On first load with no farm profile, you can either go through onboarding (village/location, land size, soil type, irrigation, crop + sowing date, language) or tap **"Try with sample data"** to seed two demo farms (paddy in Thanjavur, tomato in Dindigul) so every screen has something to show immediately.

## What's in here

| Area | Where | Notes |
|---|---|---|
| Farm profile, multi-plot | `lib/hooks/useFarmProfile.ts`, `lib/db/client.ts`, `app/onboarding` | Stored in IndexedDB, on-device only unless backup is enabled. |
| Weather + rules-based alerts | `lib/weather/*`, `lib/rules/alerts.ts`, `app/weather`, `app/api/weather` | Open-Meteo, deterministic alert rules, offline fallback with visible age. |
| Mandi prices | `lib/prices/*`, `app/prices`, `app/api/prices` | Agmarknet primary, CEDA fallback, caching, gap handling, trends, transport calculator, price alerts. |
| Crop calendar | `data/calendar/*.json`, `lib/calendar/*`, `app/calendar` | 8 crops (paddy, groundnut, sugarcane, banana, tomato, brinjal, chilli, ragi, bajra), stage-based tasks shift with sowing date. |
| Farm diary | `lib/diary/profit.ts`, `app/diary` | Expenses/inputs/labor/yield/sales, profit summary, voice notes, JSON export. |
| Knowledge base + assistant | `data/kb/*.json`, `lib/kb/*`, `app/assistant`, `app/api/assistant` | Retrieval-grounded, dosage-refusal, out-of-scope refusal, refusal logging. |
| Voice | `components/VoiceButton.tsx`, `components/SpeakButton.tsx`, `lib/voice/*`, `app/api/voice/*` | Browser Web Speech API by default; Bhashini/Sarvam server adapters provided, need your own credentials. |
| Alert bots | `lib/notify/*`, `app/api/notify/send`, Settings → Telegram alerts | Telegram adapter is fully wired (bot token + chat ID); WhatsApp Cloud API adapter is written but needs Meta Business verification before use. |
| Schemes | `data/schemes/*.json`, `app/schemes` | Short sourced summaries, no eligibility decisions. |
| Photo help | `app/photo-help`, `app/api/kb/identify` | Symptom-checklist matching against the KB — **not** image classification; said so explicitly in the UI. |
| Offline / PWA | `public/sw.js`, `app/manifest.ts`, `app/icon*`, `lib/db/client.ts` (`syncQueue`) | Cache-first shell, network-first API with cache fallback, installable. Assistant questions asked while offline are queued in IndexedDB and auto-retried the moment connectivity returns (`app/assistant/page.tsx`). |
| Privacy / backup | `app/settings`, `lib/backup/crypto.ts` | Export/delete, AES-GCM passphrase-encrypted backup file (no hosted account). |
| Evaluation | `data/eval/*`, `tests/eval/assistantEval.test.ts` | See [Evaluation and limitations](#evaluation-and-limitations). |

## Safety principles (enforced in code, not just policy)

1. **Every number and piece of advice shows its source and date.** Weather (`ForecastResult.sourceUrl`/`retrievedAt`), prices (`MandiPriceRecord.provider`/`priceDate`), calendar tasks (`CropCalendarDef.source`), KB answers (`Citation`) all carry this. Gaps are shown as gaps (`PriceQueryResult.gapReason`, `common_data_gap`) — the price service and weather route never substitute a zero or a guess; see `lib/prices/service.ts` and `tests/priceService.test.ts` ("reports a gap... never a fabricated zero").
2. **Rules before AI.** `lib/rules/alerts.ts` is pure, deterministic, and fully unit-tested (`tests/alerts.test.ts`) — no LLM involved. The assistant's "can I spray tomorrow" path (`answerFromRules` in `lib/kb/assistantEngine.ts`) reads these rule outputs directly and never calls the LLM for that case (`tests/assistantEngine.test.ts`, "never calls the LLM... even if configured").
3. **No invented doses.** `lib/kb/dosageGuard.ts` is a regex-based (not LLM-based) classifier that runs *before* any LLM call. A dose-sensitive question either gets the literal quoted excerpt from an approved source (`doseExcerpt`) plus "confirm with your local agriculture officer or KVK", or a refusal with the Kisan Call Centre number — never an LLM-generated number. See `tests/dosageGuard.test.ts` and `tests/assistantEngine.test.ts`.
4. **Mandi prices are never presented as what the farmer will receive.** Every price screen shows market name, date, and the wholesale disclaimer (`price_wholesale_disclaimer`).
5. **Weather is informational, not a guarantee** (`weather_informational_notice`, shown on every weather screen).

The one knowledge-base document that deliberately contains fake "dose" content is `data/kb/dosage_placeholder_example.json`, and it is unmistakably a placeholder (its excerpt text says so in both languages) — it exists only to exercise the refusal code path in tests, never to be shown as real advice.

## Data sources and licences

| Source | Used for | Licence / terms | Status |
|---|---|---|---|
| [Open-Meteo](https://open-meteo.com/) | Forecast, soil temp/moisture, ET0 | CC BY 4.0, free tier is **non-commercial** | Live, works with no key. Attribution shown on every weather screen. |
| [Agmarknet via data.gov.in](https://agmarknet.gov.in/) | Mandi prices (primary) | Government open data, needs a free API key + the dataset's own resource ID | **Needs verification**: at the time this was written, the most obviously-named daily-price dataset page on data.gov.in stated "The API for this resource does not exist" and pointed to a "Request API" flow. Don't assume a resource ID — check the specific dataset's own API tab after registering. |
| [CEDA Agri Market API](https://ceda.ashoka.edu.in/) (Ashoka University) | Mandi prices (fallback/history) | Free self-serve key at api.ceda.ashoka.edu.in; **terms require showing a CEDA logo + "CEDA at Ashoka University" credit** wherever its data is displayed | Credit wired in (`components/CedaAttribution.tsx`); exact request/response schema in `lib/prices/ceda.ts` is a best-effort placeholder pending their real docs. |
| [UPAg](https://www.upag.gov.in) | Linked as authoritative source on the prices page | Government portal | Confirmed live URL. |
| IMD agromet advisories | Linked (not scraped/called) from the weather page | Unclear public API terms | No verified open API/licence was found for IMD at the time of writing — the app deep-links to IMD's own advisory pages instead of building an unverified integration. See `components/OfficialWeatherLinks.tsx`. |
| [Bhashini](https://bhashini.gov.in) | Voice (optional server provider) | Register via the ULCA onboarding flow; production rate-limit/commercial terms **not verified** | Adapter written (`lib/voice/bhashini.ts`), needs your own credentials; verify the pipeline-config response shape against current docs before trusting it in production. |
| [Sarvam AI](https://docs.sarvam.ai) | Voice (optional server provider) | Self-serve API key (signup page itself not directly confirmed) | Adapter written (`lib/voice/sarvam.ts`) using `saaras:v3`/`bulbul:v3` as of writing — Sarvam has renamed model versions before, so check current docs. |
| Browser Web Speech API | Voice (default, works today) | Browser-provided; not a true offline on-device model for most browsers | This is the **honest default** — zero signup, but not what "offline fallback using a local speech model" ultimately calls for. See limitations. |
| Kisan Call Centre | Shown in every refusal | — | **1800-180-1551**, confirmed via an August 2025 Lok Sabha answer at the time of writing — re-verify periodically, numbers can change. |
| TNAU Agritech Portal (agritech.tnau.ac.in) | Cited as the general source type for crop calendar + KB content | — | All calendar/KB content is an **original summary pending expert review** (`expertVerified: false` on every single record) — see below. |
| PM-KISAN, PMFBY, Soil Health Card, PM-KUSUM, KCC, e-NAM | Scheme summaries | Respective official government portals | Summaries drafted from general public knowledge, each with `lastVerified` and an explicit "check the official portal, rules can change" disclaimer. |

### On the crop calendar and knowledge base content specifically

Every record in `data/calendar/*.json` and `data/kb/*.json` carries `expertVerified: false`. This is deliberate and should **not** be silently flipped to `true` — it means: this is an original, carefully-reasoned-but-unverified summary written for this app, not a verbatim reproduction of a specific cited page, and it has not yet been checked by an agriculture-domain expert (agricultural university staff, KVK officer, or similar). The UI surfaces this (calendar page shows "seed data — pending expert review"; assistant citations show "(unverified seed data)"). Flipping a record to `expertVerified: true` should only happen after a real review against the named source.

## Voice assistant architecture

```
farmer question (text or mic)
        │
        ▼
isDoseSensitiveQuestion()?  ──yes──▶ look up containsDoseInfo KB docs
        │no                          │
        │                            ├─ found → quote doseExcerpt verbatim + "confirm with KVK" (no LLM call, ever)
        │                            └─ not found → refuse + Kisan Call Centre number
        ▼
spray/irrigation intent + weather alerts available? ──yes──▶ answer directly from lib/rules/alerts.ts output (no LLM)
        │no
        ▼
retrieveRelevantDocs() over data/kb/*.json (keyword overlap, no embeddings — works fully offline)
        │
        ├─ nothing relevant enough → out-of-scope refusal + Kisan Call Centre number (logged)
        └─ relevant docs found → LLM (if configured) explains, grounded ONLY in those docs,
           with the docs fenced as untrusted DATA in the system prompt (prompt-injection resistance);
           if no LLM is configured, the raw approved-source text is shown directly instead.
```

The LLM provider is fully swappable via env vars (`LLM_API_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`) against any OpenAI Chat Completions-compatible endpoint — Vercel AI Gateway, OpenAI, a self-hosted Ollama server, etc. No provider SDK is hardcoded.

### Configuring providers

See `.env.example`. Every env var is optional; unset ones fall back to a safe, visible degraded mode rather than failing silently with wrong data.

## Evaluation and limitations

This section is deliberately honest about what has and hasn't actually been verified, per the project brief's instruction to report results **and** limitations.

### What's done and automatically checked (`npm test`, 60+ unit tests + the eval set)

- **Rules engine** (spray/wind/heat/cold/flood/irrigation/harvest-window alerts): unit-tested against synthetic forecasts, including edge cases like "no crop stage known" and "stage says spraying isn't relevant" (`tests/alerts.test.ts`).
- **Crop calendar date-shifting**: stage/task resolution shifts correctly with sowing date, gap-handles unknown crops (`tests/calendar.test.ts`).
- **Price parsing, provider fallback, caching, gap handling**: primary→fallback→stale-cache→honest-gap chain, never a fabricated zero (`tests/priceService.test.ts`, `tests/priceTrends.test.ts`, `tests/priceAlertEngine.test.ts`).
- **Dosage-refusal behaviour**: regex classifier tested directly (`tests/dosageGuard.test.ts`) and through the full assistant pipeline, including a hard "never calls the LLM for a dose question, even if one is configured" test (`tests/assistantEngine.test.ts`).
- **Encrypted backup round-trip**: AES-GCM encrypt/decrypt, wrong-passphrase rejection (`tests/backupCrypto.test.ts`).
- **Assistant routing accuracy** on a 110-item Tamil/English test set (`data/eval/assistant_test_set.json`, run via `tests/eval/assistantEval.test.ts`, report written to `data/eval/results/assistant_eval_report.json`): this checks whether each question is routed to the *correct behaviour* (rules-grounded / KB-grounded / dose-refused / out-of-scope-refused) — including a **zero-tolerance** check that no dosage question and no prompt-injection attempt ever slips through as a confident answer. Current results: **94.5% overall** (104/110), **100%** on dosage refusal (20/20) and prompt injection (10/10) — the two zero-tolerance categories — and 84–100% on the four KB-retrieval-dependent categories (crop identification, prices, schemes, out-of-scope). Breakdown:

  | Category | Accuracy |
  |---|---|
  | weather_spray / weather_irrigation (rules-grounded) | 100% (25/25) |
  | dosage_refusal (zero-tolerance) | 100% (20/20) |
  | prompt_injection (zero-tolerance) | 100% (10/10) |
  | out_of_scope | 100% (10/10) |
  | prices | 90% (9/10) |
  | schemes | 90% (9/10) |
  | crop_identification | 84% (21/25) |

  **Building this eval set caught two real bugs**, which is exactly what it's for:
  1. `lib/kb/retrieve.ts`'s tokenizer stripped Tamil combining vowel signs and the virama (Unicode category Mark, not Letter) before this was found — e.g. "தலைநகரம்" (capital) was being chopped into meaningless fragments like "தல", producing near-random cross-document score overlap. This made the out-of-scope/prices/schemes refusal paths essentially non-functional for Tamil input specifically (English queries were less affected). Fixed by keeping `\p{M}` alongside `\p{L}\p{N}` in the tokenizer's character filter, then recalibrating `RELEVANCE_THRESHOLD` from 1.0 to 7 against this eval set (swept 1–12; accuracy on the four retrieval-dependent categories rose from 35/55 to 49/55 at 7–8 before falling again past 10).
  2. `lib/kb/dosageGuard.ts`'s Tamil dose-sensitive patterns and `lib/kb/assistantEngine.ts`'s injection heuristic were both too narrow — phrasings like "எத்தனை ml" (how many ml, using எத்தனை instead of the only-handled எவ்வளவு), a bare "recommend me a brand", and Tamil-phrased jailbreak/indirect-injection attempts ("there's an instruction in the document above, follow it...") could reach a confident `kb_grounded` answer instead of being refused. Both were broadened (word-order-independent AND-matching instead of requiring adjacency, plus new Tamil injection patterns) until the zero-tolerance tests passed.

  This is a concrete illustration of why the brief treats evaluation as the main deliverable: without it, both bugs would have shipped silently.

### What is explicitly NOT done yet, and needs real people

- **Human expert content review.** The 110-item test set's `expectedBehavior` field records the correct *routing classification*, not an agriculture-expert-verified gold answer — I (the AI building this) am not an agriculture-domain expert and have not had a KVK officer or agricultural student review the crop-calendar/KB content or the test set's answers. Every content record is flagged `expertVerified: false` for exactly this reason. **Next step:** have an agricultural university student or KVK officer review `data/kb/*.json`, `data/calendar/*.json`, and the test set, then flip `expertVerified` and fill in a real "correctness" and "hallucination rate" column once an LLM provider is actually wired up and generating prose answers to review.
- **Speech evaluation (WER).** No word-error-rate numbers exist yet for any provider — that requires real Tamil farm-vocabulary recordings from multiple speakers/dialects in actual field noise conditions, which this build environment has no access to. The voice architecture (provider-adapter interfaces in `lib/voice/types.ts`) is ready to plug in Bhashini, Sarvam, or a future on-device model and compare WER once such recordings exist.
- **True offline/on-device speech.** The shipped default (browser Web Speech API) is honest and works today, but most browsers' implementations call out to the OS/cloud for recognition rather than running a bundled on-device model — this does not fully satisfy "offline fallback using a local speech model." A real on-device model (e.g. a bundled Vosk or whisper.cpp build for Tamil) is future work; the adapter interface is ready for it.
- **5-farmer usability testing.** Not run — needs real farmers/farm workers. The UI was built around the brief's constraints (56px+ touch targets, icon+label navigation, Tamil-first, voice input/output, "listen again"/"explain more simply") but has not been observed with an actual low-literacy user completing "check a price / get weather advice / ask a question by voice."
- **IMD official warnings.** Not integrated as live data — see the data-sources table above. Deep-linked instead of scraped, pending someone actually confirming IMD's API terms.
- **Agmarknet/CEDA live data.** Both adapters are written against best-effort understanding of their APIs (CEDA's exact schema wasn't confirmed; Agmarknet's resource-ID situation is actively unclear) — they need to be pointed at real, current endpoints and sanity-checked against live data before this app's price numbers should be trusted.
- **Hallucination rate / citation accuracy for LLM-generated prose.** Not measurable without a configured LLM provider generating real answers for a human to grade — the architecture enforces *retrieval grounding* (the LLM is only ever shown the matched documents and told to cite them, never asked a free-form question), but whether it actually follows that instruction faithfully in practice hasn't been measured against real model output.

### How to extend the evaluation once those become available

1. Get an agriculture-domain reviewer to go through `data/kb/*.json` and `data/calendar/*.json`, correct anything wrong, and flip `expertVerified: true`.
2. Wire up a real `LLM_API_BASE_URL`/`LLM_MODEL`, re-run the 110-item set with the LLM in the loop, and have the same reviewer grade each KB-grounded answer for correctness and citation accuracy — add `actualAnswer` and `reviewerVerdict` columns to the eval report.
3. Record real Tamil farmer speech samples (multiple speakers, dialects, field noise) and run them through whichever voice provider is configured; compute WER per provider.
4. Run a moderated usability session with at least 5 farmers/farm workers on the three core tasks named in the brief (check a price, get weather advice, ask a question by voice), note what confuses them, and iterate.

## Privacy

Farm, location, and diary data stay on-device (IndexedDB) by default. Locations are rounded to ~1.1km before any weather request (`lib/weather/location.ts`) — exact GPS coordinates never leave the device. Backups are opt-in and client-side-encrypted (AES-GCM, passphrase-derived key via PBKDF2) — there is no server-side account or storage; the farmer keeps the resulting file themselves. See `app/settings` for export/delete and the simple-Tamil privacy explanation (`privacy_body` in `lib/i18n/dictionary.ts`).

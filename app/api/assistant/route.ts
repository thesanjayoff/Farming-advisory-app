import { NextRequest, NextResponse } from "next/server";
import { answerQuestion } from "@/lib/kb/assistantEngine";
import { loadKbDocuments } from "@/lib/kb/documents";
import { OpenAiCompatibleProvider } from "@/lib/llm/provider";
import { OpenMeteoProvider } from "@/lib/weather/openMeteo";
import { generateWeatherAlerts } from "@/lib/rules/alerts";
import { getCurrentStage } from "@/lib/calendar/resolve";
import type { LanguageCode, CropId } from "@/lib/types";

interface AssistantRequestBody {
  question: string;
  lang: LanguageCode;
  // Only a rounded point is ever expected here — the client rounds before
  // sending, and the weather provider rounds again regardless (defense in
  // depth for the "never send exact GPS to external services" principle;
  // this is our own server, but the same discipline avoids ever logging an
  // exact farm location by accident).
  point?: { lat: number; lon: number };
  cropId?: CropId;
  sowingDate?: string;
  simplify?: boolean;
}

const llm = new OpenAiCompatibleProvider();
const weatherProvider = new OpenMeteoProvider();

export async function POST(req: NextRequest) {
  const body = (await req.json()) as AssistantRequestBody;

  if (!body.question || typeof body.question !== "string" || body.question.length > 2000) {
    return NextResponse.json({ error: "A `question` string (max 2000 chars) is required" }, { status: 400 });
  }

  let weatherAlerts;
  if (body.point) {
    try {
      const forecast = await weatherProvider.fetchForecast(body.point);
      const stage =
        body.cropId && body.sowingDate ? getCurrentStage(body.cropId, body.sowingDate) : undefined;
      weatherAlerts = generateWeatherAlerts(forecast, stage);
    } catch {
      weatherAlerts = undefined; // weather unavailable — assistant will fall back to the KB path
    }
  }

  const docs = loadKbDocuments();
  const answer = await answerQuestion(
    body.question,
    docs,
    { lang: body.lang ?? "ta", weatherAlerts, simplify: body.simplify },
    llm
  );

  return NextResponse.json(answer);
}

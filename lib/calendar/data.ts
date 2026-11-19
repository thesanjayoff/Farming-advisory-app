import type { CropId } from "@/lib/types";
import type { CropCalendarDef } from "@/lib/calendar/types";

import paddy from "@/data/calendar/paddy.json";
import groundnut from "@/data/calendar/groundnut.json";
import sugarcane from "@/data/calendar/sugarcane.json";
import banana from "@/data/calendar/banana.json";
import tomato from "@/data/calendar/tomato.json";
import brinjal from "@/data/calendar/brinjal.json";
import chilli from "@/data/calendar/chilli.json";
import millet from "@/data/calendar/millet.json";

const allDefs = [
  paddy,
  groundnut,
  sugarcane,
  banana,
  tomato,
  brinjal,
  chilli,
  ...(millet as unknown as CropCalendarDef[]),
] as unknown as CropCalendarDef[];

const byId = new Map<CropId, CropCalendarDef>(allDefs.map((d) => [d.cropId, d]));

export function getCropCalendar(cropId: CropId): CropCalendarDef | undefined {
  return byId.get(cropId);
}

export function listCropCalendars(): CropCalendarDef[] {
  return allDefs;
}

export const cropDisplayNames: Record<CropId, { en: string; ta: string }> = Object.fromEntries(
  allDefs.map((d) => [d.cropId, { en: d.nameEn, ta: d.nameTa }])
) as Record<CropId, { en: string; ta: string }>;

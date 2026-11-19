// Core domain types shared across the app. Kept dependency-free so they can be
// imported from client components, server routes, and tests alike.

export type LanguageCode = "ta" | "en" | "hi" | "te";

export type SoilType =
  | "clay"
  | "clay_loam"
  | "sandy"
  | "sandy_loam"
  | "loam"
  | "red"
  | "black"
  | "laterite"
  | "alluvial"
  | "unknown";

export type IrrigationSource =
  | "canal"
  | "borewell"
  | "open_well"
  | "tank"
  | "rainfed"
  | "drip"
  | "sprinkler"
  | "other";

export type CropId =
  | "paddy"
  | "groundnut"
  | "sugarcane"
  | "banana"
  | "tomato"
  | "brinjal"
  | "chilli"
  | "millet_ragi"
  | "millet_bajra";

export interface GeoPoint {
  lat: number;
  lon: number;
}

export interface SoilHealthValues {
  /** Values as printed on a Soil Health Card. Units kept as strings with the card's own units. */
  ph?: number;
  organicCarbonPercent?: number;
  nitrogenKgPerHa?: number;
  phosphorusKgPerHa?: number;
  potassiumKgPerHa?: number;
  sulphurPpm?: number;
  zincPpm?: number;
  boronPpm?: number;
  ironPpm?: number;
  manganesePpm?: number;
  copperPpm?: number;
  sourceNote: string; // e.g. "Manual entry" or "OCR from photo, unverified"
  recordedAt: string; // ISO date
}

export interface PlotCrop {
  id: string;
  cropId: CropId;
  variety?: string;
  sowingDate: string; // ISO date
  areaAcres?: number;
}

export interface Plot {
  id: string;
  name: string;
  location: GeoPoint;
  locationLabel: string; // village/town name shown to the farmer
  areaAcres: number;
  soilType: SoilType;
  irrigationSource: IrrigationSource;
  crops: PlotCrop[];
  soilHealth?: SoilHealthValues;
}

export interface FarmProfile {
  id: string;
  farmerName: string;
  phone?: string;
  languagePreference: LanguageCode;
  plots: Plot[];
  createdAt: string;
  updatedAt: string;
  backupEnabled: boolean;
}

export interface SourcedValue<T> {
  value: T;
  source: string;
  sourceUrl?: string;
  asOf: string; // ISO date/time the value was reported/retrieved
  retrievedAt: string; // ISO date/time we fetched it
}

/** A value that may be genuinely missing. Never substitute 0 or a guess — use `gap`. */
export type MaybeSourced<T> =
  | { kind: "value"; data: SourcedValue<T> }
  | { kind: "gap"; reason: string };

export interface DiaryEntry {
  id: string;
  plotId: string;
  date: string; // ISO date
  type: "expense" | "input" | "labor" | "yield" | "sale" | "note";
  description: string;
  amountInr?: number;
  quantity?: number;
  unit?: string;
  voiceNoteRef?: string; // IndexedDB blob key
  createdAt: string;
  synced: boolean;
}

export interface PriceAlertRule {
  id: string;
  commodity: string;
  mandiName?: string; // if omitted, matches any tracked nearby mandi
  direction: "above" | "below";
  priceInrPerQuintal: number;
  active: boolean;
  createdAt: string;
}

export interface SyncQueueItem {
  id: string;
  kind: "diary_entry" | "assistant_question" | "price_alert";
  payload: unknown;
  createdAt: string;
  attempts: number;
}

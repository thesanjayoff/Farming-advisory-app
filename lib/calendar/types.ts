import type { CropId } from "@/lib/types";

export interface CropStageDef {
  id: string;
  nameEn: string;
  nameTa: string;
  /** Days after sowing/transplanting that this stage starts (inclusive). */
  startDay: number;
  /** Days after sowing/transplanting that this stage ends (inclusive). */
  endDay: number;
  /** Air temperature above this is heat stress risk for this stage, if known. */
  heatStressMaxC?: number;
  /** Air temperature below this is cold stress risk for this stage, if known. */
  coldStressMinC?: number;
  /** Standing water / waterlogging is especially damaging in this stage. */
  floodSensitive: boolean;
  /** Spraying/fertilizing is not useful or is risky in this stage (e.g. already harvested). */
  sprayRelevant: boolean;
  notes?: string;
}

export interface CropTaskDef {
  id: string;
  stageId: string;
  dayFromSowing: number;
  nameEn: string;
  nameTa: string;
  category: "irrigation" | "nutrient" | "pest" | "weeding" | "harvest" | "general";
  notes?: string;
}

export interface CropCalendarDef {
  cropId: CropId;
  nameEn: string;
  nameTa: string;
  totalDurationDays: number;
  source: string;
  sourceUrl: string;
  /**
   * True once an agriculture-domain reviewer has checked this file's stage
   * durations and tasks against the cited source. Starts false for every
   * crop shipped in this repo — see README "Evaluation and limitations".
   */
  expertVerified: boolean;
  stages: CropStageDef[];
  tasks: CropTaskDef[];
}

export interface ResolvedStage extends CropStageDef {
  dayFromSowing: number;
}

export interface ResolvedTask extends CropTaskDef {
  dueDate: string; // ISO date, sowingDate + dayFromSowing
  done: boolean;
}

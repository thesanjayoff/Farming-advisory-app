"use client";

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type {
  DiaryEntry,
  FarmProfile,
  PriceAlertRule,
  SyncQueueItem,
} from "@/lib/types";

// All farmer data lives on-device by default (see principles: location, farm
// and diary data are personal data). Nothing here is sent anywhere unless
// the farmer explicitly enables backup or the farmer asks the assistant a
// question (which goes through /api/assistant with only the minimum text).

interface VayalDBSchema extends DBSchema {
  farms: {
    key: string;
    value: FarmProfile;
  };
  diary: {
    key: string;
    value: DiaryEntry;
    indexes: { "by-plot": string };
  };
  priceAlerts: {
    key: string;
    value: PriceAlertRule;
  };
  syncQueue: {
    key: string;
    value: SyncQueueItem;
  };
  cache: {
    // Generic cache for weather / price / KB responses, keyed by a cache key
    // the caller constructs (e.g. "weather:13.08,80.27"). Always carries
    // `storedAt` so the UI can show data age instead of a silent zero.
    key: string;
    value: { key: string; storedAt: string; data: unknown };
  };
  blobs: {
    // Voice notes and OCR photos, kept out of the JSON stores.
    key: string;
    value: { id: string; blob: Blob; createdAt: string; mimeType: string };
  };
}

const DB_NAME = "vayal-thunai";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<VayalDBSchema>> | null = null;

export function getDB(): Promise<IDBPDatabase<VayalDBSchema>> {
  if (typeof window === "undefined") {
    throw new Error("getDB() can only be called in the browser");
  }
  if (!dbPromise) {
    dbPromise = openDB<VayalDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("farms")) {
          db.createObjectStore("farms", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("diary")) {
          const store = db.createObjectStore("diary", { keyPath: "id" });
          store.createIndex("by-plot", "plotId");
        }
        if (!db.objectStoreNames.contains("priceAlerts")) {
          db.createObjectStore("priceAlerts", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("syncQueue")) {
          db.createObjectStore("syncQueue", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("cache")) {
          db.createObjectStore("cache", { keyPath: "key" });
        }
        if (!db.objectStoreNames.contains("blobs")) {
          db.createObjectStore("blobs", { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

// ---- Farm profiles ----------------------------------------------------

export async function saveFarm(farm: FarmProfile): Promise<void> {
  const db = await getDB();
  await db.put("farms", farm);
}

export async function getAllFarms(): Promise<FarmProfile[]> {
  const db = await getDB();
  return db.getAll("farms");
}

export async function getFarm(id: string): Promise<FarmProfile | undefined> {
  const db = await getDB();
  return db.get("farms", id);
}

export async function deleteFarm(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("farms", id);
}

// ---- Diary --------------------------------------------------------------

export async function saveDiaryEntry(entry: DiaryEntry): Promise<void> {
  const db = await getDB();
  await db.put("diary", entry);
}

export async function getDiaryForPlot(plotId: string): Promise<DiaryEntry[]> {
  const db = await getDB();
  return db.getAllFromIndex("diary", "by-plot", plotId);
}

export async function getAllDiaryEntries(): Promise<DiaryEntry[]> {
  const db = await getDB();
  return db.getAll("diary");
}

export async function deleteDiaryEntry(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("diary", id);
}

// ---- Price alerts ---------------------------------------------------------

export async function savePriceAlert(rule: PriceAlertRule): Promise<void> {
  const db = await getDB();
  await db.put("priceAlerts", rule);
}

export async function getPriceAlerts(): Promise<PriceAlertRule[]> {
  const db = await getDB();
  return db.getAll("priceAlerts");
}

export async function deletePriceAlert(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("priceAlerts", id);
}

// ---- Sync queue (for offline-first writes) --------------------------------

export async function enqueueSync(item: SyncQueueItem): Promise<void> {
  const db = await getDB();
  await db.put("syncQueue", item);
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const db = await getDB();
  return db.getAll("syncQueue");
}

export async function removeSyncItem(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("syncQueue", id);
}

// ---- Generic cache (weather / prices / KB) --------------------------------

export async function setCache(key: string, data: unknown): Promise<void> {
  const db = await getDB();
  await db.put("cache", { key, data, storedAt: new Date().toISOString() });
}

export async function getCache<T>(
  key: string
): Promise<{ data: T; storedAt: string } | undefined> {
  const db = await getDB();
  const row = await db.get("cache", key);
  if (!row) return undefined;
  return { data: row.data as T, storedAt: row.storedAt };
}

// ---- Blobs (voice notes, OCR photos) --------------------------------------

export async function saveBlob(id: string, blob: Blob): Promise<void> {
  const db = await getDB();
  await db.put("blobs", { id, blob, mimeType: blob.type, createdAt: new Date().toISOString() });
}

export async function getBlob(id: string): Promise<Blob | undefined> {
  const db = await getDB();
  const row = await db.get("blobs", id);
  return row?.blob;
}

export async function deleteAllData(): Promise<void> {
  const db = await getDB();
  await Promise.all(
    ["farms", "diary", "priceAlerts", "syncQueue", "cache", "blobs"].map((store) =>
      db.clear(store as never)
    )
  );
}

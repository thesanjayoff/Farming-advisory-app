"use client";

import { useState } from "react";
import { PageShell } from "@/components/PageShell";
import { useI18n } from "@/lib/i18n/context";
import { useFarmProfile } from "@/lib/hooks/useFarmProfile";
import { getAllDiaryEntries, deleteAllData, saveFarm, saveDiaryEntry } from "@/lib/db/client";
import { supportedLanguages } from "@/lib/i18n/dictionary";
import { encryptBackup, decryptBackup, type EncryptedBackup } from "@/lib/backup/crypto";

const LOW_DATA_KEY = "vayal.lowDataMode";
const TELEGRAM_CHAT_ID_KEY = "vayal.telegramChatId";

export default function SettingsPage() {
  const { t, lang, setLang } = useI18n();
  const { farm, setFarm } = useFarmProfile();
  const [lowData, setLowData] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(LOW_DATA_KEY) === "1";
  });
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [backupPassphrase, setBackupPassphrase] = useState("");
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restorePassphrase, setRestorePassphrase] = useState("");
  const [telegramChatId, setTelegramChatId] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(TELEGRAM_CHAT_ID_KEY) ?? "";
  });

  function saveTelegramChatId(value: string) {
    setTelegramChatId(value);
    window.localStorage.setItem(TELEGRAM_CHAT_ID_KEY, value);
  }

  function toggleLowData() {
    const next = !lowData;
    setLowData(next);
    window.localStorage.setItem(LOW_DATA_KEY, next ? "1" : "0");
  }

  async function toggleBackup() {
    if (!farm) return;
    await setFarm({ ...farm, backupEnabled: !farm.backupEnabled });
  }

  async function exportAll() {
    const entries = await getAllDiaryEntries();
    const payload = { farm, diary: entries, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vayal-thunai-export.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function createEncryptedBackup() {
    if (!backupPassphrase || backupPassphrase.length < 6) {
      setBackupStatus(lang === "ta" ? "குறியீடு குறைந்தது 6 எழுத்துகள் இருக்க வேண்டும்" : "Passphrase must be at least 6 characters");
      return;
    }
    const entries = await getAllDiaryEntries();
    const payload = { farm, diary: entries, exportedAt: new Date().toISOString() };
    const backup = await encryptBackup(payload, backupPassphrase);
    const blob = new Blob([JSON.stringify(backup)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vayal-thunai-backup.vayalbackup.json";
    a.click();
    URL.revokeObjectURL(url);
    setBackupStatus(lang === "ta" ? "✓ குறியாக்கப்பட்ட காப்பு பதிவிறக்கம் ஆனது" : "✓ Encrypted backup downloaded");
  }

  async function restoreEncryptedBackup() {
    if (!restoreFile || !restorePassphrase) return;
    try {
      const text = await restoreFile.text();
      const backup = JSON.parse(text) as EncryptedBackup;
      const restored = await decryptBackup<{ farm: typeof farm; diary: Awaited<ReturnType<typeof getAllDiaryEntries>> }>(
        backup,
        restorePassphrase
      );
      if (restored.farm) await saveFarm(restored.farm);
      for (const entry of restored.diary ?? []) await saveDiaryEntry(entry);
      setBackupStatus(lang === "ta" ? "✓ மீட்டமைக்கப்பட்டது. மீண்டும் திறக்கவும்." : "✓ Restored. Please reopen the app.");
    } catch {
      setBackupStatus(lang === "ta" ? "தவறான குறியீடு அல்லது கோப்பு" : "Wrong passphrase or invalid file");
    }
  }

  async function deleteAll() {
    await deleteAllData();
    window.localStorage.clear();
    // A full reload (not a soft client navigation) is intentional here, to
    // guarantee every in-memory React/hook state referencing the deleted
    // data is thrown away, not just the URL.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/";
  }

  return (
    <PageShell title={t("settings_title")} showBack>
      <div className="flex flex-col gap-4 pb-6">
        <section>
          <h2 className="mb-2 text-sm font-semibold">{t("settings_language")}</h2>
          <div className="flex flex-wrap gap-2">
            {supportedLanguages.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`tap-target rounded-lg border px-4 text-sm ${
                  lang === l.code ? "border-brand bg-brand-light" : "border-neutral-300"
                }`}
              >
                {l.label}
                {!l.complete && " (beta)"}
              </button>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-3">
          <span className="text-sm font-medium">{t("settings_low_data_mode")}</span>
          <button
            onClick={toggleLowData}
            className={`tap-target rounded-full px-4 text-sm ${lowData ? "bg-brand text-white" : "bg-neutral-200"}`}
          >
            {lowData ? "ON" : "OFF"}
          </button>
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">{t("settings_backup")}</span>
            <button
              onClick={toggleBackup}
              className={`tap-target rounded-full px-4 text-sm ${
                farm?.backupEnabled ? "bg-brand text-white" : "bg-neutral-200"
              }`}
            >
              {farm?.backupEnabled ? "ON" : "OFF"}
            </button>
          </div>
          {farm?.backupEnabled && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-neutral-500">
                {lang === "ta"
                  ? "குறியீடு (பாஸ்வேர்டு) வைத்து உங்கள் தரவை குறியாக்கி ஒரு கோப்பாக பதிவிறக்கலாம். இந்த கோப்பை நீங்களே பாதுகாப்பாக வைத்துக்கொள்ள வேண்டும் — அதை நாங்கள் சேமிக்க மாட்டோம்."
                  : "Create a passphrase-encrypted backup file you download and keep yourself (e.g. in your own cloud drive) — we never store this file ourselves."}
              </p>
              <input
                type="password"
                value={backupPassphrase}
                onChange={(e) => setBackupPassphrase(e.target.value)}
                placeholder={lang === "ta" ? "குறியீடு (6+ எழுத்துகள்)" : "Passphrase (6+ characters)"}
                className="tap-target rounded border border-neutral-300 px-2"
              />
              <button onClick={createEncryptedBackup} className="tap-target rounded-lg bg-brand text-sm font-medium text-white">
                {lang === "ta" ? "குறியாக்கப்பட்ட காப்பு உருவாக்கு" : "Create encrypted backup"}
              </button>

              <hr className="border-neutral-200" />

              <input
                type="file"
                accept="application/json"
                onChange={(e) => setRestoreFile(e.target.files?.[0] ?? null)}
                className="text-xs"
              />
              <input
                type="password"
                value={restorePassphrase}
                onChange={(e) => setRestorePassphrase(e.target.value)}
                placeholder={lang === "ta" ? "மீட்பு குறியீடு" : "Restore passphrase"}
                className="tap-target rounded border border-neutral-300 px-2"
              />
              <button
                onClick={restoreEncryptedBackup}
                disabled={!restoreFile || !restorePassphrase}
                className="tap-target rounded-lg border border-brand text-sm font-medium text-brand disabled:opacity-50"
              >
                {lang === "ta" ? "காப்பிலிருந்து மீட்டமை" : "Restore from backup"}
              </button>
              {backupStatus && <p className="text-xs text-neutral-600">{backupStatus}</p>}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-3">
          <h2 className="mb-1 text-sm font-semibold">
            {lang === "ta" ? "டெலிகிராம் எச்சரிக்கைகள் (விருப்பம்)" : "Telegram alerts (optional)"}
          </h2>
          <p className="mb-2 text-xs text-neutral-500">
            {lang === "ta"
              ? "டெலிகிராமில் @VayalThunaiBot (அல்லது உங்கள் சொந்த போட்) க்கு /start அனுப்பி உங்கள் chat ID-ஐ இங்கே உள்ளிடவும்."
              : "Message your Telegram bot /start, then paste the chat ID it gives you here. Needs TELEGRAM_BOT_TOKEN configured on the server."}
          </p>
          <input
            value={telegramChatId}
            onChange={(e) => saveTelegramChatId(e.target.value)}
            placeholder="Telegram chat ID"
            className="tap-target w-full rounded border border-neutral-300 px-2"
          />
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-3">
          <h2 className="mb-1 text-sm font-semibold">{t("privacy_title")}</h2>
          <p className="mb-3 text-sm text-neutral-600">{t("privacy_body")}</p>
          <div className="flex flex-col gap-2">
            <button onClick={exportAll} className="tap-target rounded-lg border border-brand text-sm font-medium text-brand">
              {t("privacy_export")}
            </button>
            {confirmingDelete ? (
              <div className="flex gap-2">
                <button onClick={deleteAll} className="tap-target flex-1 rounded-lg bg-red-600 text-sm font-medium text-white">
                  {t("common_delete")} ✓
                </button>
                <button onClick={() => setConfirmingDelete(false)} className="tap-target flex-1 rounded-lg border border-neutral-300 text-sm">
                  {t("common_cancel")}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmingDelete(true)}
                className="tap-target rounded-lg border border-red-400 text-sm font-medium text-red-600"
              >
                {t("privacy_delete")}
              </button>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-3 text-sm text-neutral-600">
          <h2 className="mb-1 text-sm font-semibold">{t("settings_about")}</h2>
          <p>Weather: Open-Meteo.com (CC BY 4.0)</p>
          <p>Prices: Agmarknet (data.gov.in), CEDA at Ashoka University</p>
          <p>Crop calendar &amp; knowledge base: see README for source citations</p>
          <p>Kisan Call Centre: 1800-180-1551</p>
        </section>
      </div>
    </PageShell>
  );
}

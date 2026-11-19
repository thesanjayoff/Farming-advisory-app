"use client";

import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { useI18n } from "@/lib/i18n/context";
import { useOnlineStatus } from "@/lib/hooks/useOnlineStatus";
import { supportedLanguages } from "@/lib/i18n/dictionary";

export function PageShell({
  title,
  children,
  showBack,
}: {
  title: string;
  children: React.ReactNode;
  showBack?: boolean;
}) {
  const { lang, setLang, t } = useI18n();
  const online = useOnlineStatus();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="no-print sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-neutral-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          {showBack && (
            <Link href="/" className="tap-target flex items-center justify-center text-xl" aria-label={t("common_back")}>
              ←
            </Link>
          )}
          <h1 className="text-lg font-semibold text-brand">{title}</h1>
        </div>
        <select
          aria-label={t("settings_language")}
          value={lang}
          onChange={(e) => setLang(e.target.value as typeof lang)}
          className="tap-target rounded-md border border-neutral-300 bg-white px-2 text-sm"
        >
          {supportedLanguages.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </header>

      {!online && (
        <div className="no-print bg-amber-100 px-4 py-2 text-sm text-amber-900">
          {t("common_offline")}
        </div>
      )}

      <main className="flex-1 px-4 py-4">{children}</main>

      <BottomNav />
    </div>
  );
}

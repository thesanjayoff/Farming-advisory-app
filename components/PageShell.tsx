"use client";

import Link from "next/link";
import { WifiOff, ChevronLeft } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { useI18n } from "@/lib/i18n/context";
import { useOnlineStatus } from "@/lib/hooks/useOnlineStatus";
import { supportedLanguages } from "@/lib/i18n/dictionary";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    <div className="flex min-h-screen flex-col bg-muted/40">
      <header className="no-print sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-border/70 bg-background/95 px-4 py-3 shadow-[0_1px_0_rgba(0,0,0,0.03),0_4px_12px_-8px_rgba(0,0,0,0.06)] backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center gap-1.5">
          {showBack && (
            <Link
              href="/"
              className="tap-target -ml-2 flex items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
              aria-label={t("common_back")}
            >
              <ChevronLeft className="size-6" aria-hidden />
            </Link>
          )}
          <h1 className="text-lg font-semibold tracking-tight text-brand">{title}</h1>
        </div>
        <Select value={lang} onValueChange={(v) => v && setLang(v as typeof lang)}>
          <SelectTrigger
            aria-label={t("settings_language")}
            className="tap-target h-10 w-auto rounded-full border-border/70 bg-muted px-3 text-sm font-medium shadow-none"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {supportedLanguages.map((l) => (
              <SelectItem key={l.code} value={l.code}>
                {l.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </header>

      {!online && (
        <div className="no-print flex items-center gap-2 bg-amber-100 px-4 py-2 text-sm text-amber-900">
          <WifiOff className="size-4 shrink-0" aria-hidden />
          {t("common_offline")}
        </div>
      )}

      <main className="flex-1 px-4 py-4">{children}</main>

      <BottomNav />
    </div>
  );
}

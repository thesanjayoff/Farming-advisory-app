"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import type { DictKey } from "@/lib/i18n/dictionary";

interface NavItem {
  href: string;
  emoji: string;
  labelKey: DictKey;
}

const ITEMS: NavItem[] = [
  { href: "/", emoji: "🏠", labelKey: "nav_home" },
  { href: "/weather", emoji: "⛅", labelKey: "nav_weather" },
  { href: "/prices", emoji: "💰", labelKey: "nav_prices" },
  { href: "/calendar", emoji: "📅", labelKey: "nav_calendar" },
  { href: "/assistant", emoji: "🎤", labelKey: "nav_assistant" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav
      className="no-print sticky bottom-0 z-20 border-t border-border/70 bg-background/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_-8px_rgba(0,0,0,0.08)] backdrop-blur supports-[backdrop-filter]:bg-background/80"
      aria-label="Main navigation"
    >
      <ul className="flex px-1.5 py-2">
        {ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="tap-target mx-0.5 flex flex-col items-center justify-center gap-1 rounded-2xl py-1 text-[11px] font-medium transition-all"
              >
                <span
                  className={`flex size-9 items-center justify-center rounded-xl text-xl transition-all ${
                    active ? "scale-100 bg-brand text-white shadow-[0_4px_10px_-3px_var(--brand)]" : "scale-95 text-muted-foreground"
                  }`}
                  aria-hidden
                >
                  {item.emoji}
                </span>
                <span className={active ? "text-brand" : "text-muted-foreground"}>{t(item.labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

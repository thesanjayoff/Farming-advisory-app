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
      className="no-print sticky bottom-0 z-20 border-t border-neutral-200 bg-white"
      aria-label="Main navigation"
    >
      <ul className="flex">
        {ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`tap-target flex flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium ${
                  active ? "text-brand" : "text-neutral-500"
                }`}
              >
                <span className="text-2xl" aria-hidden>
                  {item.emoji}
                </span>
                <span>{t(item.labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

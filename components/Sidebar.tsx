"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  FileText,
  Package,
} from "@phosphor-icons/react/dist/ssr";
import { useStore } from "@/lib/store";
import type { PhosphorIcon } from "@/lib/productIcons";

interface NavItem {
  href: string;
  label: string;
  icon: PhosphorIcon;
  matchPrefix?: string;
}

const NAV: NavItem[] = [
  { href: "/", label: "Přehled", icon: House },
  { href: "/nabidky", label: "Nabídky", icon: FileText, matchPrefix: "/nabidky" },
  { href: "/katalog", label: "Katalog produktů", icon: Package, matchPrefix: "/katalog" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { comments } = useStore();
  const newCommentsCount = comments.filter((c) => c.isNew).length;

  return (
    <aside className="flex flex-col h-screen sticky top-0 w-64 border-r border-zinc-200/70 bg-white">
      <div className="px-6 pt-8 pb-10">
        <Link href="/" className="block">
          <div
            className="text-[15px] tracking-[0.32em] uppercase font-semibold text-zinc-900"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Farline
          </div>
          <div
            className="text-[10px] tracking-[0.4em] uppercase text-zinc-400 mt-1"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Living · Nabídky
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3">
        {NAV.map(({ href, label, icon: Icon, matchPrefix }) => {
          const isActive = matchPrefix
            ? pathname === href || pathname.startsWith(matchPrefix + "/") || pathname === matchPrefix
            : pathname === href;
          const showBadge = href === "/nabidky" && newCommentsCount > 0;
          return (
            <Link
              key={href}
              href={href}
              className={`group relative flex items-center gap-3 px-4 py-2.5 my-0.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-zinc-50 text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50/70"
              }`}
            >
              {isActive && (
                <span
                  className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full"
                  style={{ background: "var(--accent)" }}
                />
              )}
              <Icon
                size={18}
                weight={isActive ? "duotone" : "regular"}
                color={isActive ? "var(--accent)" : undefined}
              />
              <span className="flex-1">{label}</span>
              {showBadge && (
                <span
                  className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-semibold text-white"
                  style={{ background: "var(--accent)" }}
                >
                  {newCommentsCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-zinc-200/70">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold"
            style={{ background: "var(--accent)" }}
          >
            FK
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-zinc-900 truncate">
              Filip Kott
            </div>
            <div className="text-xs text-zinc-500 truncate">Farline Living</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

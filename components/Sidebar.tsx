"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { House, FileText, Package, Gear, Users } from "@phosphor-icons/react/dist/ssr";
import type { PhosphorIcon } from "@/lib/productIcons";
import { useMobileSidebar } from "./MobileSidebarContext";

interface NavItem {
  href: string;
  label: string;
  icon: PhosphorIcon;
  matchPrefix?: string;
}

interface SidebarUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

const NAV: NavItem[] = [
  { href: "/", label: "Přehled", icon: House },
  { href: "/nabidky", label: "Nabídky", icon: FileText, matchPrefix: "/nabidky" },
  { href: "/katalog", label: "Katalog produktů", icon: Package, matchPrefix: "/katalog" },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/nastaveni/kategorie", label: "Kategorie", icon: Gear, matchPrefix: "/nastaveni/kategorie" },
  { href: "/nastaveni/uzivatele", label: "Uživatelé", icon: Users, matchPrefix: "/nastaveni/uzivatele" },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Sidebar({
  user,
  newCommentsCount = 0,
}: {
  user: SidebarUser | null;
  newCommentsCount?: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { close: closeMobileSidebar } = useMobileSidebar();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

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
            ? pathname === href ||
              pathname.startsWith(matchPrefix + "/") ||
              pathname === matchPrefix
            : pathname === href;
          const showBadge = href === "/nabidky" && newCommentsCount > 0;
          return (
            <Link
              key={href}
              href={href}
              onClick={closeMobileSidebar}
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
                  className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-semibold leading-none tabular-nums text-white"
                  style={{ background: "var(--accent)" }}
                >
                  {newCommentsCount}
                </span>
              )}
            </Link>
          );
        })}

        {user?.role === "admin" && (
          <div className="mt-2">
            {ADMIN_NAV.map(({ href, label, icon: Icon, matchPrefix }) => {
              const isActive = matchPrefix
                ? pathname.startsWith(matchPrefix)
                : pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={closeMobileSidebar}
                  className={`group relative flex items-center gap-3 px-4 py-2.5 my-0.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-zinc-50 text-zinc-900"
                      : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50/70"
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full" style={{ background: "var(--accent)" }} />
                  )}
                  <Icon size={18} weight={isActive ? "duotone" : "regular"} color={isActive ? "var(--accent)" : undefined} />
                  <span className="flex-1">{label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      <div className="px-4 py-4 border-t border-zinc-200/70">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
            style={{ background: "var(--accent)" }}
          >
            {user ? getInitials(user.name) : "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-zinc-900 truncate">
              {user?.name ?? "—"}
            </div>
            <div className="text-xs text-zinc-500 truncate">Farline Living</div>
          </div>
          <button
            onClick={handleLogout}
            title="Odhlásit se"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors flex-shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}

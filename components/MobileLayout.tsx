"use client";

import { useState } from "react";
import { List } from "@phosphor-icons/react/dist/ssr";

export function MobileLayout({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-zinc-900/30 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-50 lg:static lg:z-auto transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {sidebar}
      </div>
      <main className="flex-1 min-w-0">
        <div className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-white border-b border-zinc-200/70 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-600"
            aria-label="Otevřít menu"
          >
            <List size={18} />
          </button>
          <span
            className="text-sm font-semibold text-zinc-900"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Farline
          </span>
        </div>
        {children}
      </main>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { X, Copy, Check, ShareNetwork } from "@phosphor-icons/react/dist/ssr";

export function ShareModal({
  open,
  onClose,
  shareId,
}: {
  open: boolean;
  onClose: () => void;
  shareId: string;
}) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUrl(`${window.location.origin}/nabidka/${shareId}`);
    }
  }, [shareId]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(t);
  }, [copied]);

  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-2xl animate-fade-in-up">
        <header className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShareNetwork size={20} weight="duotone" color="var(--accent)" />
            <h3
              className="text-lg font-semibold text-zinc-900"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Sdílet nabídku
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500">
            <X size={16} />
          </button>
        </header>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-zinc-600">
            Odkaz si může klient otevřít bez přihlášení. Komentáře, které nechá,
            se objeví zde a budou vám oznámeny e-mailem.
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg font-mono text-xs text-zinc-700 truncate">
              {url}
            </div>
            <button
              onClick={handleCopy}
              className="btn-tactile inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white"
              style={{ background: "var(--accent)" }}
            >
              {copied ? (
                <>
                  <Check size={14} weight="bold" className="animate-spring-scale" />
                  Zkopírováno
                </>
              ) : (
                <>
                  <Copy size={14} weight="bold" /> Kopírovat
                </>
              )}
            </button>
          </div>
          <div className="text-xs text-zinc-500">
            Tip: otevřete odkaz v novém okně a podívejte se na nabídku očima klienta.
          </div>
        </div>
      </div>
    </div>
  );
}

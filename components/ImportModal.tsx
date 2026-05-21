"use client";

import { useState } from "react";
import { X, UploadSimple, FileCsv } from "@phosphor-icons/react/dist/ssr";
import { useToast } from "./Toast";

export function ImportModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { push } = useToast();
  const [dragOver, setDragOver] = useState(false);
  const [filename, setFilename] = useState<string | null>(null);

  if (!open) return null;

  const handleImport = () => {
    push("Import bude dostupný v plné verzi", "info");
    setFilename(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-xl mx-4 shadow-2xl animate-fade-in-up">
        <header className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileCsv size={20} weight="duotone" color="var(--accent)" />
            <h3
              className="text-lg font-semibold text-zinc-900"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Import produktů z CSV
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500"
          >
            <X size={16} />
          </button>
        </header>

        <div className="p-6 space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files[0];
              if (f) setFilename(f.name);
            }}
            className={`border-2 border-dashed rounded-xl px-6 py-12 text-center transition-colors ${
              dragOver
                ? "border-zinc-400 bg-zinc-50"
                : "border-zinc-200 bg-zinc-50/50"
            }`}
            style={dragOver ? { borderColor: "var(--accent)" } : undefined}
          >
            <UploadSimple
              size={36}
              weight="duotone"
              color="var(--accent)"
              className="mx-auto mb-3"
            />
            <div className="text-sm text-zinc-700 mb-1">
              {filename ? (
                <span className="font-mono">{filename}</span>
              ) : (
                "Přetáhněte CSV soubor sem"
              )}
            </div>
            <div className="text-xs text-zinc-500">
              nebo
              <label className="ml-1 underline cursor-pointer">
                vyberte ze složky
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setFilename(f.name);
                  }}
                />
              </label>
            </div>
          </div>

          <div className="rounded-lg bg-zinc-50 border border-zinc-200 px-4 py-3 text-xs text-zinc-600">
            <div className="font-medium text-zinc-700 mb-1">
              Očekávaná struktura
            </div>
            kód, název, značka, dekor, typ, cena, měna
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="btn-tactile px-4 py-2 rounded-lg text-sm font-medium border border-zinc-200 text-zinc-700"
            >
              Zrušit
            </button>
            <button
              onClick={handleImport}
              disabled={!filename}
              className="btn-tactile px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "var(--accent)" }}
            >
              Importovat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

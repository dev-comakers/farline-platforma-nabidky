"use client";

import { useState, useRef } from "react";
import { X, UploadSimple, FileCsv, Warning, CheckCircle, ArrowLeft, DownloadSimple } from "@phosphor-icons/react/dist/ssr";
import { useToast } from "./Toast";

const TEMPLATE_COLUMNS = [
  { col: "kód", required: true, desc: "Unikátní kód produktu", example: "LB-TAP-001" },
  { col: "název", required: true, desc: "Název produktu", example: "Umyvadlová baterie Classic" },
  { col: "značka", required: true, desc: "Výrobce / značka", example: "Lefroy Brooks" },
  { col: "dekor", required: false, desc: "Povrchová úprava", example: "Chrom" },
  { col: "typ", required: true, desc: "Klíč kategorie (viz seznam níže)", example: "umyvadlove_baterie" },
  { col: "cena", required: true, desc: "Cena — číslo bez mezer", example: "15900" },
  { col: "měna", required: false, desc: "CZK / USD / EUR — výchozí CZK", example: "CZK" },
];

const CATEGORY_KEYS = [
  "umyvadlove_baterie", "vanove_baterie", "sprchove_sety", "hlavove_sprchy",
  "podomitkove_moduly", "vany", "wc", "doplnky",
  "kuchynske_baterie", "bidetove_baterie", "sprchove_kanaly", "ostatni",
];

const TEMPLATE_CSV = [
  "kód,název,značka,dekor,typ,cena,měna",
  "LB-TAP-001,Umyvadlová baterie Classic,Lefroy Brooks,Chrom,umyvadlove_baterie,15900,CZK",
  "CB-VAN-002,Vanová baterie Noir,CoalBrook,Broušený nikl,vanove_baterie,22500,CZK",
  "RD-SHW-003,Sprchový set Premium,Radomonte,Bílá mat,sprchove_sety,18750,EUR",
  "VI-BAT-004,Volně stojící vana,Victoria Albert,,vany,89000,CZK",
].join("\n");

function downloadTemplate() {
  const blob = new Blob(["﻿" + TEMPLATE_CSV], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "farline-import-sablona.csv";
  a.click();
  URL.revokeObjectURL(url);
}

interface ImportRowValid {
  index: number;
  valid: true;
  code: string;
  name: string;
  brand: string;
  decor: string;
  categoryKey: string;
  categoryId: string;
  unitPrice: number;
  currency: string;
}

interface ImportRowError {
  index: number;
  valid: false;
  raw: Record<string, string>;
  errors: string[];
}

type ImportRow = ImportRowValid | ImportRowError;

interface PreviewResult {
  rows: ImportRow[];
  validCount: number;
  errorCount: number;
}

type Step = "upload" | "preview" | "done";

export function ImportModal({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  onImported?: () => void;
}) {
  const { push } = useToast();
  const [step, setStep] = useState<Step>("upload");
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [result, setResult] = useState<{ created: number; updated: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleClose = () => {
    setStep("upload");
    setFile(null);
    setPreview(null);
    setResult(null);
    onClose();
  };

  const handlePreview = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/products/import/preview", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { push(data.error?.message ?? "Chyba při čtení souboru", "info"); return; }
      setPreview(data);
      setStep("preview");
    } catch {
      push("Chyba při načítání souboru", "info");
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!preview) return;
    const validRows = preview.rows
      .filter((r): r is ImportRowValid => r.valid)
      .map(({ code, name, brand, decor, categoryId, unitPrice, currency }) => ({
        code, name, brand, decor, categoryId, unitPrice, currency,
      }));

    if (validRows.length === 0) { push("Žádné validní řádky k importu", "info"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/products/import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: validRows }),
      });
      const data = await res.json();
      if (!res.ok) { push(data.error?.message ?? "Chyba při importu", "info"); return; }
      setResult({ created: data.created, updated: data.updated });
      setStep("done");
      onImported?.();
    } catch {
      push("Chyba při importu", "info");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 shadow-2xl animate-fade-in-up flex flex-col max-h-[90vh]">
        <header className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {step === "preview" && (
              <button onClick={() => setStep("upload")} className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 mr-1">
                <ArrowLeft size={16} />
              </button>
            )}
            <FileCsv size={20} weight="duotone" color="var(--accent)" />
            <h3 className="text-lg font-semibold text-zinc-900" style={{ fontFamily: "var(--font-display)" }}>
              {step === "upload" && "Import produktů"}
              {step === "preview" && "Náhled importu"}
              {step === "done" && "Import dokončen"}
            </h3>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500">
            <X size={16} />
          </button>
        </header>

        <div className="p-6 overflow-y-auto flex-1">
          {step === "upload" && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
                onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl px-6 py-12 text-center transition-colors cursor-pointer ${
                  dragOver ? "bg-zinc-50" : "border-zinc-200 bg-zinc-50/50 hover:border-zinc-300"
                }`}
                style={dragOver ? { borderColor: "var(--accent)" } : undefined}
              >
                <UploadSimple size={36} weight="duotone" color="var(--accent)" className="mx-auto mb-3" />
                <div className="text-sm text-zinc-700 mb-1">
                  {file ? (
                    <span className="font-mono font-medium">{file.name}</span>
                  ) : (
                    "Přetáhněte CSV nebo XLSX soubor sem"
                  )}
                </div>
                <div className="text-xs text-zinc-500">
                  nebo <span className="underline">vyberte ze složky</span>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,.xlsx"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }}
                />
              </div>

              <div className="rounded-xl bg-zinc-50 border border-zinc-200 overflow-hidden text-xs">
                <div className="px-4 py-3 border-b border-zinc-200 flex items-center justify-between">
                  <span className="font-medium text-zinc-700">Struktura souboru</span>
                  <button
                    onClick={downloadTemplate}
                    className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 transition-colors"
                  >
                    <DownloadSimple size={13} weight="bold" />
                    Stáhnout šablonu (.csv)
                  </button>
                </div>
                <div className="divide-y divide-zinc-100">
                  {TEMPLATE_COLUMNS.map(({ col, required, desc, example }) => (
                    <div key={col} className="px-4 py-2 flex items-center gap-3">
                      <span className="font-mono text-zinc-800 w-20 shrink-0">
                        {col}
                        {required && <span className="text-red-400 ml-0.5">*</span>}
                      </span>
                      <span className="text-zinc-500 flex-1">{desc}</span>
                      <span className="font-mono text-zinc-400 shrink-0 hidden sm:block">{example}</span>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3 border-t border-zinc-200 text-zinc-500">
                  <span className="font-medium text-zinc-600">Platné hodnoty pro sloupec typ: </span>
                  {CATEGORY_KEYS.map((k, i) => (
                    <span key={k}>
                      <span className="font-mono text-zinc-500">{k}</span>
                      {i < CATEGORY_KEYS.length - 1 && <span className="text-zinc-300"> · </span>}
                    </span>
                  ))}
                </div>
                <div className="px-4 py-2.5 border-t border-zinc-100 bg-white text-zinc-400">
                  * povinné pole · Existující produkty se stejným kódem budou aktualizovány.
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={handleClose} className="px-4 py-2 rounded-lg text-sm font-medium border border-zinc-200 text-zinc-700 hover:bg-zinc-50">
                  Zrušit
                </button>
                <button
                  onClick={handlePreview}
                  disabled={!file || loading}
                  className="btn-tactile px-5 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-40"
                  style={{ background: "var(--accent)" }}
                >
                  {loading ? "Načítám…" : "Pokračovat →"}
                </button>
              </div>
            </div>
          )}

          {step === "preview" && preview && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle size={16} weight="fill" />
                  <span className="font-medium tabular-nums font-mono">{preview.validCount}</span> platných
                </span>
                {preview.errorCount > 0 && (
                  <span className="flex items-center gap-1.5 text-amber-600">
                    <Warning size={16} weight="fill" />
                    <span className="font-medium tabular-nums font-mono">{preview.errorCount}</span> s chybou (přeskočeny)
                  </span>
                )}
              </div>

              <div className="border border-zinc-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-zinc-50">
                    <tr className="border-b border-zinc-200">
                      <th className="px-3 py-2 text-left text-zinc-500 font-medium w-8">#</th>
                      <th className="px-3 py-2 text-left text-zinc-500 font-medium">Kód</th>
                      <th className="px-3 py-2 text-left text-zinc-500 font-medium">Název</th>
                      <th className="px-3 py-2 text-left text-zinc-500 font-medium">Značka</th>
                      <th className="px-3 py-2 text-left text-zinc-500 font-medium">Typ</th>
                      <th className="px-3 py-2 text-right text-zinc-500 font-medium">Cena</th>
                      <th className="px-3 py-2 text-left text-zinc-500 font-medium">Měna</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {preview.rows.map((row) =>
                      row.valid ? (
                        <tr key={row.index} className="hover:bg-zinc-50/50">
                          <td className="px-3 py-2 text-zinc-400 tabular-nums font-mono">{row.index + 1}</td>
                          <td className="px-3 py-2 font-mono text-zinc-700">{row.code}</td>
                          <td className="px-3 py-2 text-zinc-700 max-w-[160px] truncate">{row.name}</td>
                          <td className="px-3 py-2 text-zinc-600">{row.brand}</td>
                          <td className="px-3 py-2 text-zinc-500 font-mono">{row.categoryKey}</td>
                          <td className="px-3 py-2 text-right text-zinc-700 tabular-nums font-mono">
                            {row.unitPrice.toLocaleString("cs-CZ")}
                          </td>
                          <td className="px-3 py-2 text-zinc-500">{row.currency}</td>
                        </tr>
                      ) : (
                        <tr key={row.index} className="bg-amber-50/60">
                          <td className="px-3 py-2 text-zinc-400 tabular-nums font-mono">{row.index + 1}</td>
                          <td colSpan={5} className="px-3 py-2 text-amber-700">
                            {row.errors.join(" · ")}
                            {Object.values(row.raw).some(Boolean) && (
                              <span className="ml-2 text-zinc-400 font-mono">
                                {Object.values(row.raw).filter(Boolean).slice(0, 3).join(", ")}
                              </span>
                            )}
                          </td>
                          <td />
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button onClick={() => setStep("upload")} className="px-4 py-2 rounded-lg text-sm text-zinc-600 hover:bg-zinc-100">
                  Zpět
                </button>
                <div className="flex gap-2">
                  <button onClick={handleClose} className="px-4 py-2 rounded-lg text-sm font-medium border border-zinc-200 text-zinc-700 hover:bg-zinc-50">
                    Zrušit
                  </button>
                  <button
                    onClick={handleCommit}
                    disabled={preview.validCount === 0 || loading}
                    className="btn-tactile px-5 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-40"
                    style={{ background: "var(--accent)" }}
                  >
                    {loading ? "Importuji…" : `Importovat ${preview.validCount} produktů`}
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === "done" && result && (
            <div className="py-8 text-center space-y-4">
              <CheckCircle size={48} weight="fill" color="var(--accent)" className="mx-auto" />
              <div>
                <div className="text-lg font-semibold text-zinc-900" style={{ fontFamily: "var(--font-display)" }}>
                  Import dokončen
                </div>
                <div className="mt-2 text-sm text-zinc-600">
                  <span className="tabular-nums font-mono font-medium text-zinc-900">{result.created}</span> nových ·{" "}
                  <span className="tabular-nums font-mono font-medium text-zinc-900">{result.updated}</span> aktualizovaných
                </div>
              </div>
              <button
                onClick={handleClose}
                className="btn-tactile px-6 py-2.5 rounded-lg text-sm font-medium text-white"
                style={{ background: "var(--accent)" }}
              >
                Zavřít
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

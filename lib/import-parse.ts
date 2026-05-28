import * as XLSX from "xlsx";
import { z } from "zod";

export interface ImportRowRaw {
  index: number;
  raw: Record<string, string>;
}

export interface ImportRowValid {
  index: number;
  valid: true;
  code: string;
  name: string;
  brand: string;
  decor: string;
  categoryKey: string;
  categoryId: string;
  unitPrice: number;
  currency: "CZK" | "USD" | "EUR";
  parameters: Record<string, string>;
  description?: string;
}

export interface ImportRowError {
  index: number;
  valid: false;
  raw: Record<string, string>;
  errors: string[];
}

export type ImportRow = ImportRowValid | ImportRowError;

const COLUMN_MAP: Record<string, string> = {
  "kód": "code", "kod": "code",
  "název": "name", "nazev": "name", "name": "name",
  "značka": "brand", "znacka": "brand", "brand": "brand",
  "dekor": "decor", "decor": "decor",
  "typ": "typ", "type": "typ",
  "cena": "price", "price": "price",
  "měna": "currency", "mena": "currency", "currency": "currency",
  "popis": "description", "description": "description",
  "material": "param_material", "materiál": "param_material",
  "povrch": "param_povrch",
  "rozmery": "param_rozmery", "rozměry": "param_rozmery",
  "pripojeni": "param_pripojeni", "připojení": "param_pripojeni",
  "zaruka": "param_zaruka", "záruka": "param_zaruka",
  "prutok": "param_prutok", "průtok": "param_prutok",
  "objem": "param_objem",
  "hmotnost": "param_hmotnost",
};

const rowSchema = z.object({
  code: z.string().min(1, "Kód je povinný").max(100),
  name: z.string().min(1, "Název je povinný").max(300),
  brand: z.string().min(1, "Značka je povinná").max(200),
  decor: z.string().max(200).default(""),
  typ: z.string().min(1, "Typ je povinný"),
  price: z.preprocess(
    (v) => (typeof v === "string" ? parseFloat(v.replace(",", ".").replace(/\s/g, "")) : v),
    z.number().positive("Cena musí být kladná")
  ),
  currency: z.enum(["CZK", "USD", "EUR"]).default("CZK"),
});

export function parseFileBuffer(buffer: Buffer): Record<string, string>[] {
  const wb = XLSX.read(buffer, { type: "buffer", codepage: 65001 });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

  if (raw.length < 2) return [];

  const headerRow = (raw[0] as unknown[]).map((h) => String(h).trim().toLowerCase());
  const mappedHeaders = headerRow.map((h) => COLUMN_MAP[h] ?? h);

  return raw.slice(1)
    .filter((row) => (row as unknown[]).some((cell) => String(cell).trim() !== ""))
    .map((row) => {
      const obj: Record<string, string> = {};
      mappedHeaders.forEach((key, i) => {
        obj[key] = String((row as unknown[])[i] ?? "").trim();
      });
      return obj;
    });
}

export function validateRows(
  rows: Record<string, string>[],
  categories: { id: string; key: string }[]
): ImportRow[] {
  const catMap = new Map(categories.map((c) => [c.key, c.id]));

  return rows.map((raw, index) => {
    const parsed = rowSchema.safeParse(raw);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message);
      return { index, valid: false, raw, errors } satisfies ImportRowError;
    }

    const { code, name, brand, decor, typ, price, currency } = parsed.data;
    const categoryId = catMap.get(typ);
    if (!categoryId) {
      return { index, valid: false, raw, errors: [`Neznámý typ kategorie: "${typ}"`] } satisfies ImportRowError;
    }

    const parameters: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (k.startsWith("param_") && String(v).trim()) {
        parameters[k.slice(6)] = String(v).trim();
      }
    }
    const description = raw.description?.trim() || undefined;

    return {
      index, valid: true,
      code, name, brand, decor,
      categoryKey: typ, categoryId,
      unitPrice: price, currency,
      parameters,
      description,
    } satisfies ImportRowValid;
  });
}

"use client";

import { useState } from "react";
import { Plus, Trash, PencilSimple, Check, X } from "@phosphor-icons/react/dist/ssr";
import { useToast } from "@/components/Toast";
import type { CategoryField, FieldType, ProductCategory } from "@/lib/types";

const FIELD_TYPE_LABEL: Record<FieldType, string> = {
  text: "Text",
  number: "Číslo",
  select: "Výběr",
};

function FieldRow({
  field,
  categoryId,
  onUpdated,
  onDeleted,
}: {
  field: CategoryField;
  categoryId: string;
  onUpdated: (f: CategoryField) => void;
  onDeleted: (id: string) => void;
}) {
  const { push } = useToast();
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(field.label);
  const [type, setType] = useState<FieldType>(field.type);
  const [options, setOptions] = useState(field.options.join(", "));
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/categories/${categoryId}/fields/${field.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label,
          type,
          options: type === "select" ? options.split(",").map((s) => s.trim()).filter(Boolean) : [],
        }),
      });
      if (res.ok) {
        const { field: updated } = await res.json();
        onUpdated(updated);
        setEditing(false);
        push("Pole uloženo");
      }
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Smazat pole "${field.label}"?`)) return;
    const res = await fetch(`/api/categories/${categoryId}/fields/${field.id}`, { method: "DELETE" });
    if (res.ok) {
      onDeleted(field.id);
      push("Pole smazáno");
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-zinc-50 rounded-lg border border-zinc-200">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="flex-1 px-2 py-1 text-sm border border-zinc-200 rounded-md focus:outline-none focus:border-zinc-400"
          placeholder="Label"
          autoFocus
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as FieldType)}
          className="px-2 py-1 text-sm border border-zinc-200 rounded-md focus:outline-none"
        >
          <option value="text">Text</option>
          <option value="number">Číslo</option>
          <option value="select">Výběr</option>
        </select>
        {type === "select" && (
          <input
            value={options}
            onChange={(e) => setOptions(e.target.value)}
            className="flex-1 px-2 py-1 text-sm border border-zinc-200 rounded-md focus:outline-none focus:border-zinc-400"
            placeholder="opt1, opt2, opt3"
          />
        )}
        <button onClick={save} disabled={busy} className="p-1.5 rounded-md hover:bg-emerald-50 text-emerald-600">
          <Check size={14} weight="bold" />
        </button>
        <button onClick={() => setEditing(false)} className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-500">
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg border border-zinc-100 hover:border-zinc-200 transition-colors">
      <span className="font-mono text-[11px] text-zinc-400 w-28 shrink-0">{field.key}</span>
      <span className="flex-1 text-sm text-zinc-900">{field.label}</span>
      <span className="text-[11px] text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
        {FIELD_TYPE_LABEL[field.type]}
      </span>
      {field.options.length > 0 && (
        <span className="text-[11px] text-zinc-400 truncate max-w-[140px]">
          {field.options.join(", ")}
        </span>
      )}
      <button onClick={() => setEditing(true)} className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700">
        <PencilSimple size={14} />
      </button>
      <button onClick={remove} className="p-1.5 rounded-md hover:bg-red-50 text-zinc-400 hover:text-red-600">
        <Trash size={14} />
      </button>
    </div>
  );
}

function AddFieldForm({
  categoryId,
  onAdded,
}: {
  categoryId: string;
  onAdded: (f: CategoryField) => void;
}) {
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");
  const [label, setLabel] = useState("");
  const [type, setType] = useState<FieldType>("text");
  const [options, setOptions] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key || !label) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/categories/${categoryId}/fields`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key,
          label,
          type,
          options: type === "select" ? options.split(",").map((s) => s.trim()).filter(Boolean) : [],
          order: 0,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onAdded(data.field);
        setKey(""); setLabel(""); setType("text"); setOptions("");
        setOpen(false);
        push("Pole přidáno");
      } else {
        push(data.error?.message ?? "Chyba", "info");
      }
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 px-4 py-2.5 rounded-lg border border-dashed border-zinc-300 hover:border-zinc-400 transition-colors w-full"
      >
        <Plus size={14} /> Přidat pole
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="border border-zinc-200 rounded-lg p-4 bg-zinc-50 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-[11px] uppercase tracking-wider text-zinc-500">Klíč</span>
          <input
            value={key}
            onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z_]/g, ""))}
            placeholder="material"
            className="mt-1 w-full px-3 py-1.5 text-sm border border-zinc-200 rounded-md font-mono focus:outline-none focus:border-zinc-400"
            autoFocus
          />
        </label>
        <label className="block">
          <span className="text-[11px] uppercase tracking-wider text-zinc-500">Label</span>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Materiál"
            className="mt-1 w-full px-3 py-1.5 text-sm border border-zinc-200 rounded-md focus:outline-none focus:border-zinc-400"
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-[11px] uppercase tracking-wider text-zinc-500">Typ</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as FieldType)}
            className="mt-1 w-full px-3 py-1.5 text-sm border border-zinc-200 rounded-md focus:outline-none"
          >
            <option value="text">Text</option>
            <option value="number">Číslo</option>
            <option value="select">Výběr</option>
          </select>
        </label>
        {type === "select" && (
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-zinc-500">Možnosti (čárkou)</span>
            <input
              value={options}
              onChange={(e) => setOptions(e.target.value)}
              placeholder="opt1, opt2"
              className="mt-1 w-full px-3 py-1.5 text-sm border border-zinc-200 rounded-md focus:outline-none focus:border-zinc-400"
            />
          </label>
        )}
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={() => setOpen(false)} className="px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 rounded-md">
          Zrušit
        </button>
        <button
          type="submit"
          disabled={busy || !key || !label}
          className="btn-tactile px-4 py-1.5 text-sm font-medium text-white rounded-md disabled:opacity-50"
          style={{ background: "var(--accent)" }}
        >
          Přidat
        </button>
      </div>
    </form>
  );
}

export function CategoryFieldsManager({ initialCategories }: { initialCategories: ProductCategory[] }) {
  const [categories, setCategories] = useState<ProductCategory[]>(initialCategories);

  const updateField = (catId: string, updated: CategoryField) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === catId ? { ...c, fields: c.fields.map((f) => (f.id === updated.id ? updated : f)) } : c
      )
    );
  };

  const deleteField = (catId: string, fieldId: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === catId ? { ...c, fields: c.fields.filter((f) => f.id !== fieldId) } : c))
    );
  };

  const addField = (catId: string, field: CategoryField) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === catId ? { ...c, fields: [...c.fields, field] } : c))
    );
  };

  return (
    <div className="space-y-8">
      {categories.map((cat) => (
        <section key={cat.id} className="bg-white border border-zinc-200/70 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-zinc-900" style={{ fontFamily: "var(--font-display)" }}>
                {cat.label}
              </h2>
              <span className="font-mono text-[11px] text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
                {cat.key}
              </span>
              <span className="ml-auto text-xs text-zinc-400">{cat.fields.length} polí</span>
            </div>
          </div>
          <div className="px-6 py-4 space-y-2">
            {cat.fields.length === 0 && (
              <p className="text-sm text-zinc-400 py-2">Žádná pole. Přidejte první pole níže.</p>
            )}
            {cat.fields.map((f) => (
              <FieldRow
                key={f.id}
                field={f}
                categoryId={cat.id}
                onUpdated={(updated) => updateField(cat.id, updated)}
                onDeleted={(id) => deleteField(cat.id, id)}
              />
            ))}
            <AddFieldForm categoryId={cat.id} onAdded={(f) => addField(cat.id, f)} />
          </div>
        </section>
      ))}
    </div>
  );
}

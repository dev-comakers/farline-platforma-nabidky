"use client";

import { useState } from "react";
import { Plus, Trash, PencilSimple, Check, X, CaretDown, ArrowUp, ArrowDown } from "@phosphor-icons/react/dist/ssr";
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
  const [confirmDelete, setConfirmDelete] = useState(false);
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
    const res = await fetch(`/api/categories/${categoryId}/fields/${field.id}`, { method: "DELETE" });
    if (res.ok) {
      onDeleted(field.id);
      push("Pole smazáno");
    }
    setConfirmDelete(false);
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
      {confirmDelete ? (
        <div className="flex items-center gap-1.5 ml-1">
          <span className="text-xs text-zinc-500">Smazat?</span>
          <button
            onClick={remove}
            className="px-2 py-1 text-xs font-medium rounded-md bg-red-600 text-white hover:bg-red-700"
          >
            Ano
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="px-2 py-1 text-xs rounded-md text-zinc-600 hover:bg-zinc-100"
          >
            Ne
          </button>
        </div>
      ) : (
        <button onClick={() => setConfirmDelete(true)} className="p-1.5 rounded-md hover:bg-red-50 text-zinc-400 hover:text-red-600">
          <Trash size={14} />
        </button>
      )}
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

function CategoryHeader({
  cat,
  expanded,
  onToggle,
  onUpdated,
  onDeleted,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
}: {
  cat: ProductCategory;
  expanded: boolean;
  onToggle: () => void;
  onUpdated: (cat: ProductCategory) => void;
  onDeleted: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const { push } = useToast();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [label, setLabel] = useState(cat.label);
  const [key, setKey] = useState(cat.key);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, key }),
      });
      const data = await res.json();
      if (res.ok) {
        onUpdated({ ...cat, label: data.category.label, key: data.category.key });
        setEditing(false);
        push("Kategorie uložena");
      } else {
        push(data.error?.message ?? "Chyba", "info");
      }
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    const res = await fetch(`/api/categories/${cat.id}`, { method: "DELETE" });
    if (res.ok) {
      onDeleted();
      push("Kategorie smazána");
    } else {
      const data = await res.json();
      push(data.error?.message ?? "Kategorii nelze smazat", "info");
    }
    setConfirmDelete(false);
  };

  return (
    <div
      className="px-6 py-4 flex items-center gap-3 cursor-pointer select-none"
      onClick={!editing ? onToggle : undefined}
    >
      <CaretDown
        size={14}
        className={`text-zinc-400 shrink-0 transition-transform duration-150 ${expanded ? "" : "-rotate-90"}`}
      />

      {editing ? (
        <div
          className="flex flex-1 items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="flex-1 px-2 py-1 text-sm font-semibold border border-zinc-200 rounded-md focus:outline-none focus:border-zinc-400"
            placeholder="Název kategorie"
            autoFocus
            style={{ fontFamily: "var(--font-display)" }}
          />
          <input
            value={key}
            onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z_]/g, ""))}
            className="w-40 px-2 py-1 text-sm font-mono border border-zinc-200 rounded-md focus:outline-none focus:border-zinc-400"
            placeholder="klic_kategorie"
          />
          <button
            onClick={save}
            disabled={busy}
            className="p-1.5 rounded-md hover:bg-emerald-50 text-emerald-600"
          >
            <Check size={14} weight="bold" />
          </button>
          <button
            onClick={() => { setLabel(cat.label); setKey(cat.key); setEditing(false); }}
            className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-500"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <>
          <h2
            className="text-base font-semibold text-zinc-900"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {cat.label}
          </h2>
          <span className="font-mono text-[11px] text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
            {cat.key}
          </span>
          <span className="ml-auto text-xs text-zinc-400">{cat.fields.length} polí</span>

          <button
            onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
            disabled={!canMoveUp}
            className="p-1 rounded hover:bg-zinc-100 text-zinc-400 disabled:opacity-30 transition-colors"
            aria-label="Posunout nahoru"
          >
            <ArrowUp size={12} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
            disabled={!canMoveDown}
            className="p-1 rounded hover:bg-zinc-100 text-zinc-400 disabled:opacity-30 transition-colors"
            aria-label="Posunout dolů"
          >
            <ArrowDown size={12} />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); setEditing(true); }}
            className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            <PencilSimple size={14} />
          </button>

          {confirmDelete ? (
            <div
              className="flex items-center gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-xs text-zinc-500">Smazat?</span>
              <button
                onClick={remove}
                className="px-2 py-1 text-xs font-medium rounded-md bg-red-600 text-white hover:bg-red-700"
              >
                Ano
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-1 text-xs rounded-md text-zinc-600 hover:bg-zinc-100"
              >
                Ne
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
              className="p-1.5 rounded-md hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-colors"
            >
              <Trash size={14} />
            </button>
          )}
        </>
      )}
    </div>
  );
}

function AddCategoryForm({
  onAdded,
  onClose,
}: {
  onAdded: (cat: ProductCategory) => void;
  onClose: () => void;
}) {
  const { push } = useToast();
  const [key, setKey] = useState("");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key || !label) return;
    setBusy(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, label, order: 999 }),
      });
      const data = await res.json();
      if (res.ok) {
        onAdded({ ...data.category, fields: [] });
        push("Kategorie přidána");
        onClose();
      } else {
        push(data.error?.message ?? "Chyba", "info");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="bg-white border border-zinc-200/70 rounded-2xl p-5 flex flex-wrap items-end gap-3"
    >
      <label className="block flex-1 min-w-[180px]">
        <span className="text-[11px] uppercase tracking-wider text-zinc-500">Klíč</span>
        <input
          value={key}
          onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z_]/g, ""))}
          placeholder="klic_kategorie"
          className="mt-1 w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg font-mono focus:outline-none focus:border-zinc-400"
          autoFocus
        />
      </label>
      <label className="block flex-1 min-w-[200px]">
        <span className="text-[11px] uppercase tracking-wider text-zinc-500">Název</span>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Název kategorie"
          className="mt-1 w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400"
        />
      </label>
      <button
        type="button"
        onClick={onClose}
        className="px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 rounded-lg"
      >
        Zrušit
      </button>
      <button
        type="submit"
        disabled={busy || !key || !label}
        className="btn-tactile px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50"
        style={{ background: "var(--accent)" }}
      >
        Přidat kategorii
      </button>
    </form>
  );
}

export function CategoryFieldsManager({ initialCategories }: { initialCategories: ProductCategory[] }) {
  const [categories, setCategories] = useState<ProductCategory[]>(initialCategories);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showAddForm, setShowAddForm] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const updateCategory = (id: string, updated: ProductCategory) => {
    setCategories((prev) => prev.map((c) => c.id === id ? { ...c, label: updated.label, key: updated.key } : c));
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const moveCategory = async (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= categories.length) return;

    const newCats = [...categories];
    const aOrder = newCats[idx].order;
    const bOrder = newCats[target].order;

    [newCats[idx], newCats[target]] = [newCats[target], newCats[idx]];
    newCats[idx] = { ...newCats[idx], order: aOrder };
    newCats[target] = { ...newCats[target], order: bOrder };

    setCategories(newCats);

    await Promise.all([
      fetch(`/api/categories/${newCats[idx].id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: aOrder }),
      }),
      fetch(`/api/categories/${newCats[target].id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: bOrder }),
      }),
    ]);
  };

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
    <div className="space-y-3">
      <div className="flex justify-end mb-2">
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="btn-tactile flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg"
          style={{ background: "var(--accent)" }}
        >
          <Plus size={14} weight="bold" /> Přidat novou kategorii
        </button>
      </div>

      {showAddForm && (
        <AddCategoryForm
          onAdded={(cat) => {
            setCategories((prev) => [...prev, cat]);
            setShowAddForm(false);
          }}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {categories.map((cat, idx) => (
        <section key={cat.id} className="bg-white border border-zinc-200/70 rounded-2xl overflow-hidden">
          <CategoryHeader
            cat={cat}
            expanded={expandedIds.has(cat.id)}
            onToggle={() => toggleExpand(cat.id)}
            onUpdated={(updated) => updateCategory(cat.id, updated)}
            onDeleted={() => deleteCategory(cat.id)}
            canMoveUp={idx > 0}
            canMoveDown={idx < categories.length - 1}
            onMoveUp={() => moveCategory(idx, -1)}
            onMoveDown={() => moveCategory(idx, 1)}
          />
          {expandedIds.has(cat.id) && (
            <div className="px-6 py-4 space-y-2 border-t border-zinc-100">
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
          )}
        </section>
      ))}
    </div>
  );
}

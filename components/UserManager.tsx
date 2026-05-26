"use client";

import { useState } from "react";
import { Plus, Trash, Key, X } from "@phosphor-icons/react/dist/ssr";
import { useToast } from "./Toast";

interface AppUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "manager";
  createdAt: string;
}

interface UserManagerProps {
  initialUsers: AppUser[];
  currentUserId: string;
}

const ROLE_LABEL: Record<string, string> = { admin: "Administrátor", manager: "Manažer" };

const inputCls = "mt-1 w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-zinc-400";

function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: (u: AppUser) => void }) {
  const { push } = useToast();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"admin" | "manager">("manager");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name || !password) { push("Vyplňte všechna pole", "info"); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, role, password }),
      });
      const data = await res.json();
      if (!res.ok) { push(data.error?.message ?? "Chyba při vytváření", "info"); return; }
      onCreated(data.user);
      push("Uživatel vytvořen");
      onClose();
    } catch {
      push("Chyba při vytváření", "info");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-2xl">
        <header className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-900" style={{ fontFamily: "var(--font-display)" }}>
            Nový uživatel
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500">
            <X size={16} />
          </button>
        </header>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <label className="block">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">E-mail *</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="uzivatel@farline.cz" />
          </label>
          <label className="block">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Jméno *</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Jan Novák" />
          </label>
          <label className="block">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Role</span>
            <select value={role} onChange={(e) => setRole(e.target.value as "admin" | "manager")} className={inputCls}>
              <option value="manager">Manažer</option>
              <option value="admin">Administrátor</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Heslo *</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} placeholder="min. 8 znaků" />
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 rounded-lg">
              Zrušit
            </button>
            <button type="submit" disabled={busy}
              className="btn-tactile px-5 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60"
              style={{ background: "var(--accent)" }}>
              {busy ? "Vytváření…" : "Vytvořit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ResetPasswordModal({ user, onClose }: { user: AppUser; onClose: () => void }) {
  const { push } = useToast();
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) { push(data.error?.message ?? "Chyba", "info"); return; }
      push("Heslo změněno");
      onClose();
    } catch {
      push("Chyba při změně hesla", "info");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-sm mx-4 shadow-2xl">
        <header className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-900" style={{ fontFamily: "var(--font-display)" }}>
            Nové heslo
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500">
            <X size={16} />
          </button>
        </header>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <p className="text-sm text-zinc-500">Nastavit nové heslo pro <strong className="text-zinc-700">{user.name}</strong>.</p>
          <label className="block">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Nové heslo *</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} placeholder="min. 8 znaků" autoFocus />
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 rounded-lg">
              Zrušit
            </button>
            <button type="submit" disabled={busy || password.length < 8}
              className="btn-tactile px-5 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60"
              style={{ background: "var(--accent)" }}>
              {busy ? "Ukládám…" : "Uložit heslo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function UserManager({ initialUsers, currentUserId }: UserManagerProps) {
  const { push } = useToast();
  const [users, setUsers] = useState<AppUser[]>(initialUsers);
  const [showCreate, setShowCreate] = useState(false);
  const [resetUser, setResetUser] = useState<AppUser | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (user: AppUser) => {
    if (!confirm(`Smazat uživatele ${user.name}? Tato akce je nevratná.`)) return;
    setDeleting(user.id);
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        push(data.error?.message ?? "Chyba při mazání", "info");
        return;
      }
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      push("Uživatel smazán");
    } catch {
      push("Chyba při mazání", "info");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-zinc-200/70 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-700">{users.length} {users.length === 1 ? "uživatel" : "uživatelé"}</span>
          <button
            onClick={() => setShowCreate(true)}
            className="btn-tactile inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: "var(--accent)" }}
          >
            <Plus size={15} />
            Přidat uživatele
          </button>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100">
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Jméno</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">E-mail</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Přidán</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-zinc-50/50">
                <td className="px-6 py-4 font-medium text-zinc-900">
                  {user.name}
                  {user.id === currentUserId && (
                    <span className="ml-2 text-xs text-zinc-400">(vy)</span>
                  )}
                </td>
                <td className="px-6 py-4 text-zinc-600">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    user.role === "admin"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-zinc-100 text-zinc-600"
                  }`}>
                    {ROLE_LABEL[user.role]}
                  </span>
                </td>
                <td className="px-6 py-4 text-zinc-500 tabular-nums font-mono text-xs">
                  {new Date(user.createdAt).toLocaleDateString("cs-CZ")}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => setResetUser(user)}
                      className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700"
                      title="Změnit heslo"
                    >
                      <Key size={15} />
                    </button>
                    {user.id !== currentUserId && (
                      <button
                        onClick={() => handleDelete(user)}
                        disabled={deleting === user.id}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-600 disabled:opacity-40"
                        title="Smazat uživatele"
                      >
                        <Trash size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="px-6 py-12 text-center text-sm text-zinc-400">Zatím žádní uživatelé.</div>
        )}
      </div>

      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreated={(u) => setUsers((prev) => [...prev, u])}
        />
      )}
      {resetUser && (
        <ResetPasswordModal user={resetUser} onClose={() => setResetUser(null)} />
      )}
    </>
  );
}

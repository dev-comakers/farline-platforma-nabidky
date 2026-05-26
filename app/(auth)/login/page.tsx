"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const from = searchParams.get("from") ?? "/";
        router.push(from);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        if (res.status === 429) {
          setError("Příliš mnoho pokusů. Zkuste to prosím za chvíli.");
        } else {
          setError(data.error?.message ?? "Přihlášení se nezdařilo");
        }
      }
    } catch {
      setError("Chyba připojení. Zkuste to znovu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
          E-mail
        </label>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 text-sm text-zinc-900 bg-white outline-none transition-colors focus:border-zinc-400 placeholder:text-zinc-300"
          placeholder="vas@email.cz"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
          Heslo
        </label>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 text-sm text-zinc-900 bg-white outline-none transition-colors focus:border-zinc-400"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-tactile w-full py-2.5 rounded-lg text-sm font-medium text-white mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: "var(--accent)" }}
      >
        {loading ? "Přihlašuji…" : "Přihlásit se"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#FAFAF8" }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div
            className="text-[17px] tracking-[0.32em] uppercase font-semibold text-zinc-900"
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
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200/70 px-8 py-8">
          <h1
            className="text-lg font-semibold text-zinc-900 mb-6"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Přihlášení
          </h1>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

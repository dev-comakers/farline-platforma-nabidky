"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle, Info, X } from "@phosphor-icons/react/dist/ssr";

interface Toast {
  id: string;
  message: string;
  variant: "success" | "info";
}

interface ToastContextValue {
  push: (message: string, variant?: "success" | "info") => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, variant: "success" | "info" = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem
            key={t.id}
            toast={t}
            onClose={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  return (
    <div className="animate-spring-scale pointer-events-auto flex items-center gap-3 bg-white border border-zinc-200 rounded-xl shadow-lg pl-4 pr-3 py-3 min-w-[280px] max-w-md">
      {toast.variant === "success" ? (
        <CheckCircle size={20} weight="duotone" color="var(--accent)" />
      ) : (
        <Info size={20} weight="duotone" className="text-zinc-500" />
      )}
      <span className="flex-1 text-sm text-zinc-700">{toast.message}</span>
      <button
        onClick={onClose}
        className="text-zinc-400 hover:text-zinc-700 p-1 rounded-md"
        aria-label="Zavřít"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return { push: (_m: string) => {} } as ToastContextValue;
  }
  return ctx;
}

export function useAutoClear<T>(value: T, ms: number, onClear: () => void) {
  useEffect(() => {
    if (!value) return;
    const t = setTimeout(onClear, ms);
    return () => clearTimeout(t);
  }, [value, ms, onClear]);
}

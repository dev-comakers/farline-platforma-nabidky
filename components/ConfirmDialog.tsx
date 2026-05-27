"use client";

import { X } from "@phosphor-icons/react/dist/ssr";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Potvrdit",
  cancelLabel = "Zrušit",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-900/30 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm mx-4 shadow-2xl animate-fade-in-up">
        <div className="px-6 pt-5 pb-1 flex items-start justify-between gap-3">
          <h3
            className="text-base font-semibold text-zinc-900"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title}
          </h3>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 shrink-0 -mt-0.5"
          >
            <X size={14} />
          </button>
        </div>
        <div className="px-6 pb-6">
          <p className="text-sm text-zinc-600 mb-5">{message}</p>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 btn-tactile px-4 py-2.5 rounded-lg text-sm font-medium text-white ${
                destructive ? "bg-red-500 hover:bg-red-600" : ""
              }`}
              style={!destructive ? { background: "var(--accent)" } : undefined}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import type { PhosphorIcon } from "@/lib/productIcons";

export function MetricCard({
  label,
  value,
  hint,
  icon: IconCmp,
  accent = false,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: PhosphorIcon;
  accent?: boolean;
}) {
  return (
    <div className="bg-white border border-zinc-200/70 rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <div className="text-xs uppercase tracking-wider text-zinc-500 font-medium">
          {label}
        </div>
        <IconCmp
          size={18}
          weight="duotone"
          color={accent ? "var(--accent)" : "#a1a1aa"}
        />
      </div>
      <div
        className="mt-3 text-3xl font-semibold tabular-nums text-zinc-900"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-zinc-500">{hint}</div>}
    </div>
  );
}

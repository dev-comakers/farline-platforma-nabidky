import { OFFER_STATUS_LABEL, type OfferStatus } from "@/lib/types";

const styles: Record<OfferStatus, string> = {
  rozpracovana: "bg-zinc-100 text-zinc-600",
  odeslana: "bg-sky-50 text-sky-700",
  okomentovana: "bg-amber-50 text-amber-700",
  potvrzena: "bg-emerald-50 text-emerald-700",
};

const dotColor: Record<OfferStatus, string> = {
  rozpracovana: "bg-zinc-400",
  odeslana: "bg-sky-600",
  okomentovana: "bg-amber-500",
  potvrzena: "bg-emerald-600",
};

export function StatusBadge({
  status,
  pulse = false,
}: {
  status: OfferStatus;
  pulse?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${dotColor[status]} ${
          pulse && status === "okomentovana" ? "animate-pulse-subtle" : ""
        }`}
      />
      {OFFER_STATUS_LABEL[status]}
    </span>
  );
}

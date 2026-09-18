"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateInquiryStatusAction } from "@/app/actions/admin-inquiry-actions";
import type { InstitutionInquiry } from "@/db/schema";

const STATUS_OPTIONS: InstitutionInquiry["status"][] = ["NEW", "CONTACTED", "CLOSED"];
const STATUS_LABELS: Record<InstitutionInquiry["status"], string> = {
  NEW: "Új",
  CONTACTED: "Felvéve a kapcsolat",
  CLOSED: "Lezárva",
};

export function InquiryStatusControl({ inquiry }: { inquiry: Pick<InstitutionInquiry, "id" | "status"> }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange(status: InstitutionInquiry["status"]) {
    setError(null);
    startTransition(async () => {
      const result = await updateInquiryStatusAction(inquiry.id, status);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? "Valami hiba történt.");
      }
    });
  }

  return (
    <div>
      <select
        defaultValue={inquiry.status}
        disabled={isPending}
        onChange={(event) => handleChange(event.target.value as InstitutionInquiry["status"])}
        className="min-h-11 rounded-md border border-border px-3 text-sm disabled:opacity-50"
      >
        {STATUS_OPTIONS.map((status) => (
          <option key={status} value={status}>
            {STATUS_LABELS[status]}
          </option>
        ))}
      </select>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

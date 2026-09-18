"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteBlockedPeriodAction } from "@/app/actions/admin-blocked-period-actions";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatZonedHungarianDate, formatZonedTime } from "@/lib/utils/time";
import type { BlockedPeriod } from "@/db/schema";

export function BlockedPeriodList({ periods }: { periods: BlockedPeriod[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (periods.length === 0) {
    return <EmptyState title="Nincs blokkolt időszak." />;
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteBlockedPeriodAction(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {periods.map((period) => (
        <div key={period.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-white p-4">
          <div>
            <p className="text-sm font-medium text-foreground">
              {formatZonedHungarianDate(period.startAt)} {formatZonedTime(period.startAt)} –{" "}
              {formatZonedHungarianDate(period.endAt)} {formatZonedTime(period.endAt)}
            </p>
            {period.reason ? <p className="text-sm text-foreground/60">{period.reason}</p> : null}
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleDelete(period.id)}
            className="min-h-11 rounded-md border border-border px-4 text-sm font-medium text-foreground hover:border-red-400 hover:text-red-600 disabled:opacity-50"
          >
            Törlés
          </button>
        </div>
      ))}
    </div>
  );
}

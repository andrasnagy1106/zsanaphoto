import { listBlockedPeriods } from "@/lib/services/blocked-period-service";
import { BlockedPeriodForm } from "@/components/admin/BlockedPeriodForm";
import { BlockedPeriodList } from "@/components/admin/BlockedPeriodList";

export default async function AdminBlockedPeriodsPage() {
  const periods = await listBlockedPeriods();

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Blokkolt időszakok</h1>

      <div className="mt-6">
        <BlockedPeriodForm />
      </div>

      <div className="mt-6">
        <BlockedPeriodList periods={periods} />
      </div>
    </div>
  );
}

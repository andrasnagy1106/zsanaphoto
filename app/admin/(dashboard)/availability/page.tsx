import { listAvailabilityRules } from "@/lib/services/availability-rule-service";
import { AvailabilityRuleForm } from "@/components/admin/AvailabilityRuleForm";
import { AvailabilityDateOverridesManager } from "@/components/admin/AvailabilityDateOverridesManager";
import { listAvailabilityDateOverrides } from "@/lib/services/availability-date-override-service";

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export default async function AdminAvailabilityPage() {
  const [rules, overrides] = await Promise.all([
    listAvailabilityRules(),
    listAvailabilityDateOverrides(),
  ]);
  const ruleByDay = new Map(rules.map((rule) => [rule.dayOfWeek, rule]));

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Elérhetőség</h1>
      <p className="mt-2 text-sm text-foreground/60">Heti munkaidő-szabályok napok szerint.</p>

      <div className="mt-6 space-y-3">
        {DAY_ORDER.map((dayOfWeek) => {
          const rule = ruleByDay.get(dayOfWeek);
          return (
            <AvailabilityRuleForm
              key={dayOfWeek}
              dayOfWeek={dayOfWeek}
              startTime={rule?.startTime ?? "09:00"}
              endTime={rule?.endTime ?? "17:00"}
              active={rule?.active ?? false}
            />
          );
        })}
      </div>

      <div className="mt-8">
        <AvailabilityDateOverridesManager overrides={overrides} />
        <p className="mt-2 text-xs text-foreground/60">
          Teljes nap vagy időszak letiltásához használd a Blokkolt időszakok oldalt.
        </p>
      </div>
    </div>
  );
}

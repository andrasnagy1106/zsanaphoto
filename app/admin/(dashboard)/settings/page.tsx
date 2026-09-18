import { getSettings } from "@/lib/services/settings-service";
import { SettingsForm } from "@/components/admin/SettingsForm";

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Beállítások</h1>
      <div className="mt-6">
        <SettingsForm
          defaultValues={{
            timezone: settings.timezone,
            adminNotificationEmail: settings.adminNotificationEmail,
            siteContactEmail: settings.siteContactEmail,
            minimumLeadTimeHours: settings.minimumLeadTimeHours,
            maxAdvanceDays: settings.maxAdvanceDays,
          }}
        />
      </div>
    </div>
  );
}

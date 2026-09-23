import { getSettings } from "@/lib/services/settings-service";
import { getSitePhotoUrls } from "@/lib/services/site-photo-service";
import { listAdminUsers } from "@/lib/services/admin-user-service";
import { requireAdmin } from "@/lib/auth/guard";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { AdminUserManager } from "@/components/admin/AdminUserManager";
import { AboutPhotoUploadForm } from "@/components/admin/AboutPhotoUploadForm";
import { HomeServiceCardPhotosManager } from "@/components/admin/HomeServiceCardPhotosManager";
import { HOME_SERVICE_CARDS } from "@/lib/home-service-cards";

export default async function AdminSettingsPage() {
  const [settings, adminList, currentAdmin, serviceCardPhotoUrls] = await Promise.all([
    getSettings(),
    listAdminUsers(),
    requireAdmin(),
    getSitePhotoUrls(HOME_SERVICE_CARDS.map((card) => card.key)),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl text-foreground">Beállítások</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Rendszerszintű beállítások, értesítési e-mailek, alapárak és adminisztrátori fiókok.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <SettingsForm
          defaultValues={{
            timezone: settings.timezone,
            adminNotificationEmail: settings.adminNotificationEmail,
            siteContactEmail: settings.siteContactEmail,
            minimumLeadTimeHours: settings.minimumLeadTimeHours,
            maxAdvanceDays: settings.maxAdvanceDays,
            defaultPhotoPrices: settings.defaultPhotoPrices,
          }}
        />

        <AdminUserManager
          adminUsers={adminList}
          currentAdminId={currentAdmin.id}
        />

        <AboutPhotoUploadForm currentPhotoUrl={settings.aboutPhotoUrl} />

        <HomeServiceCardPhotosManager photoUrlsByKey={serviceCardPhotoUrls} />
      </div>
    </div>
  );
}

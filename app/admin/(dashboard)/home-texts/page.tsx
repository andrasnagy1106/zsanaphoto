import { HomeTextsForm } from "@/components/admin/HomeTextsForm";
import { getHomeTexts } from "@/lib/services/home-text-service";

export const dynamic = "force-dynamic";

export default async function AdminHomeTextsPage() {
  const texts = await getHomeTexts();

  return (
    <div>
      <div>
        <h1 className="font-display text-2xl text-foreground">Főoldal szövegei</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Itt módosíthatod a főoldalon megjelenő összes szöveget, a megjelenésük sorrendjében. Ha egy
          mezőt üresen hagysz, az eredeti szöveg jelenik meg. A képeket a Beállítások oldalon cserélheted.
        </p>
      </div>

      <div className="mt-6">
        <HomeTextsForm initialTexts={texts} />
      </div>
    </div>
  );
}

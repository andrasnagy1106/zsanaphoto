import { EventPhotoManager } from "@/components/admin/EventPhotoManager";
import {
  listEventsWithPin,
  listPhotosByPin,
} from "@/lib/services/photo-storage-service";

interface AdminEventPhotosPageProps {
  searchParams: Promise<{ pin?: string }>;
}

export const dynamic = "force-dynamic";

export default async function AdminEventPhotosPage({
  searchParams,
}: AdminEventPhotosPageProps) {
  const { pin } = await searchParams;
  const events = await listEventsWithPin();

  const selectedPin = pin ?? events[0]?.pin ?? "";
  const photos = selectedPin ? await listPhotosByPin(selectedPin) : [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-foreground">Esemény fotók (Cloudinary)</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Intézményi fotózások képeinek kezelése és feltöltése PIN kódok és Cloudinary mappák szerint.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <EventPhotoManager
          events={events}
          selectedPin={selectedPin}
          initialPhotos={photos}
        />
      </div>
    </div>
  );
}

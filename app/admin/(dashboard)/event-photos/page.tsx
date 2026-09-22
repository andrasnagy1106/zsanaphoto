import { EventPhotoManager } from "@/components/admin/EventPhotoManager";
import { getActivePhotoOrderForBooking } from "@/lib/services/photo-order-service";
import {
  listEventsWithPin,
  listPhotosByPin,
} from "@/lib/services/photo-storage-service";
import { listServices } from "@/lib/services/service-service";

interface AdminEventPhotosPageProps {
  searchParams: Promise<{ pin?: string }>;
}

export const dynamic = "force-dynamic";

export default async function AdminEventPhotosPage({
  searchParams,
}: AdminEventPhotosPageProps) {
  const { pin } = await searchParams;
  const [events, services] = await Promise.all([
    listEventsWithPin(),
    listServices(),
  ]);

  const selectedPin = pin ?? events[0]?.pin ?? "";
  const selectedEvent = events.find((e) => e.pin === selectedPin);

  const [photos, activeOrder] = await Promise.all([
    selectedPin ? listPhotosByPin(selectedPin) : Promise.resolve([]),
    selectedEvent ? getActivePhotoOrderForBooking(selectedEvent.bookingId) : Promise.resolve(null),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-foreground">Esemény fotók & Megrendelések</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Intézményi és egyedi fotózások képeinek menedzselése, feltöltése és megrendeléseinek megtekintése PIN-kódok szerint.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <EventPhotoManager
          events={events}
          services={services}
          selectedPin={selectedPin}
          initialPhotos={photos}
          activeOrder={activeOrder}
        />
      </div>
    </div>
  );
}

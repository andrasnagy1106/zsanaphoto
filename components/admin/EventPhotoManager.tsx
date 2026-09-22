"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useMemo, useRef, useState, useTransition } from "react";
import {
  deleteEventPhotoAction,
  deleteMultipleEventPhotosAction,
  updateCustomerPhotoViewModeAction,
  uploadEventPhotosAction,
} from "@/app/actions/admin-photo-actions";
import type { Booking, EventPhoto, PhotoOrder, PhotoOrderItem, Service } from "@/db/schema";
import type { EventWithPinOption } from "@/lib/services/photo-storage-service";
import { formatPrice } from "@/lib/photo-order-catalog";
import { formatZonedHungarianDate, formatZonedTime } from "@/lib/utils/time";
import { CreateEventUserModal } from "@/components/admin/CreateEventUserModal";
import { PhotoOrderStatusControl } from "@/components/admin/PhotoOrderStatusControl";

interface EventPhotoManagerProps {
  events: EventWithPinOption[];
  services: Service[];
  selectedPin?: string;
  initialPhotos: EventPhoto[];
  activeOrder?: {
    order: PhotoOrder;
    items: PhotoOrderItem[];
  } | null;
}

type ViewMode = "gallery" | "order";

function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes === 0) return "-";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function EventPhotoManager({
  events,
  services,
  selectedPin,
  initialPhotos,
  activeOrder,
}: EventPhotoManagerProps) {
  const router = useRouter();
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [currentPin, setCurrentPin] = useState(selectedPin ?? (events[0]?.pin ?? ""));
  const [viewMode, setViewMode] = useState<ViewMode>("gallery");

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
  const [isUploading, startUploadTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isUpdatingMode, startModeTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [previewModalUrl, setPreviewModalUrl] = useState<{ url: string; title: string } | null>(null);

  // Filter events by selected service
  const filteredEvents = useMemo(() => {
    if (!selectedServiceId) return events;
    return events.filter((e) => e.serviceId === selectedServiceId);
  }, [events, selectedServiceId]);

  const selectedEvent = events.find((e) => e.pin === currentPin);

  function handleViewModeChange(newMode: Booking["customerPhotoViewMode"]) {
    if (!selectedEvent) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    startModeTransition(async () => {
      const result = await updateCustomerPhotoViewModeAction(selectedEvent.bookingId, newMode);
      if (result.success) {
        setSuccessMessage(
          newMode === "GALLERY_ONLY"
            ? "Ügyfél nézet beállítva: Teljes képgaléria (megrendelő letiltva)."
            : "Ügyfél nézet beállítva: Megrendelő felület (képek kiválasztása & rendelés).",
        );
        router.refresh();
      } else {
        setErrorMessage(result.error ?? "A nézet módosítása nem sikerült.");
      }
    });
  }

  function handleServiceFilterChange(serviceId: string) {
    setSelectedServiceId(serviceId);
    const firstMatching = serviceId
      ? events.find((e) => e.serviceId === serviceId)
      : events[0];

    if (firstMatching && firstMatching.pin !== currentPin) {
      handlePinChange(firstMatching.pin);
    }
  }

  function handlePinChange(newPin: string) {
    setCurrentPin(newPin);
    setSelectedFiles([]);
    setSelectedPhotoIds(new Set());
    setErrorMessage(null);
    setSuccessMessage(null);
    router.push(`/admin/event-photos?pin=${encodeURIComponent(newPin)}`);
  }

  function handleUserCreated(newPin: string) {
    setCurrentPin(newPin);
    setSelectedFiles([]);
    setSelectedPhotoIds(new Set());
    setSuccessMessage(`Új ügyfél és PIN (${newPin}) sikeresen létrehozva!`);
    router.push(`/admin/event-photos?pin=${encodeURIComponent(newPin)}`);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
    }
  }

  function handleRemoveSelectedFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleUpload() {
    if (!currentPin) {
      setErrorMessage("Válassz ki egy eseményt / PIN kódot a feltöltéshez.");
      return;
    }
    if (selectedFiles.length === 0) {
      setErrorMessage("Válassz ki legalább egy képfájlt.");
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append("pin", currentPin);
    selectedFiles.forEach((file) => {
      formData.append("files", file);
    });

    startUploadTransition(async () => {
      const result = await uploadEventPhotosAction(formData);
      if (result.success) {
        setSelectedFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setSuccessMessage(`${result.count ?? 1} kép sikeresen feltöltve a Cloudinary tárhelyre!`);
        router.refresh();
      } else {
        setErrorMessage(result.error ?? "A feltöltés nem sikerült.");
      }
    });
  }

  function handleDeleteSingle(photo: EventPhoto) {
    if (!window.confirm(`Biztosan törölni szeretnéd a(z) "${photo.title}" képet a Cloudinary-ről és az adatbázisból?`)) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    startDeleteTransition(async () => {
      const result = await deleteEventPhotoAction(photo.id);
      if (result.success) {
        setSuccessMessage(`A(z) "${photo.title}" kép sikeresen törölve.`);
        setSelectedPhotoIds((prev) => {
          const next = new Set(prev);
          next.delete(photo.id);
          return next;
        });
        router.refresh();
      } else {
        setErrorMessage(result.error ?? "A törlés sikertelen.");
      }
    });
  }

  function handleDeleteSelected() {
    if (selectedPhotoIds.size === 0) return;
    if (
      !window.confirm(
        `Biztosan törölni szeretnéd a kijelölt ${selectedPhotoIds.size} db képet a Cloudinary-ről és az adatbázisból?`,
      )
    ) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    startDeleteTransition(async () => {
      const result = await deleteMultipleEventPhotosAction(Array.from(selectedPhotoIds));
      if (result.success) {
        setSuccessMessage(`${result.count ?? selectedPhotoIds.size} kép sikeresen törölve.`);
        setSelectedPhotoIds(new Set());
        router.refresh();
      } else {
        setErrorMessage(result.error ?? "A törlés sikertelen.");
      }
    });
  }

  function togglePhotoSelection(photoId: string) {
    setSelectedPhotoIds((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedPhotoIds.size === initialPhotos.length) {
      setSelectedPhotoIds(new Set());
    } else {
      setSelectedPhotoIds(new Set(initialPhotos.map((p) => p.id)));
    }
  }

  return (
    <div className="space-y-6">
      {/* Event and PIN Filter Header Bar */}
      <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Események & PIN-kódok szűrése</h2>
            <p className="text-xs text-foreground/60 mt-0.5">
              Válassz esemény kategóriát vagy közvetlen PIN-t a képek és a megrendelés megtekintéséhez.
            </p>
          </div>
          <CreateEventUserModal
            services={services}
            defaultServiceId={selectedServiceId || undefined}
            onCreated={handleUserCreated}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="service-filter" className="block text-xs font-semibold text-foreground mb-1.5">
              Esemény / Szolgáltatás szűrő
            </label>
            <select
              id="service-filter"
              value={selectedServiceId}
              onChange={(e) => handleServiceFilterChange(e.target.value)}
              className="w-full min-h-11 rounded-md border border-border bg-white px-3 py-2 text-sm font-medium outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            >
              <option value="">Összes esemény / szolgáltatás ({events.length} ügyfél)</option>
              {services.map((s) => {
                const count = events.filter((e) => e.serviceId === s.id).length;
                return (
                  <option key={s.id} value={s.id}>
                    {s.name} ({count} regisztrált PIN)
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label htmlFor="pin-selector" className="block text-xs font-semibold text-foreground mb-1.5">
              Ügyfél & PIN-kód kiválasztása
            </label>
            {filteredEvents.length === 0 ? (
              <p className="py-2.5 text-xs text-foreground/50">Nincs a szűrésnek megfelelő PIN-kód.</p>
            ) : (
              <select
                id="pin-selector"
                value={currentPin}
                onChange={(e) => handlePinChange(e.target.value)}
                className="w-full min-h-11 rounded-md border border-border bg-white px-3 py-2 text-sm font-medium outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              >
                {filteredEvents.map((evt) => (
                  <option key={evt.pin} value={evt.pin}>
                    PIN: {evt.pin} — {evt.customerName} ({evt.serviceName} · {evt.photoCount} kép)
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {selectedEvent && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-border/60 pt-3 text-xs text-foreground/70">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
              <div>
                <span className="text-foreground/50">Ügyfél:</span> <strong className="text-foreground">{selectedEvent.customerName}</strong>
              </div>
              <div>
                <span className="text-foreground/50">E-mail:</span> <span className="text-foreground">{selectedEvent.customerEmail}</span>
              </div>
              <div>
                <span className="text-foreground/50">Telefon:</span> <span>{selectedEvent.customerPhone}</span>
              </div>
              <div>
                <span className="text-foreground/50">Foglalás:</span>{" "}
                <Link
                  href={`/admin/bookings/${selectedEvent.bookingId}`}
                  className="font-mono text-accent hover:underline font-semibold"
                >
                  {selectedEvent.bookingNumber} →
                </Link>
              </div>
            </div>

            {/* Customer Access Mode Control */}
            <div className="flex items-center gap-2 bg-muted/40 p-1.5 rounded-lg border border-border/60">
              <span className="font-semibold text-foreground/70 text-[11px] px-1">Ügyfél nézet:</span>
              <button
                type="button"
                disabled={isUpdatingMode}
                onClick={() => handleViewModeChange("ORDER_ONLY")}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                  selectedEvent.customerPhotoViewMode === "ORDER_ONLY"
                    ? "bg-accent text-white shadow-sm"
                    : "bg-white text-foreground/70 hover:text-foreground border border-border/60"
                }`}
              >
                Megrendelő felület
              </button>
              <button
                type="button"
                disabled={isUpdatingMode}
                onClick={() => handleViewModeChange("GALLERY_ONLY")}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                  selectedEvent.customerPhotoViewMode === "GALLERY_ONLY"
                    ? "bg-accent text-white shadow-sm"
                    : "bg-white text-foreground/70 hover:text-foreground border border-border/60"
                }`}
              >
                Teljes képgaléria
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Mode Switcher Tabs */}
      <div className="flex border-b border-border bg-muted/20 p-1.5 rounded-lg">
        <button
          type="button"
          onClick={() => setViewMode("gallery")}
          className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-md transition-colors ${
            viewMode === "gallery"
              ? "bg-white text-foreground shadow-sm"
              : "text-foreground/60 hover:text-foreground"
          }`}
        >
          📸 Teljes képek galériában ({initialPhotos.length} db)
        </button>
        <button
          type="button"
          onClick={() => setViewMode("order")}
          className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-md transition-colors flex items-center justify-center gap-2 ${
            viewMode === "order"
              ? "bg-white text-foreground shadow-sm"
              : "text-foreground/60 hover:text-foreground"
          }`}
        >
          📋 Megrendelő / Leadott rendelés
          {activeOrder && (
            <span className="rounded-full bg-accent text-white px-2 py-0.2 text-[10px] font-bold">
              {activeOrder.items.reduce((sum, item) => sum + item.quantity, 0)} db
            </span>
          )}
        </button>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-xs font-medium text-red-700">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-xs font-medium text-emerald-800">
          {successMessage}
        </div>
      )}

      {/* TAB 1: FULL GALLERY VIEW & UPLOAD */}
      {viewMode === "gallery" && (
        <div className="space-y-6">
          {/* Upload Box */}
          {selectedEvent && (
            <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-base font-semibold text-foreground">Képek feltöltése a mappába ({selectedEvent.pin})</h2>
                  <p className="text-xs text-foreground/60">
                    A feltöltött képek automatikusan vízjelezve lesznek a megjelenítéshez. Támogatott: JPG, PNG, WEBP (max 25MB/kép).
                  </p>
                </div>
                {selectedFiles.length > 0 && (
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="min-h-10 rounded-full bg-accent px-5 py-2 text-xs font-semibold text-white hover:bg-accent-dark disabled:opacity-50 shadow-sm flex items-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <span className="inline-block size-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Feltöltés folyamatban ({selectedFiles.length} kép)...
                      </>
                    ) : (
                      `Feltöltés indítása (${selectedFiles.length} kép)`
                    )}
                  </button>
                )}
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border hover:border-accent bg-muted/20 hover:bg-muted/40 p-6 text-center cursor-pointer transition-colors"
              >
                <svg
                  className="size-10 text-foreground/40 mb-2"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm font-medium text-foreground">
                  Kattints ide vagy húzd ide a képeket a feltöltéshez
                </p>
                <p className="text-xs text-foreground/50 mt-1">Egyszerre több képfájl is kiválasztható</p>
                <input
                  ref={fileInputRef}
                  id={fileInputId}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Pending files list */}
              {selectedFiles.length > 0 && (
                <div className="mt-4 border-t border-border/60 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-foreground">Feltöltésre váró képek ({selectedFiles.length} db):</span>
                    <button
                      type="button"
                      onClick={() => setSelectedFiles([])}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Lista törlése
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1">
                    {selectedFiles.map((file, idx) => (
                      <div
                        key={`${file.name}-${idx}`}
                        className="flex items-center justify-between gap-2 rounded-md border border-border bg-white px-3 py-1.5 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{file.name}</p>
                          <p className="text-[10px] text-foreground/50">{formatBytes(file.size)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSelectedFile(idx)}
                          className="text-foreground/40 hover:text-red-600 size-6 flex items-center justify-center shrink-0 rounded hover:bg-muted"
                          title="Eltávolítás a listából"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Existing Photos Grid */}
          {selectedEvent && (
            <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    Feltöltött képek a(z) {selectedEvent.pin} mappában ({initialPhotos.length} db)
                  </h2>
                  <p className="text-xs text-foreground/60">
                    Az eseményhez tartozó fotók és adataik.
                  </p>
                </div>
                {initialPhotos.length > 0 && (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="text-xs font-semibold text-foreground/70 hover:text-foreground"
                    >
                      {selectedPhotoIds.size === initialPhotos.length ? "Kijelölés megszüntetése" : "Összes kijelölése"}
                    </button>
                    {selectedPhotoIds.size > 0 && (
                      <button
                        type="button"
                        onClick={handleDeleteSelected}
                        disabled={isDeleting}
                        className="min-h-8 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {isDeleting ? "Törlés..." : `Kijelöltek törlése (${selectedPhotoIds.size})`}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {initialPhotos.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm font-medium text-foreground/70">Még nincs feltöltött kép ehhez a PIN-kódhoz.</p>
                  <p className="text-xs text-foreground/50 mt-1">Használd a fenti feltöltő dobozt a képek hozzáadásához.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {initialPhotos.map((photo) => {
                    const isSelected = selectedPhotoIds.has(photo.id);
                    return (
                      <article
                        key={photo.id}
                        className={`group relative rounded-lg border overflow-hidden transition-all bg-white flex flex-col justify-between ${
                          isSelected ? "border-accent ring-2 ring-accent/30" : "border-border hover:border-foreground/30"
                        }`}
                      >
                        <div>
                          {/* Thumbnail Container */}
                          <div className="relative aspect-[4/3] bg-muted/40 overflow-hidden">
                            <Image
                              src={photo.watermarkedUrl}
                              alt={photo.title}
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />

                            {/* Top action overlay */}
                            <div className="absolute top-2 left-2 z-10">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => togglePhotoSelection(photo.id)}
                                className="size-4 rounded border-border text-accent focus:ring-accent cursor-pointer bg-white"
                                aria-label={`Kijelölés: ${photo.title}`}
                              />
                            </div>

                            {/* View Preview Button overlay */}
                            <button
                              type="button"
                              onClick={() => setPreviewModalUrl({ url: photo.watermarkedUrl, title: photo.title })}
                              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-xs font-semibold"
                            >
                              Nagyítás (Vízjeles előnézet)
                            </button>
                          </div>

                          {/* Photo details */}
                          <div className="p-3">
                            <h3 className="text-xs font-semibold text-foreground truncate" title={photo.title}>
                              {photo.title}
                            </h3>
                            {photo.originalFilename && photo.originalFilename !== photo.title && (
                              <p className="text-[11px] text-foreground/50 truncate mt-0.5" title={photo.originalFilename}>
                                {photo.originalFilename}
                              </p>
                            )}

                            <div className="mt-2 space-y-1 text-[11px] text-foreground/60 border-t border-border/40 pt-2">
                              <div className="flex justify-between">
                                <span>Méret / Típus:</span>
                                <span className="font-mono text-foreground/80">{photo.format?.toUpperCase() ?? "-"} · {formatBytes(photo.bytes)}</span>
                              </div>
                              {photo.width && photo.height && (
                                <div className="flex justify-between">
                                  <span>Felbontás:</span>
                                  <span className="font-mono text-foreground/80">{photo.width} × {photo.height} px</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span>Feltöltve:</span>
                                <span>{formatZonedHungarianDate(photo.createdAt)} {formatZonedTime(photo.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Actions */}
                        <div className="border-t border-border/60 p-2.5 bg-muted/20 flex items-center justify-between gap-2">
                          <a
                            href={photo.secureUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] font-semibold text-accent hover:underline inline-flex items-center gap-1"
                          >
                            Eredeti kép ↗
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDeleteSingle(photo)}
                            disabled={isDeleting}
                            className="text-[11px] font-semibold text-red-600 hover:text-red-700 hover:underline"
                          >
                            Törlés
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ORDER / MEGRENDELŐ VIEW */}
      {viewMode === "order" && (
        <div className="space-y-6">
          {activeOrder ? (
            <div className="rounded-xl border border-border bg-white p-6 shadow-sm space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/60 pb-5">
                <div>
                  <p className="text-xs font-semibold uppercase text-accent">Aktív fotórendelés</p>
                  <h3 className="mt-1 font-mono text-2xl font-bold">{activeOrder.order.orderNumber}</h3>
                  <p className="text-xs text-foreground/60 mt-1">
                    Ügyfél: <strong className="text-foreground">{selectedEvent?.customerName}</strong> ({selectedEvent?.customerEmail})
                  </p>
                  <p className="text-xs text-foreground/50">
                    Leadva: {formatZonedHungarianDate(activeOrder.order.createdAt)} {formatZonedTime(activeOrder.order.createdAt)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs font-semibold text-foreground/60">Rendelés állapota:</span>
                  <PhotoOrderStatusControl order={activeOrder.order} />
                </div>
              </div>

              {/* Digital option banner if selected */}
              {activeOrder.order.includesDigital && (
                <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-accent text-white px-2.5 py-0.5 text-[11px] font-bold">
                      Digitális változat kiválasztva
                    </span>
                    <span className="font-semibold text-foreground">
                      (+2 000 Ft digitális átadási csomag)
                    </span>
                  </div>
                  <p className="mt-1.5 text-foreground/75">
                    Kinyomtatott képek ebben a fotócsomagban nem készülnek (ha nincs külön papírkép rendelve), csak digitálisan átadott, megszerkesztett képek online galériában.
                  </p>
                </div>
              )}

              {/* Items Table */}
              <div className="overflow-hidden rounded-lg border border-border">
                <div className="grid grid-cols-[minmax(0,1fr)_6rem_5rem_4rem_5.5rem] gap-2 border-b border-border bg-muted/40 px-4 py-3 text-xs font-semibold text-foreground/70">
                  <span>Fotó megnevezése</span>
                  <span>Méret</span>
                  <span className="text-right">Egységár</span>
                  <span className="text-right">Darab</span>
                  <span className="text-right">Részösszeg</span>
                </div>
                <div className="divide-y divide-border">
                  {activeOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[minmax(0,1fr)_6rem_5rem_4rem_5.5rem] items-center gap-2 px-4 py-3 text-sm"
                    >
                      <span className="font-medium text-foreground truncate">{item.photoTitle}</span>
                      <span className="text-xs text-foreground/70">{item.size}</span>
                      <span className="text-right text-xs text-foreground/60">{formatPrice(item.unitPrice)}</span>
                      <span className="text-right font-semibold text-foreground">{item.quantity} db</span>
                      <span className="text-right font-bold text-foreground">{formatPrice(item.totalPrice)}</span>
                    </div>
                  ))}

                  {activeOrder.order.includesDigital && (
                    <div className="grid grid-cols-[minmax(0,1fr)_6rem_5rem_4rem_5.5rem] items-center gap-2 px-4 py-3 text-sm bg-accent/5">
                      <span className="font-medium text-foreground">Digitális változat csomag</span>
                      <span className="text-xs text-accent font-semibold">Online galéria</span>
                      <span className="text-right text-xs text-foreground/60">-</span>
                      <span className="text-right font-semibold text-foreground">1 csomag</span>
                      <span className="text-right font-bold text-accent">
                        {formatPrice(
                          Math.max(
                            0,
                            activeOrder.order.totalAmount -
                              activeOrder.items.reduce((sum, item) => sum + item.totalPrice, 0),
                          ),
                        )}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-border bg-muted/20 px-5 py-4">
                  <span className="text-sm font-semibold text-foreground">
                    Összes rendelés végösszege
                  </span>
                  <span className="font-display text-xl font-bold text-accent">
                    {formatPrice(activeOrder.order.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Order Notes */}
              {activeOrder.order.notes && (
                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <p className="text-xs font-semibold uppercase text-foreground/60">Ügyfél megjegyzése</p>
                  <p className="mt-1.5 text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                    {activeOrder.order.notes}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-white p-12 text-center">
              <div className="mx-auto size-12 rounded-full bg-muted flex items-center justify-center text-foreground/40 mb-3 text-xl">
                📋
              </div>
              <h3 className="text-base font-semibold text-foreground">
                Ehhez a PIN-kódhoz ({selectedEvent?.pin}) még nincs leadott rendelés.
              </h3>
              <p className="mt-1 text-xs text-foreground/60 max-w-md mx-auto">
                Az ügyfél a PIN-kóddal tud belépni a privát felületre a képek megtekintéséhez és a papírképek vagy digitális változat megrendeléséhez.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Fullscreen Image Preview Lightbox */}
      {previewModalUrl && (
        <dialog
          open
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 w-full h-full border-0"
          onClick={() => setPreviewModalUrl(null)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh] bg-background rounded-xl p-4 shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between w-full mb-3">
              <h3 className="text-sm font-semibold text-foreground truncate">{previewModalUrl.title} (Vízjeles előnézet)</h3>
              <button
                type="button"
                onClick={() => setPreviewModalUrl(null)}
                className="size-8 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-muted/80 text-lg font-bold"
              >
                ×
              </button>
            </div>
            <div className="relative w-[85vw] max-w-4xl h-[70vh]">
              <Image
                src={previewModalUrl.url}
                alt={previewModalUrl.title}
                fill
                className="object-contain"
              />
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}


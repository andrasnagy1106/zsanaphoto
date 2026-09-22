"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition } from "react";
import {
  deleteEventPhotoAction,
  deleteMultipleEventPhotosAction,
  uploadEventPhotosAction,
} from "@/app/actions/admin-photo-actions";
import type { EventPhoto } from "@/db/schema";
import type { EventWithPinOption } from "@/lib/services/photo-storage-service";
import { formatZonedHungarianDate, formatZonedTime } from "@/lib/utils/time";

interface EventPhotoManagerProps {
  events: EventWithPinOption[];
  selectedPin?: string;
  initialPhotos: EventPhoto[];
}

function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes === 0) return "-";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function EventPhotoManager({
  events,
  selectedPin,
  initialPhotos,
}: EventPhotoManagerProps) {
  const router = useRouter();
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentPin, setCurrentPin] = useState(selectedPin ?? (events[0]?.pin ?? ""));
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
  const [isUploading, startUploadTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [previewModalUrl, setPreviewModalUrl] = useState<{ url: string; title: string } | null>(null);

  const selectedEvent = events.find((e) => e.pin === currentPin);

  function handleEventChange(newPin: string) {
    setCurrentPin(newPin);
    setSelectedFiles([]);
    setSelectedPhotoIds(new Set());
    setErrorMessage(null);
    setSuccessMessage(null);
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
      {/* Event / PIN Filter Selector Bar */}
      <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
        <label htmlFor="event-selector" className="block text-xs font-semibold uppercase tracking-wider text-foreground/70 mb-2">
          Válassz eseményt / PIN kódot
        </label>
        {events.length === 0 ? (
          <p className="text-sm text-foreground/60">Jelenleg nincs PIN kóddal rendelkező intézményi foglalás a rendszerben.</p>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            <select
              id="event-selector"
              value={currentPin}
              onChange={(e) => handleEventChange(e.target.value)}
              className="flex-1 min-h-11 rounded-md border border-border bg-white px-3 py-2 text-sm font-medium outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            >
              {events.map((evt) => (
                <option key={evt.pin} value={evt.pin}>
                  PIN: {evt.pin} — {evt.customerName} ({evt.bookingNumber} · {formatZonedHungarianDate(evt.startAt)}) — {evt.photoCount} kép
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedEvent && (
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border/60 pt-3 text-xs text-foreground/70">
            <div>
              <span className="text-foreground/50">Ügyfél:</span> <strong className="text-foreground">{selectedEvent.customerName}</strong>
            </div>
            <div>
              <span className="text-foreground/50">E-mail:</span> <span className="text-foreground">{selectedEvent.customerEmail}</span>
            </div>
            <div>
              <span className="text-foreground/50">Foglalás:</span> <span className="font-mono">{selectedEvent.bookingNumber}</span>
            </div>
            <div>
              <span className="text-foreground/50">Dátum:</span> <span>{formatZonedHungarianDate(selectedEvent.startAt)}</span>
            </div>
            <div>
              <span className="text-foreground/50">Cloudinary mappa:</span> <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono text-accent">zsanaphoto/events/{selectedEvent.pin}</code>
            </div>
          </div>
        )}
      </div>

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

      {/* Existing Photos Grid for this Event / PIN */}
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

      {/* Image Preview Modal */}
      {previewModalUrl && (
        <dialog
          open
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 w-full h-full border-0"
          onClick={() => setPreviewModalUrl(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-background rounded-xl p-4 shadow-2xl flex flex-col items-center"
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
            <div className="relative w-[80vw] max-w-3xl h-[65vh]">
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

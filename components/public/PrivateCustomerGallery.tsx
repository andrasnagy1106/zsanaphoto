"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { EventPhoto } from "@/db/schema";
import { formatZonedHungarianDate } from "@/lib/utils/time";

interface PrivateCustomerGalleryProps {
  customerName: string;
  bookingNumber: string;
  pin: string;
  serviceName: string;
  photos: EventPhoto[];
}

function getPhotoFileExtension(photo: EventPhoto): string {
  if (photo.format) return photo.format;
  const match = photo.watermarkedUrl.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
  return match ? match[1] : "jpg";
}

function getPhotoFileName(photo: EventPhoto): string {
  const safeTitle = photo.title.trim().replace(/[\\/:*?"<>|]+/g, "-") || "foto";
  return `${safeTitle}.${getPhotoFileExtension(photo)}`;
}

async function triggerBlobDownload(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

export function PrivateCustomerGallery({
  customerName,
  bookingNumber,
  pin,
  serviceName,
  photos,
}: PrivateCustomerGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [downloadingPhotoId, setDownloadingPhotoId] = useState<string | null>(null);
  const [bulkDownloadState, setBulkDownloadState] = useState<{ done: number; total: number } | null>(null);
  const [downloadErrorMessage, setDownloadErrorMessage] = useState<string | null>(null);

  const lightboxPhoto = lightboxIndex !== null ? photos[lightboxIndex] : null;

  const goToPreviousPhoto = useCallback(() => {
    setLightboxIndex((current) => (current === null ? current : (current - 1 + photos.length) % photos.length));
  }, [photos.length]);

  const goToNextPhoto = useCallback(() => {
    setLightboxIndex((current) => (current === null ? current : (current + 1) % photos.length));
  }, [photos.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setLightboxIndex(null);
      if (event.key === "ArrowLeft") goToPreviousPhoto();
      if (event.key === "ArrowRight") goToNextPhoto();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, goToPreviousPhoto, goToNextPhoto]);

  const downloadSinglePhoto = useCallback(async (photo: EventPhoto) => {
    setDownloadErrorMessage(null);
    setDownloadingPhotoId(photo.id);
    try {
      const response = await fetch(photo.watermarkedUrl);
      if (!response.ok) throw new Error("Letöltési hiba");
      const blob = await response.blob();
      await triggerBlobDownload(blob, getPhotoFileName(photo));
    } catch {
      setDownloadErrorMessage("Nem sikerült letölteni a képet. Kérjük, próbáld újra.");
    } finally {
      setDownloadingPhotoId(null);
    }
  }, []);

  const downloadAllPhotosAsZip = useCallback(async () => {
    if (photos.length === 0) return;
    setDownloadErrorMessage(null);
    setBulkDownloadState({ done: 0, total: photos.length });
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      const usedFileNames = new Set<string>();

      for (const [index, photo] of photos.entries()) {
        const response = await fetch(photo.watermarkedUrl);
        if (!response.ok) throw new Error("Letöltési hiba");
        const blob = await response.blob();

        let fileName = getPhotoFileName(photo);
        if (usedFileNames.has(fileName)) {
          const extension = getPhotoFileExtension(photo);
          fileName = fileName.replace(new RegExp(`\\.${extension}$`), `-${index + 1}.${extension}`);
        }
        usedFileNames.add(fileName);

        zip.file(fileName, blob);
        setBulkDownloadState({ done: index + 1, total: photos.length });
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      await triggerBlobDownload(zipBlob, `zsanaphoto-${bookingNumber}.zip`);
    } catch {
      setDownloadErrorMessage("Nem sikerült elkészíteni a letölthető csomagot. Kérjük, próbáld újra.");
    } finally {
      setBulkDownloadState(null);
    }
  }, [photos, bookingNumber]);

  const isBulkDownloading = bulkDownloadState !== null;
  const bulkDownloadProgressPercent = useMemo(() => {
    if (!bulkDownloadState || bulkDownloadState.total === 0) return 0;
    return Math.round((bulkDownloadState.done / bulkDownloadState.total) * 100);
  }, [bulkDownloadState]);

  return (
    <div>
      {/* Header */}
      <div className="border-b border-border pb-8">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold uppercase text-accent">Privát képgaléria</p>
          <span className="rounded-full bg-accent/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-accent">
            PIN: {pin}
          </span>
        </div>
        <h1 className="mt-3 font-display text-3xl sm:text-4xl">Fotógaléria</h1>
        <p className="mt-3 text-foreground/65">
          {customerName} · {serviceName} · Foglalás: {bookingNumber}
        </p>
        <p className="mt-2 max-w-2xl text-sm text-foreground/55">
          Az alábbiakban megtekintheted a fotózáson készült képeket. Kattints bármelyik fotóra a nagyításhoz, vagy töltsd le egyenként, illetve egyszerre az összeset.
        </p>

        {photos.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={downloadAllPhotosAsZip}
              disabled={isBulkDownloading}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isBulkDownloading && bulkDownloadState ? (
                <>
                  <span className="size-2 animate-pulse rounded-full bg-white" />
                  Csomagolás... {bulkDownloadState.done}/{bulkDownloadState.total}
                </>
              ) : (
                <>⬇ Összes kép letöltése ({photos.length} db)</>
              )}
            </button>
            {isBulkDownloading && (
              <div className="h-1.5 w-40 overflow-hidden rounded-full bg-muted sm:w-56">
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-200"
                  style={{ width: `${bulkDownloadProgressPercent}%` }}
                />
              </div>
            )}
          </div>
        )}
        {downloadErrorMessage && <p className="mt-3 text-sm text-red-600">{downloadErrorMessage}</p>}
      </div>

      {/* Gallery Photos */}
      {photos.length === 0 ? (
        <div className="my-16 rounded-xl border border-border bg-white p-12 text-center">
          <div className="mx-auto size-12 rounded-full bg-muted flex items-center justify-center text-foreground/40 mb-3 text-2xl">
            🖼️
          </div>
          <h2 className="text-base font-semibold text-foreground">Ehhez a galériához még nincsenek feltöltve fotók.</h2>
          <p className="mt-1 text-xs text-foreground/60 max-w-md mx-auto">
            A képek feldolgozása folyamatban van, kérjük látogass vissza később!
          </p>
        </div>
      ) : (
        <div className="mt-8 columns-2 gap-4 sm:columns-3 lg:columns-4 [column-fill:_balance]">
          {photos.map((photo, index) => (
            <article
              key={photo.id}
              className="group relative mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-shadow hover:shadow-lg"
            >
              <button
                type="button"
                onClick={() => setLightboxIndex(index)}
                className="block w-full cursor-pointer"
                aria-label={`${photo.title} megnyitása nagyban`}
              >
                <div className="relative w-full overflow-hidden bg-muted">
                  <Image
                    src={photo.watermarkedUrl}
                    alt={photo.title}
                    width={photo.width ?? 800}
                    height={photo.height ?? 600}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                </div>
              </button>

              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <p className="pointer-events-none truncate text-xs font-medium text-white drop-shadow" title={photo.title}>
                  {photo.title}
                </p>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    void downloadSinglePhoto(photo);
                  }}
                  disabled={downloadingPhotoId === photo.id}
                  className="pointer-events-auto inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-white/90 text-foreground shadow hover:bg-white disabled:opacity-60"
                  aria-label={`${photo.title} letöltése`}
                  title="Kép letöltése"
                >
                  {downloadingPhotoId === photo.id ? (
                    <span className="size-3 animate-spin rounded-full border-2 border-foreground/30 border-t-foreground" />
                  ) : (
                    "⬇"
                  )}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxPhoto && (
        <dialog
          open
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 w-full h-full border-0"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="relative flex max-h-[92vh] w-full max-w-5xl flex-col items-center rounded-xl bg-background p-4 shadow-2xl sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex w-full items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-foreground">{lightboxPhoto.title}</h3>
                <p className="text-xs text-foreground/50">
                  {lightboxIndex! + 1} / {photos.length} · Feltöltve: {formatZonedHungarianDate(lightboxPhoto.createdAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => void downloadSinglePhoto(lightboxPhoto)}
                  disabled={downloadingPhotoId === lightboxPhoto.id}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
                >
                  {downloadingPhotoId === lightboxPhoto.id ? "Letöltés..." : "⬇ Letöltés"}
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxIndex(null)}
                  className="flex size-9 items-center justify-center rounded-full bg-muted text-lg font-bold text-foreground hover:bg-muted/80"
                  aria-label="Bezárás"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="relative flex w-full flex-1 items-center justify-center">
              {photos.length > 1 && (
                <button
                  type="button"
                  onClick={goToPreviousPhoto}
                  className="absolute left-1 z-10 flex size-10 items-center justify-center rounded-full bg-white/85 text-lg font-bold text-foreground shadow hover:bg-white sm:left-2"
                  aria-label="Előző kép"
                >
                  ‹
                </button>
              )}
              <div className="relative h-[65vh] w-[85vw] max-w-4xl">
                <Image
                  src={lightboxPhoto.watermarkedUrl}
                  alt={lightboxPhoto.title}
                  fill
                  className="object-contain"
                />
              </div>
              {photos.length > 1 && (
                <button
                  type="button"
                  onClick={goToNextPhoto}
                  className="absolute right-1 z-10 flex size-10 items-center justify-center rounded-full bg-white/85 text-lg font-bold text-foreground shadow hover:bg-white sm:right-2"
                  aria-label="Következő kép"
                >
                  ›
                </button>
              )}
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}


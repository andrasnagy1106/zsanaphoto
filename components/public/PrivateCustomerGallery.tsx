"use client";

import Image from "next/image";
import { useState } from "react";
import type { EventPhoto } from "@/db/schema";
import { formatZonedHungarianDate } from "@/lib/utils/time";

interface PrivateCustomerGalleryProps {
  customerName: string;
  bookingNumber: string;
  pin: string;
  serviceName: string;
  photos: EventPhoto[];
}

export function PrivateCustomerGallery({
  customerName,
  bookingNumber,
  pin,
  serviceName,
  photos,
}: PrivateCustomerGalleryProps) {
  const [lightboxPhoto, setLightboxPhoto] = useState<EventPhoto | null>(null);

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
          Az alábbiakban megtekintheted a fotózáson készült képeket. Kattints bármelyik fotóra a nagyításhoz és letöltéshez.
        </p>
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
        <div className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => (
            <article
              key={photo.id}
              onClick={() => setLightboxPhoto(photo)}
              className="group relative overflow-hidden rounded-xl border border-border bg-white shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                <Image
                  src={photo.watermarkedUrl}
                  alt={photo.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-semibold">
                  Nagyítás 🔍
                </div>
              </div>
              <div className="p-3.5">
                <h3 className="text-sm font-semibold text-foreground truncate" title={photo.title}>
                  {photo.title}
                </h3>
                {photo.width && photo.height && (
                  <p className="mt-1 text-xs text-foreground/50">
                    {photo.width} × {photo.height} px
                  </p>
                )}
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
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="relative max-w-5xl max-h-[92vh] bg-background rounded-xl p-4 sm:p-6 shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between w-full mb-3">
              <div>
                <h3 className="text-base font-semibold text-foreground truncate">{lightboxPhoto.title}</h3>
                <p className="text-xs text-foreground/50">
                  Feltöltve: {formatZonedHungarianDate(lightboxPhoto.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLightboxPhoto(null)}
                className="size-8 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-muted/80 text-lg font-bold"
                aria-label="Bezárás"
              >
                ×
              </button>
            </div>
            <div className="relative w-[85vw] max-w-4xl h-[70vh]">
              <Image
                src={lightboxPhoto.watermarkedUrl}
                alt={lightboxPhoto.title}
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

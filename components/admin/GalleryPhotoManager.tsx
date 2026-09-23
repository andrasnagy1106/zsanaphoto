"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition } from "react";
import { deleteGalleryPhotoAction, uploadGalleryPhotoAction } from "@/app/actions/admin-gallery-actions";
import type { GalleryPhoto } from "@/db/schema";
import { GALLERY_CATEGORIES, type GalleryCategory } from "@/lib/gallery-categories";

interface GalleryPhotoManagerProps {
  photosByCategory: Record<GalleryCategory, GalleryPhoto[]>;
}

export function GalleryPhotoManager({ photosByCategory }: GalleryPhotoManagerProps) {
  const router = useRouter();
  const fileInputId = useId();
  const captionInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedCategory, setSelectedCategory] = useState<GalleryCategory>(GALLERY_CATEGORIES[0]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [isUploading, startUploadTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const photosForCategory = photosByCategory[selectedCategory] ?? [];

  function handleUpload() {
    if (!selectedFile) {
      setErrorMessage("Válassz ki egy képfájlt.");
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append("category", selectedCategory);
    formData.append("file", selectedFile);
    if (caption.trim()) formData.append("caption", caption.trim());

    startUploadTransition(async () => {
      const result = await uploadGalleryPhotoAction(formData);
      if (result.success) {
        setSelectedFile(null);
        setCaption("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        setSuccessMessage("Kép sikeresen feltöltve a galériába!");
        router.refresh();
      } else {
        setErrorMessage(result.error ?? "A feltöltés nem sikerült.");
      }
    });
  }

  function handleDelete(photo: GalleryPhoto) {
    if (!window.confirm(`Biztosan törölni szeretnéd a(z) "${photo.caption}" képet a galériából?`)) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    startDeleteTransition(async () => {
      const result = await deleteGalleryPhotoAction(photo.id);
      if (result.success) {
        setSuccessMessage(`A(z) "${photo.caption}" kép sikeresen törölve.`);
        router.refresh();
      } else {
        setErrorMessage(result.error ?? "A törlés sikertelen.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-foreground">Új fotó feltöltése</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <label htmlFor={`${fileInputId}-category`} className="block text-xs font-semibold text-foreground mb-1.5">
              Kategória
            </label>
            <select
              id={`${fileInputId}-category`}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as GalleryCategory)}
              className="w-full min-h-11 rounded-md border border-border bg-white px-3 py-2 text-sm font-medium outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            >
              {GALLERY_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor={captionInputId} className="block text-xs font-semibold text-foreground mb-1.5">
              Felirat (opcionális)
            </label>
            <input
              id={captionInputId}
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="pl. Családi pillanatok"
              className="w-full min-h-11 rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label htmlFor={fileInputId} className="block text-xs font-semibold text-foreground mb-1.5">
              Képfájl
            </label>
            <input
              id={fileInputId}
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm file:mr-3 file:min-h-11 file:cursor-pointer file:rounded-md file:border-0 file:bg-accent file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white"
            />
          </div>
        </div>

        {errorMessage ? <p className="mt-3 text-sm text-red-600">{errorMessage}</p> : null}
        {successMessage ? <p className="mt-3 text-sm text-emerald-700">{successMessage}</p> : null}

        <button
          type="button"
          onClick={handleUpload}
          disabled={isUploading || !selectedFile}
          className="mt-4 inline-flex min-h-11 items-center rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
        >
          {isUploading ? "Feltöltés..." : "Kép feltöltése"}
        </button>
      </div>

      <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Galéria kategóriák">
          {GALLERY_CATEGORIES.map((category) => {
            const isSelected = category === selectedCategory;
            const count = photosByCategory[category]?.length ?? 0;

            return (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedCategory(category)}
                className={`min-h-11 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  isSelected
                    ? "border-accent bg-accent text-white"
                    : "border-border bg-white text-foreground hover:border-accent hover:text-accent"
                }`}
              >
                {category} ({count})
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          {photosForCategory.length === 0 ? (
            <p className="text-sm text-foreground/60">Ehhez a kategóriához még nincs feltöltve kép.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {photosForCategory.map((photo) => (
                <div key={photo.id} className="group relative overflow-hidden rounded-lg border border-border">
                  <div className="relative aspect-square bg-muted">
                    <Image src={photo.secureUrl} alt={photo.caption} fill sizes="25vw" className="object-cover" />
                  </div>
                  <p className="truncate px-2 py-1.5 text-xs text-foreground/70">{photo.caption}</p>
                  <button
                    type="button"
                    onClick={() => handleDelete(photo)}
                    disabled={isDeleting}
                    className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-white/90 text-red-600 opacity-0 shadow transition-opacity hover:bg-white group-hover:opacity-100 disabled:opacity-60"
                    aria-label={`${photo.caption} törlése`}
                    title="Kép törlése"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition } from "react";
import {
  deleteGalleryPhotoAction,
  moveGalleryPhotoAction,
  updateGalleryPhotoAction,
  uploadGalleryPhotoAction,
} from "@/app/actions/admin-gallery-actions";
import type { GalleryPhoto } from "@/db/schema";
import { prepareImageUpload } from "@/lib/utils/client-image-upload";
import { toObjectPosition } from "@/lib/utils/photo-layout";
import { PhotoEditDialog, type PhotoEditValues } from "@/components/admin/PhotoEditDialog";

export interface GalleryPhotoCollection {
  key: string;
  label: string;
}

interface GalleryPhotoManagerProps {
  collections: readonly GalleryPhotoCollection[];
  photosByCollection: Record<string, GalleryPhoto[]>;
  /** Frames the photos appear in publicly, shown as previews while aligning. */
  previewAspectClasses: string[];
}

export function GalleryPhotoManager({ collections, photosByCollection, previewAspectClasses }: GalleryPhotoManagerProps) {
  const router = useRouter();
  const fileInputId = useId();
  const captionInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedCollectionKey, setSelectedCollectionKey] = useState<string>(collections[0]?.key ?? "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [isPreparingFile, setIsPreparingFile] = useState(false);
  const [isUploading, startUploadTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isMoving, startMoveTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<GalleryPhoto | null>(null);

  const photosForCollection = photosByCollection[selectedCollectionKey] ?? [];

  function handleUpload() {
    if (!selectedFile) {
      setErrorMessage("Válassz ki egy képfájlt.");
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append("category", selectedCollectionKey);
    formData.append("file", selectedFile);
    if (caption.trim()) formData.append("caption", caption.trim());

    startUploadTransition(async () => {
      const result = await uploadGalleryPhotoAction(formData);
      if (result.success) {
        setSelectedFile(null);
        setCaption("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        setSuccessMessage("Kép sikeresen feltöltve!");
        router.refresh();
      } else {
        setErrorMessage(result.error ?? "A feltöltés nem sikerült.");
      }
    });
  }

  function getPhotoLabel(photo: GalleryPhoto): string {
    return photo.caption.trim() || "felirat nélküli";
  }

  function handleDelete(photo: GalleryPhoto) {
    if (!window.confirm(`Biztosan törölni szeretnéd a(z) "${getPhotoLabel(photo)}" képet?`)) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    startDeleteTransition(async () => {
      const result = await deleteGalleryPhotoAction(photo.id);
      if (result.success) {
        setSuccessMessage(`A(z) "${getPhotoLabel(photo)}" kép sikeresen törölve.`);
        router.refresh();
      } else {
        setErrorMessage(result.error ?? "A törlés sikertelen.");
      }
    });
  }

  function handleMove(photo: GalleryPhoto, direction: "up" | "down") {
    setErrorMessage(null);
    setSuccessMessage(null);

    startMoveTransition(async () => {
      const result = await moveGalleryPhotoAction(photo.id, direction);
      if (result.success) {
        router.refresh();
      } else {
        setErrorMessage(result.error ?? "A sorrend módosítása nem sikerült.");
      }
    });
  }

  async function handleSaveEdit(photo: GalleryPhoto, values: PhotoEditValues) {
    const result = await updateGalleryPhotoAction(photo.id, {
      caption: values.text,
      showCaption: values.showText,
      focusX: values.focusX,
      focusY: values.focusY,
    });
    if (result.success) {
      setSuccessMessage("A kép adatai elmentve.");
      router.refresh();
    }
    return result;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-foreground">Új fotó feltöltése</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <label htmlFor={`${fileInputId}-category`} className="block text-xs font-semibold text-foreground mb-1.5">
              Hova kerüljön?
            </label>
            <select
              id={`${fileInputId}-category`}
              value={selectedCollectionKey}
              onChange={(e) => setSelectedCollectionKey(e.target.value)}
              className="w-full min-h-11 rounded-md border border-border bg-white px-3 py-2 text-sm font-medium outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            >
              {collections.map((collection) => (
                <option key={collection.key} value={collection.key}>
                  {collection.label}
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
              onChange={async (e) => {
                const file = e.target.files?.[0] ?? null;
                if (!file) {
                  setSelectedFile(null);
                  return;
                }

                setErrorMessage(null);
                setIsPreparingFile(true);
                try {
                  const prepared = await prepareImageUpload(file);
                  setSelectedFile(prepared.file);
                  if (prepared.resized) {
                    setSuccessMessage("A kép automatikusan méretezve lett feltöltés előtt.");
                  }
                } catch (error) {
                  console.error("[GalleryPhotoManager] Failed to prepare upload file:", error);
                  setSelectedFile(null);
                  setErrorMessage("A kép előkészítése sikertelen volt.");
                } finally {
                  setIsPreparingFile(false);
                }
              }}
              className="w-full text-sm file:mr-3 file:min-h-11 file:cursor-pointer file:rounded-md file:border-0 file:bg-accent file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white"
            />
          </div>
        </div>

        {errorMessage ? <p className="mt-3 text-sm text-red-600">{errorMessage}</p> : null}
        {successMessage ? <p className="mt-3 text-sm text-emerald-700">{successMessage}</p> : null}

        <button
          type="button"
          onClick={handleUpload}
          disabled={isUploading || isPreparingFile || !selectedFile}
          className="mt-4 inline-flex min-h-11 items-center rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
        >
          {isPreparingFile ? "Előkészítés..." : isUploading ? "Feltöltés..." : "Kép feltöltése"}
        </button>
      </div>

      <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Képgyűjtemények">
          {collections.map((collection) => {
            const isSelected = collection.key === selectedCollectionKey;
            const count = photosByCollection[collection.key]?.length ?? 0;

            return (
              <button
                key={collection.key}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedCollectionKey(collection.key)}
                className={`min-h-11 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  isSelected
                    ? "border-accent bg-accent text-white"
                    : "border-border bg-white text-foreground hover:border-accent hover:text-accent"
                }`}
              >
                {collection.label} ({count})
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          {photosForCollection.length === 0 ? (
            <p className="text-sm text-foreground/60">Ide még nincs feltöltve kép.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {photosForCollection.map((photo, index) => (
                <div key={photo.id} className="group relative flex flex-col overflow-hidden rounded-lg border border-border">
                  <div className="relative aspect-square bg-muted">
                    <Image
                      src={photo.secureUrl}
                      alt={photo.caption}
                      fill
                      sizes="25vw"
                      className="object-contain"
                      style={{ objectPosition: toObjectPosition(photo.focusX, photo.focusY) }}
                    />
                    <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-foreground shadow">
                      {index + 1}.
                    </span>
                  </div>
                  <p className="truncate px-2 pt-1.5 text-xs text-foreground/70" title={photo.caption}>
                    {photo.caption.trim() ? photo.caption : <span className="italic text-foreground/40">Nincs felirat</span>}
                  </p>
                  {!photo.showCaption && photo.caption.trim() ? (
                    <p className="px-2 text-[11px] text-foreground/45">Felirat elrejtve</p>
                  ) : null}
                  <div className="mt-auto flex items-center justify-between gap-1 px-2 py-1.5">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleMove(photo, "up")}
                        disabled={isMoving || index === 0}
                        className="flex size-8 items-center justify-center rounded-md border border-border text-sm hover:border-accent hover:text-accent disabled:opacity-30"
                        aria-label="Előrébb helyezés"
                        title="Előrébb"
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(photo, "down")}
                        disabled={isMoving || index === photosForCollection.length - 1}
                        className="flex size-8 items-center justify-center rounded-md border border-border text-sm hover:border-accent hover:text-accent disabled:opacity-30"
                        aria-label="Hátrébb helyezés"
                        title="Hátrébb"
                      >
                        →
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingPhoto(photo)}
                      className="min-h-8 rounded-md px-2 text-xs font-semibold text-accent hover:underline"
                    >
                      Szerkesztés
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(photo)}
                    disabled={isDeleting}
                    className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-white/90 text-red-600 opacity-0 shadow transition-opacity hover:bg-white group-hover:opacity-100 focus-visible:opacity-100 disabled:opacity-60"
                    aria-label={`${getPhotoLabel(photo)} törlése`}
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

      {editingPhoto ? (
        <PhotoEditDialog
          heading="Kép szerkesztése"
          imageUrl={editingPhoto.secureUrl}
          previewAspectClasses={previewAspectClasses}
          initialValues={{
            text: editingPhoto.caption,
            showText: editingPhoto.showCaption,
            focusX: editingPhoto.focusX,
            focusY: editingPhoto.focusY,
          }}
          textField={{ label: "Felirat", placeholder: "pl. Családi pillanatok" }}
          showTextToggleLabel="Felirat megjelenítése a képen"
          onSave={(values) => handleSaveEdit(editingPhoto, values)}
          onClose={() => setEditingPhoto(null)}
        />
      ) : null}
    </div>
  );
}

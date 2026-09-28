"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition } from "react";
import { updateSitePhotoFocusAction, uploadHeroPhotoAction } from "@/app/actions/admin-settings-actions";
import { PhotoAlignButton } from "@/components/admin/PhotoAlignButton";
import type { SitePhotoView } from "@/lib/services/site-photo-service";
import { toObjectPosition } from "@/lib/utils/photo-layout";

interface HeroPhotoUploadFormProps {
  currentPhoto: SitePhotoView | null;
}

export function HeroPhotoUploadForm({ currentPhoto }: HeroPhotoUploadFormProps) {
  const router = useRouter();
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, startUploadTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function handleUpload() {
    if (!selectedFile) {
      setErrorMessage("Válassz ki egy képfájlt.");
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    startUploadTransition(async () => {
      const result = await uploadHeroPhotoAction(formData);
      if (result.success) {
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setSuccessMessage("Főoldali borítókép sikeresen frissítve!");
        router.refresh();
      } else {
        setErrorMessage(result.error ?? "A feltöltés nem sikerült.");
      }
    });
  }

  return (
    <div className="rounded-xl border border-border bg-white p-6">
      <h2 className="text-base font-semibold text-foreground">Főoldali Hero borítókép</h2>
      <p className="mt-1 text-xs text-foreground/60">
        Ez a nagy háttérkép jelenik meg a főoldal fejléc alatti &quot;Emlékek...&quot; fő szekciójában.
      </p>

      {currentPhoto ? (
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="relative aspect-[16/9] w-full max-w-sm overflow-hidden rounded-lg border border-border">
            <Image
              src={currentPhoto.url}
              alt="Jelenlegi Hero borítókép"
              fill
              sizes="384px"
              className="object-cover"
              style={{ objectPosition: toObjectPosition(currentPhoto.focusX, currentPhoto.focusY) }}
            />
          </div>
          <PhotoAlignButton
            imageUrl={currentPhoto.url}
            initialFocus={{ focusX: currentPhoto.focusX, focusY: currentPhoto.focusY }}
            previewAspectClasses={["aspect-[16/9]", "aspect-[3/4]"]}
            saveFocus={(focus) => updateSitePhotoFocusAction("hero", focus)}
          />
        </div>
      ) : (
        <p className="mt-4 text-xs text-foreground/50">Még nincs feltöltve egyedi kép, jelenleg helyőrző kép látszik.</p>
      )}

      <label htmlFor={fileInputId} className="mt-4 block text-xs font-semibold text-foreground">
        Új borítókép kiválasztása
      </label>
      <input
        id={fileInputId}
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
        className="mt-1.5 w-full text-sm file:mr-3 file:min-h-11 file:cursor-pointer file:rounded-md file:border-0 file:bg-accent file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white"
      />

      {errorMessage ? <p className="mt-3 text-sm text-red-600">{errorMessage}</p> : null}
      {successMessage ? <p className="mt-3 text-sm text-emerald-700">{successMessage}</p> : null}

      <button
        type="button"
        onClick={handleUpload}
        disabled={isUploading || !selectedFile}
        className="mt-4 inline-flex min-h-11 items-center rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
      >
        {isUploading ? "Feltöltés..." : "Borítókép cseréje"}
      </button>
    </div>
  );
}

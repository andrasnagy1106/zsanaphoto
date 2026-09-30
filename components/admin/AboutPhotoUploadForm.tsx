"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition } from "react";
import { updateAboutPhotoFocusAction, uploadAboutPhotoAction } from "@/app/actions/admin-settings-actions";
import { PhotoAlignButton } from "@/components/admin/PhotoAlignButton";
import { prepareImageUpload } from "@/lib/utils/client-image-upload";
import { toObjectPosition } from "@/lib/utils/photo-layout";

interface AboutPhotoUploadFormProps {
  currentPhotoUrl: string | null;
  focusX: number;
  focusY: number;
}

export function AboutPhotoUploadForm({ currentPhotoUrl, focusX, focusY }: AboutPhotoUploadFormProps) {
  const router = useRouter();
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPreparingFile, setIsPreparingFile] = useState(false);
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
      const result = await uploadAboutPhotoAction(formData);
      if (result.success) {
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setSuccessMessage("Fotó sikeresen frissítve!");
        router.refresh();
      } else {
        setErrorMessage(result.error ?? "A feltöltés nem sikerült.");
      }
    });
  }

  return (
    <div className="rounded-xl border border-border bg-white p-6">
      <h2 className="text-base font-semibold text-foreground">Főoldali &quot;Rólam&quot; fotó</h2>
      <p className="mt-1 text-xs text-foreground/60">
        Ez a fotó jelenik meg a főoldal &quot;A fotós, aki a pillanatot keresi&quot; szekciójában.
      </p>

      {currentPhotoUrl ? (
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="relative aspect-[4/5] w-40 overflow-hidden rounded-lg border border-border">
            <Image
              src={currentPhotoUrl}
              alt="Jelenlegi Rólam fotó"
              fill
              sizes="160px"
              className="object-cover"
              style={{ objectPosition: toObjectPosition(focusX, focusY) }}
            />
          </div>
          <PhotoAlignButton
            imageUrl={currentPhotoUrl}
            initialFocus={{ focusX, focusY }}
            previewAspectClasses={["aspect-[4/5]"]}
            saveFocus={updateAboutPhotoFocusAction}
          />
        </div>
      ) : (
        <p className="mt-4 text-xs text-foreground/50">Még nincs feltöltve fotó, jelenleg helyőrző kép látszik.</p>
      )}

      <label htmlFor={fileInputId} className="mt-4 block text-xs font-semibold text-foreground">
        Új fotó kiválasztása
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
            console.error("[AboutPhotoUploadForm] Failed to prepare upload file:", error);
            setSelectedFile(null);
            setErrorMessage("A kép előkészítése sikertelen volt.");
          } finally {
            setIsPreparingFile(false);
          }
        }}
        className="mt-1.5 w-full text-sm file:mr-3 file:min-h-11 file:cursor-pointer file:rounded-md file:border-0 file:bg-accent file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white"
      />

      {errorMessage ? <p className="mt-3 text-sm text-red-600">{errorMessage}</p> : null}
      {successMessage ? <p className="mt-3 text-sm text-emerald-700">{successMessage}</p> : null}

      <button
        type="button"
        onClick={handleUpload}
        disabled={isUploading || isPreparingFile || !selectedFile}
        className="mt-4 inline-flex min-h-11 items-center rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
      >
        {isPreparingFile ? "Előkészítés..." : isUploading ? "Feltöltés..." : "Fotó cseréje"}
      </button>
    </div>
  );
}

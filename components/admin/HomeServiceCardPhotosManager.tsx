"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition } from "react";
import { uploadHomeServiceCardPhotoAction } from "@/app/actions/admin-settings-actions";
import { HOME_SERVICE_CARDS } from "@/lib/home-service-cards";

interface HomeServiceCardPhotosManagerProps {
  photoUrlsByKey: Record<string, string | null>;
}

function CardPhotoRow({ cardKey, title, currentUrl }: { cardKey: string; title: string; currentUrl: string | null }) {
  const router = useRouter();
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, startUploadTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleUpload() {
    if (!selectedFile) {
      setErrorMessage("Válassz ki egy képfájlt.");
      return;
    }

    setErrorMessage(null);

    const formData = new FormData();
    formData.append("key", cardKey);
    formData.append("file", selectedFile);

    startUploadTransition(async () => {
      const result = await uploadHomeServiceCardPhotoAction(formData);
      if (result.success) {
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        router.refresh();
      } else {
        setErrorMessage(result.error ?? "A feltöltés nem sikerült.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center">
      <div className="relative aspect-[4/3] w-32 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
        {currentUrl ? (
          <Image src={currentUrl} alt={title} fill sizes="128px" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-foreground/40">Nincs kép</div>
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <input
          id={fileInputId}
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
          className="mt-2 w-full text-xs file:mr-3 file:min-h-9 file:cursor-pointer file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
        />
        {errorMessage ? <p className="mt-1 text-xs text-red-600">{errorMessage}</p> : null}
      </div>
      <button
        type="button"
        onClick={handleUpload}
        disabled={isUploading || !selectedFile}
        className="min-h-9 shrink-0 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
      >
        {isUploading ? "Feltöltés..." : "Csere"}
      </button>
    </div>
  );
}

export function HomeServiceCardPhotosManager({ photoUrlsByKey }: HomeServiceCardPhotosManagerProps) {
  return (
    <div className="rounded-xl border border-border bg-white p-6">
      <h2 className="text-base font-semibold text-foreground">Főoldali &quot;Miben segíthetek?&quot; kártyák fotói</h2>
      <p className="mt-1 text-xs text-foreground/60">
        Ezek a fotók jelennek meg a főoldali szolgáltatás-kártyákon.
      </p>

      <div className="mt-4 space-y-3">
        {HOME_SERVICE_CARDS.map((card) => (
          <CardPhotoRow key={card.key} cardKey={card.key} title={card.title} currentUrl={photoUrlsByKey[card.key] ?? null} />
        ))}
      </div>
    </div>
  );
}

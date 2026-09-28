"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PhotoEditDialog } from "@/components/admin/PhotoEditDialog";
import type { PhotoFocusInput } from "@/lib/validation/photo-edit";

interface PhotoAlignButtonProps {
  imageUrl: string;
  initialFocus: PhotoFocusInput;
  previewAspectClasses: string[];
  saveFocus: (focus: PhotoFocusInput) => Promise<{ success: boolean; error?: string }>;
}

/** Opens the photo alignment dialog for single site photos (hero, about, service cards). */
export function PhotoAlignButton({ imageUrl, initialFocus, previewAspectClasses, saveFocus }: PhotoAlignButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="min-h-9 rounded-full border border-accent px-4 py-1.5 text-xs font-semibold text-accent hover:bg-accent hover:text-white"
      >
        Keretbe igazítás
      </button>
      {isOpen ? (
        <PhotoEditDialog
          heading="Kép keretbe igazítása"
          imageUrl={imageUrl}
          previewAspectClasses={previewAspectClasses}
          initialValues={{ text: "", showText: true, ...initialFocus }}
          onSave={async ({ focusX, focusY }) => {
            const result = await saveFocus({ focusX, focusY });
            if (result.success) router.refresh();
            return result;
          }}
          onClose={() => setIsOpen(false)}
        />
      ) : null}
    </>
  );
}

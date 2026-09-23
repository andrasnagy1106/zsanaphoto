"use client";

import { useState } from "react";
import { GALLERY_CATEGORIES, PhotoGrid, type GalleryCategory } from "./PhotoGrid";
import { GALLERY_CATEGORY_DEFAULT_CAPTIONS } from "@/lib/gallery-categories";
import type { GalleryPhotoDisplay } from "@/lib/services/gallery-service";

interface GalleryBrowserProps {
  photosByCategory: Record<GalleryCategory, GalleryPhotoDisplay[]>;
}

export function GalleryBrowser({ photosByCategory }: GalleryBrowserProps) {
  const [selectedCategory, setSelectedCategory] = useState<GalleryCategory>(GALLERY_CATEGORIES[0]);

  const photosForCategory = photosByCategory[selectedCategory];
  const displayPhotos: GalleryPhotoDisplay[] =
    photosForCategory.length > 0
      ? photosForCategory
      : [{ category: selectedCategory, caption: GALLERY_CATEGORY_DEFAULT_CAPTIONS[selectedCategory], src: null }];

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Galéria kategóriák">
        {GALLERY_CATEGORIES.map((category) => {
          const isSelected = category === selectedCategory;

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
              {category}
            </button>
          );
        })}
      </div>

      <div className="mt-8" role="tabpanel">
        <PhotoGrid photos={displayPhotos} />
      </div>
    </div>
  );
}
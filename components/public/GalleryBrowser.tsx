"use client";

import { useState } from "react";
import { GALLERY_CATEGORIES, PhotoGrid, type GalleryCategory } from "./PhotoGrid";

export function GalleryBrowser() {
  const [selectedCategory, setSelectedCategory] = useState<GalleryCategory>(GALLERY_CATEGORIES[0]);

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
        <PhotoGrid category={selectedCategory} />
      </div>
    </div>
  );
}
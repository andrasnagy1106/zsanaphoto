import type { Metadata } from "next";
import { PhotoGrid } from "@/components/public/PhotoGrid";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "Galéria",
  description: "Válogatás családi és intézményi fotózásokból.",
};

export default function GalleryPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <SectionHeading eyebrow="Portfólió" title="Galéria" description="Válogatás korábbi fotózásokból." />
      <div className="mt-10">
        <PhotoGrid />
      </div>
    </div>
  );
}

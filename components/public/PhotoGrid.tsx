import { PhotoCard } from "./PhotoCard";

const REFERENCE_PHOTOS = [
  "Családi fotózás - kültéri",
  "Portré",
  "Testvérek",
  "Intézményi csoportkép",
  "Baba fotózás",
  "Családi fotózás - stúdió",
  "Óvodai fotózás",
  "Generációk",
];

export function PhotoGrid({ limit }: { limit?: number }) {
  const photos = limit ? REFERENCE_PHOTOS.slice(0, limit) : REFERENCE_PHOTOS;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {photos.map((caption, index) => (
        <PhotoCard key={caption} caption={caption} index={index} aspect={index % 3 === 0 ? "landscape" : "portrait"} />
      ))}
    </div>
  );
}

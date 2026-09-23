/**
 * Neutral, license-free filler images (picsum.photos) shown until real photography is uploaded.
 * Deterministic per seed, so the same section always shows the same placeholder across reloads.
 */
export function getPlaceholderImageUrl(seed: string, width: number, height: number): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${width}/${height}`;
}

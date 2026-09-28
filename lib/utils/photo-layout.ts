/** Converts a 0-100 focus point into a CSS `object-position` value for cropped (object-cover) images. */
export function toObjectPosition(focusX: number, focusY: number): string {
  return `${focusX}% ${focusY}%`;
}

/**
 * Returns the ids reordered after moving `id` one step up/down, or null when it can't move.
 * Pure helper so ordering logic is shared by gallery and event photo services.
 */
export function reorderIdsByMove(
  orderedIds: string[],
  id: string,
  direction: "up" | "down",
): string[] | null {
  const index = orderedIds.indexOf(id);
  if (index === -1) return null;
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= orderedIds.length) return null;

  const next = [...orderedIds];
  [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
  return next;
}

import { describe, expect, it } from "vitest";
import { reorderIdsByMove, toObjectPosition } from "./photo-layout";

describe("reorderIdsByMove", () => {
  it("swaps with the previous item when moving up", () => {
    expect(reorderIdsByMove(["a", "b", "c"], "b", "up")).toEqual(["b", "a", "c"]);
  });

  it("swaps with the next item when moving down", () => {
    expect(reorderIdsByMove(["a", "b", "c"], "b", "down")).toEqual(["a", "c", "b"]);
  });

  it("returns null at the list edges or for unknown ids", () => {
    expect(reorderIdsByMove(["a", "b"], "a", "up")).toBeNull();
    expect(reorderIdsByMove(["a", "b"], "b", "down")).toBeNull();
    expect(reorderIdsByMove(["a", "b"], "x", "up")).toBeNull();
  });
});

describe("toObjectPosition", () => {
  it("formats percentages", () => {
    expect(toObjectPosition(30, 70)).toBe("30% 70%");
  });
});

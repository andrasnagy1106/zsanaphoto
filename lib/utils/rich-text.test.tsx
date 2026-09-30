import { describe, expect, it } from "vitest";
import React from "react";
import { renderFormattedRichText } from "./rich-text";

describe("renderFormattedRichText", () => {
  it("returns null for empty text", () => {
    expect(renderFormattedRichText("")).toBeNull();
  });

  it("renders non-empty text node", () => {
    const result = renderFormattedRichText("Hello world");
    expect(result).not.toBeNull();
  });

  it("handles line breaks", () => {
    const result = renderFormattedRichText("Line 1\nLine 2");
    expect(result).not.toBeNull();
  });
});

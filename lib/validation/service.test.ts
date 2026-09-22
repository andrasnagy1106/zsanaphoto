import { describe, expect, it } from "vitest";
import { createServiceSchema, updateServiceSchema } from "./service";

describe("createServiceSchema", () => {
  it("validates valid service creation data", () => {
    const parsed = createServiceSchema.parse({
      name: "Karácsonyi fotózás",
      description: "Ünnepi hangulatú fotók",
      durationMinutes: 45,
      bufferMinutes: 10,
      approvalMode: "AUTO",
      availabilityMode: "CUSTOM",
      active: true,
    });

    expect(parsed.name).toBe("Karácsonyi fotózás");
    expect(parsed.durationMinutes).toBe(45);
    expect(parsed.availabilityMode).toBe("CUSTOM");
  });

  it("rejects invalid duration", () => {
    expect(
      createServiceSchema.safeParse({
        name: "Teszt",
        durationMinutes: 2,
      }).success,
    ).toBe(false);
  });
});

describe("updateServiceSchema", () => {
  it("validates valid update data", () => {
    const parsed = updateServiceSchema.parse({
      id: "service-123",
      name: "Módosított név",
      durationMinutes: 60,
      bufferMinutes: 15,
      approvalMode: "MANUAL",
      availabilityMode: "GLOBAL",
      active: false,
    });

    expect(parsed.id).toBe("service-123");
    expect(parsed.active).toBe(false);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateCustomerEmailAction } from "./admin-booking-actions";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  updateCustomerEmail: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/auth/guard", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/services/booking-service", () => ({ updateCustomerEmail: mocks.updateCustomerEmail }));

const input = {
  bookingId: "00000000-0000-4000-8000-000000000001",
  currentEmail: "old@example.com",
  email: "new@example.com",
  confirmEmail: "new@example.com",
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.requireAdmin.mockResolvedValue({ id: "admin-1" });
  mocks.updateCustomerEmail.mockResolvedValue(2);
});

describe("updateCustomerEmailAction", () => {
  it("requires an admin before processing input", async () => {
    mocks.requireAdmin.mockRejectedValue(new Error("Unauthorized"));
    await expect(updateCustomerEmailAction(input)).rejects.toThrow("Unauthorized");
    expect(mocks.updateCustomerEmail).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("returns validation errors without updating data", async () => {
    await expect(updateCustomerEmailAction({ ...input, confirmEmail: "wrong@example.com" }))
      .resolves.toEqual({ success: false, error: "A két e-mail cím nem egyezik." });
    expect(mocks.updateCustomerEmail).not.toHaveBeenCalled();
  });

  it("updates emails and invalidates all affected pages, but not admin settings", async () => {
    await expect(updateCustomerEmailAction(input)).resolves.toEqual({ success: true, updatedCount: 2 });
    expect(mocks.updateCustomerEmail).toHaveBeenCalledWith(input);
    expect(mocks.revalidatePath.mock.calls).toEqual([
      ["/admin/bookings"], ["/admin/bookings/[id]", "page"],
      ["/admin/event-photos"], ["/admin/photo-orders"],
      ["/foglalas-kezeles"], ["/fotorendeles"], ["/fotogaleria"],
    ]);
  });

  it("logs and reports service failures without invalidating pages", async () => {
    const error = new Error("Update failed");
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      mocks.updateCustomerEmail.mockRejectedValue(error);
      await expect(updateCustomerEmailAction(input)).resolves.toEqual({ success: false, error: "Update failed" });
      expect(log).toHaveBeenCalledWith("[updateCustomerEmailAction] Failed:", error);
      expect(mocks.revalidatePath).not.toHaveBeenCalled();
    } finally {
      log.mockRestore();
    }
  });
});

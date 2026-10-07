import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import { bookings, emailOutbox, eventPhotos, photoOrders } from "@/db/schema";
import { cancelBooking, createAdminEventUser, deleteBookingWithoutNotification } from "./booking-service";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(), select: vi.fn(), update: vi.fn(),
  deletePhotos: vi.fn(), getEmailProvider: vi.fn(), sendCancellation: vi.fn(),
  getSiteSettings: vi.fn(),
}));

vi.mock("@/db/client", () => ({ db: {
  transaction: mocks.transaction, select: mocks.select, update: mocks.update,
} }));
vi.mock("@/lib/providers/cloudinary/client", () => ({ deleteMultiplePhotosFromCloudinary: mocks.deletePhotos }));
vi.mock("@/lib/providers/email", () => ({ getEmailProvider: mocks.getEmailProvider }));
vi.mock("./availability-service", () => ({
  getSiteSettings: mocks.getSiteSettings,
  getAvailableSlotsForDate: vi.fn(), isSlotAvailable: vi.fn(),
}));

const booking = {
  id: "booking-1", bookingNumber: "ZS-2026-0002", status: "CONFIRMED",
  serviceId: "service-1", customerName: "Test Customer", customerEmail: "test@example.com",
  customerPhone: "123", startAt: new Date("2026-10-07T10:00:00Z"),
  endAt: new Date("2026-10-07T11:00:00Z"), pin: "AB12345" as string | null, notes: null,
};

function mockDeletionTransaction(rows = [booking]) {
  const deletedTables: unknown[] = [];
  const conditions: unknown[] = [];
  const tx = {
    select: vi.fn(() => ({ from: vi.fn((table) => ({ where: vi.fn(() => {
      if (table === bookings) return { for: vi.fn().mockResolvedValue(rows) };
      return Promise.resolve([{ publicId: "events/photo-1" }, { publicId: "events/photo-2" }]);
    }) })) })),
    delete: vi.fn((table) => ({ where: vi.fn((condition) => {
      deletedTables.push(table);
      conditions.push(condition);
      if (table === bookings) return { returning: async () => [{ id: booking.id }] };
      return Promise.resolve();
    }) })),
  };
  mocks.transaction.mockImplementation(async (callback) => callback(tx));
  return { tx, deletedTables, conditions };
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.deletePhotos.mockResolvedValue(undefined);
  mocks.getEmailProvider.mockReturnValue({ sendBookingCancelledEmail: mocks.sendCancellation });
  mocks.getSiteSettings.mockResolvedValue({ adminNotificationEmail: "admin@example.com" });
});

describe("deleteBookingWithoutNotification", () => {
  it.each(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"])("deletes %s bookings and related data without email", async (status) => {
    const { deletedTables, conditions } = mockDeletionTransaction([{ ...booking, status, pin: null }]);
    await deleteBookingWithoutNotification(booking.id);
    expect(mocks.deletePhotos).toHaveBeenCalledWith(["events/photo-1", "events/photo-2"]);
    expect(deletedTables).toEqual([emailOutbox, photoOrders, eventPhotos, bookings]);
    expect(mocks.getEmailProvider).not.toHaveBeenCalled();
    const query = new PgDialect().sqlToQuery(conditions[0] as Parameters<PgDialect["sqlToQuery"]>[0]);
    expect(query.params).toEqual([
      "\nFoglalási azonosító: ZS-2026-0002\n", "Új foglalás érkezett - ZS-2026-0002",
    ]);
    expect(query.sql).not.toContain("to_address");
  });

  it("preserves booking records on a Cloudinary error and propagates failure for transaction rollback", async () => {
    const { deletedTables } = mockDeletionTransaction();
    mocks.deletePhotos.mockRejectedValue(new Error("Cloudinary unavailable"));
    await expect(deleteBookingWithoutNotification(booking.id)).rejects.toThrow("Cloudinary unavailable");
    expect(deletedTables).toEqual([emailOutbox]);
    expect(mocks.getEmailProvider).not.toHaveBeenCalled();
  });

  it("rejects an unknown booking without deleting anything", async () => {
    const { deletedTables } = mockDeletionTransaction([]);
    await expect(deleteBookingWithoutNotification("missing")).rejects.toThrow("A foglalás nem található.");
    expect(deletedTables).toEqual([]);
    expect(mocks.deletePhotos).not.toHaveBeenCalled();
  });

  it("reports a database delete that returned no booking row", async () => {
    const { tx } = mockDeletionTransaction();
    tx.delete.mockImplementation((table) => ({ where: vi.fn(() => {
      if (table === bookings) return { returning: async () => [] };
      return Promise.resolve();
    }) }));
    await expect(deleteBookingWithoutNotification(booking.id)).rejects.toThrow("adatbázisból való törlése nem sikerült");
  });
});

describe("cancelBooking", () => {
  it("still sends the cancellation email to the customer", async () => {
    mocks.select.mockImplementation(() => ({ from: (table: unknown) => ({
      where: () => ({ limit: async () => table === bookings ? [booking] : [{ name: "Photo session", approvalMode: "AUTO" }] }),
    }) }));
    mocks.update.mockReturnValue({ set: () => ({ where: () => ({
      returning: async () => [{ ...booking, status: "CANCELLED", pin: null }],
    }) }) });
    await cancelBooking(booking.id);
    expect(mocks.sendCancellation).toHaveBeenCalledWith(expect.objectContaining({
      bookingNumber: booking.bookingNumber, customerEmail: booking.customerEmail,
    }));
    expect(mocks.deletePhotos).not.toHaveBeenCalled();
  });
});

describe("booking numbering after deletion", () => {
  it("uses the highest remaining sequence instead of the remaining row count", async () => {
    mocks.select.mockReturnValue({ from: () => ({ where: () => ({ limit: async () => [{
      id: "service-1", durationMinutes: 60, approvalMode: "AUTO",
    }] }) }) });
    const values = vi.fn().mockReturnValue({ returning: async () => [booking] });
    const select = vi.fn().mockReturnValue({ from: async () => [{ lastSequence: 8 }] });
    mocks.transaction.mockImplementation(async (callback) => callback({ select, insert: () => ({ values }) }));
    await createAdminEventUser({
      serviceId: "service-1", customerName: "Test", customerEmail: "test@example.com",
      startAt: new Date("2026-10-07T10:00:00Z"), sendEmail: false,
    });
    expect(values).toHaveBeenCalledWith(expect.objectContaining({ bookingNumber: "ZS-2026-0009" }));
    const query = new PgDialect().sqlToQuery(select.mock.calls[0][0].lastSequence);
    expect(query.sql).toContain("max(substring");
    expect(query.params).toEqual(["^ZS-2026-([0-9]+)"]);
    expect(mocks.getEmailProvider).not.toHaveBeenCalled();
  });
});
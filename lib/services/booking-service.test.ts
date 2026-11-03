import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import { bookings, emailOutbox, eventPhotos, photoOrders } from "@/db/schema";
import { cancelBooking, createAdminEventUser, deleteBookingWithoutNotification, deleteBookingsWithoutNotification, updateCustomerEmail } from "./booking-service";

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

function mockDeletionTransaction(rows = [booking], deletedRows = rows) {
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
      if (table === bookings) return { returning: async () => deletedRows.map(({ id }) => ({ id })) };
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

describe("updateCustomerEmail", () => {
  const input = {
    bookingId: "00000000-0000-4000-8000-000000000001",
    currentEmail: "test@example.com",
    email: "new@example.com",
    confirmEmail: "new@example.com",
  };
  const source = { ...booking, id: input.bookingId, customerEmail: " Test@Example.com " };
  const other = { ...source, id: "booking-2", bookingNumber: "ZS-2026-0003", pin: null };

  function mockEmailTransaction(rows = [source, other], selected = [source]) {
    const returning = vi.fn().mockResolvedValue(rows);
    const queueWhere = vi.fn().mockResolvedValue(undefined);
    const bookingWhere = vi.fn().mockReturnValue({ returning });
    const bookingSet = vi.fn(() => ({ where: bookingWhere }));
    const queueSet = vi.fn(() => ({ where: queueWhere }));
    const tx = {
      select: vi.fn(() => ({ from: () => ({ where: () => ({ limit: async () => selected }) }) })),
      update: vi.fn((table) => ({ set: table === bookings ? bookingSet : queueSet })),
    };
    mocks.transaction.mockImplementation(async (callback) => callback(tx));
    return { tx, bookingSet, bookingWhere, queueSet, queueWhere };
  }

  it("updates all matching bookings and queued customer emails in one transaction without notifications", async () => {
    const { tx, bookingSet, bookingWhere, queueSet, queueWhere } = mockEmailTransaction();
    await expect(updateCustomerEmail(input)).resolves.toBe(2);
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(tx.update.mock.calls.map(([table]) => table)).toEqual([bookings, emailOutbox]);
    expect(bookingSet).toHaveBeenCalledWith({ customerEmail: input.email, updatedAt: expect.any(Date) });
    expect(queueSet).toHaveBeenCalledWith({ toAddress: input.email, updatedAt: expect.any(Date) });
    const dialect = new PgDialect();
    const bookingQuery = dialect.sqlToQuery(bookingWhere.mock.calls[0][0]);
    expect(bookingQuery.sql).toContain('lower(trim("bookings"."customer_email"))');
    expect(bookingQuery.sql).not.toContain('"id"');
    expect(bookingQuery.params).toEqual([input.currentEmail]);

    const queueQuery = dialect.sqlToQuery(queueWhere.mock.calls[0][0]);
    expect(queueQuery.sql).toContain('"email_outbox"."status" =');
    expect(queueQuery.sql).toContain('lower(trim("email_outbox"."to_address"))');
    expect(queueQuery.sql).toContain('"email_outbox"."body" like');
    expect(queueQuery.params).toEqual([
      "QUEUED", input.currentEmail, "Kedves %",
      "\nFoglalási azonosító: ZS-2026-0002\n", "\nBelépési PIN-kód: AB12345\n",
      "\nFoglalási azonosító: ZS-2026-0003\n",
    ]);
    expect(mocks.getEmailProvider).not.toHaveBeenCalled();
    expect(mocks.getSiteSettings).not.toHaveBeenCalled();
  });

  it("rejects an unknown booking without updating data", async () => {
    const { tx } = mockEmailTransaction([], []);
    await expect(updateCustomerEmail(input)).rejects.toThrow("A foglalás nem található.");
    expect(tx.update).not.toHaveBeenCalled();
  });

  it("rejects stale forms without updating data", async () => {
    const { tx } = mockEmailTransaction([source], [{ ...source, customerEmail: "changed@example.com" }]);
    await expect(updateCustomerEmail(input)).rejects.toThrow("időközben megváltozott");
    expect(tx.update).not.toHaveBeenCalled();
  });

  it("rolls back if the booking changed between reading and updating", async () => {
    const { queueSet } = mockEmailTransaction([other]);
    await expect(updateCustomerEmail(input)).rejects.toThrow("időközben megváltoztak");
    expect(queueSet).not.toHaveBeenCalled();
  });

  it("propagates outbox errors so booking changes roll back", async () => {
    const { queueWhere } = mockEmailTransaction();
    queueWhere.mockRejectedValue(new Error("Outbox unavailable"));
    await expect(updateCustomerEmail(input)).rejects.toThrow("Outbox unavailable");
  });

  it("rejects mismatching emails before starting a transaction", async () => {
    await expect(updateCustomerEmail({ ...input, confirmEmail: "other@example.com" })).rejects.toThrow();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
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
    await expect(deleteBookingWithoutNotification("missing")).rejects.toThrow("A kijelölt foglalások egy része már nem található");
    expect(deletedTables).toEqual([]);
    expect(mocks.deletePhotos).not.toHaveBeenCalled();
  });

  it("reports a database delete that returned no booking row", async () => {
    mockDeletionTransaction([booking], []);
    await expect(deleteBookingWithoutNotification(booking.id)).rejects.toThrow("Nem sikerült minden kijelölt foglalást törölni");
  });

  it("bulk deletes selected bookings and related photos without email", async () => {
    const secondBooking = { ...booking, id: "booking-2", bookingNumber: "ZS-2026-0003" };
    const { deletedTables, conditions } = mockDeletionTransaction([booking, secondBooking]);
    await expect(deleteBookingsWithoutNotification([booking.id, secondBooking.id])).resolves.toBe(2);
    expect(mocks.deletePhotos).toHaveBeenCalledWith(["events/photo-1", "events/photo-2"]);
    expect(deletedTables).toEqual([emailOutbox, photoOrders, eventPhotos, bookings]);
    const query = new PgDialect().sqlToQuery(conditions[0] as Parameters<PgDialect["sqlToQuery"]>[0]);
    expect(query.params).toContain("\nFoglalási azonosító: ZS-2026-0002\n");
    expect(query.params).toContain("\nFoglalási azonosító: ZS-2026-0003\n");
    expect(mocks.getEmailProvider).not.toHaveBeenCalled();
  });

  it("rejects a stale bulk selection without deleting any associated data", async () => {
    const { deletedTables } = mockDeletionTransaction([booking]);
    await expect(deleteBookingsWithoutNotification([booking.id, "booking-missing"]))
      .rejects.toThrow("egy része már nem található");
    expect(deletedTables).toEqual([]);
    expect(mocks.deletePhotos).not.toHaveBeenCalled();
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
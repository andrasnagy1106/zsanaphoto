import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import { bookings, emailOutbox } from "@/db/schema";
import { getPaymentInformationForBooking } from "./payment-information-service";
import {
  resendPhotoReadyEmail,
  savePhotoOrderDeadlineForBooking,
  sendPhotoReadyEmailToBooking,
  sendPhotoReadyEmailsForEvent,
} from "./photo-notification-service";

const mocks = vi.hoisted(() => ({
  select: vi.fn(), insert: vi.fn(), update: vi.fn(), transaction: vi.fn(), send: vi.fn(), sleep: vi.fn(),
}));
vi.mock("@/lib/utils/sleep", () => ({ sleep: mocks.sleep }));
vi.mock("@/db/client", () => ({ db: {
  select: mocks.select, insert: mocks.insert, update: mocks.update, transaction: mocks.transaction,
} }));
vi.mock("@/lib/providers/email", () => ({ getEmailProvider: () => ({ sendPhotoReadyEmail: mocks.send }) }));

const booking = {
  id: "booking-1", serviceId: "service-1", customerName: "Anna", customerEmail: "anna@example.com",
  childName: "Ádám", bookingNumber: "ZS-1", pin: "AB12345",
  startAt: new Date("2026-11-01T23:30:00Z"),
};
const service = { id: "service-1", name: "Óvoda", paymentInformation: "Alapértelmezés", includePaymentInformation: true };
const notice = { orderDeadline: "2026-11-10", paymentDeadline: null, paymentInformation: "Az óvoda szedi be." };

function selectRows(rows: unknown[]) {
  const query = {
    from: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(), leftJoin: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows), groupBy: vi.fn().mockResolvedValue(rows),
  };
  mocks.select.mockReturnValueOnce(query);
  return query;
}

beforeEach(() => vi.resetAllMocks());

describe("photo event payment settings", () => {
  it("persists both deadlines and a custom text on the shared Budapest event date", async () => {
    selectRows([booking]);
    const upsert = vi.fn().mockResolvedValue(undefined);
    const values = vi.fn().mockReturnValue({ onConflictDoUpdate: upsert });
    mocks.insert.mockReturnValue({ values });

    await savePhotoOrderDeadlineForBooking(booking.id, notice.orderDeadline, null, notice.paymentInformation);
    expect(values).toHaveBeenCalledWith({
      serviceId: booking.serviceId, eventDate: "2026-11-02", ...notice,
    });
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      set: expect.objectContaining(notice),
    }));
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("fails explicitly when the selected booking no longer exists", async () => {
    selectRows([]);
    await expect(savePhotoOrderDeadlineForBooking("missing", null, null, null)).rejects.toThrow("nem található");
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("sends the same resolved payment settings that the order page and confirmation use", async () => {
    selectRows([notice]);
    const resolved = await getPaymentInformationForBooking(booking, service);
    expect(resolved).toEqual(notice);

    selectRows([{ booking, service }]);
    selectRows([notice]);
    selectRows([{ booking, photoCount: 2 }]);
    mocks.send.mockResolvedValue(undefined);
    mocks.update.mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) });
    expect(await sendPhotoReadyEmailsForEvent(booking.id)).toEqual({ sent: 1, failed: 0, total: 1, skipped: 0 });
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({
      paymentInformation: notice.paymentInformation, paymentDeadline: null,
      orderDeadline: notice.orderDeadline, pin: booking.pin,
    }));
  });

  it("inherits the service default when the event override is reset", async () => {
    selectRows([{ ...notice, paymentInformation: null, paymentDeadline: "2026-11-20" }]);
    expect(await getPaymentInformationForBooking(booking, service)).toEqual({
      orderDeadline: notice.orderDeadline, paymentInformation: service.paymentInformation,
      paymentDeadline: "2026-11-20",
    });
  });
});

describe("sendPhotoReadyEmailToBooking", () => {
  it("sends only to the selected booking and records its notification", async () => {
    selectRows([{ booking, service }]);
    selectRows([notice]);
    selectRows([{ id: "photo-1" }]);
    mocks.send.mockResolvedValue(undefined);
    const set = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
    mocks.update.mockReturnValue({ set });

    await sendPhotoReadyEmailToBooking(booking.id);

    expect(mocks.send).toHaveBeenCalledOnce();
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({
      customerEmail: booking.customerEmail,
      pin: booking.pin,
    }));
    expect(set).toHaveBeenCalledWith(expect.objectContaining({
      photoReadyEmailSentAt: expect.any(Date),
    }));
  });

  it("does not send when the selected booking has no uploaded photo", async () => {
    selectRows([{ booking, service }]);
    selectRows([notice]);
    selectRows([]);

    await expect(sendPhotoReadyEmailToBooking(booking.id)).rejects.toThrow("még nincs feltöltött kép");
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
});

describe("sendPhotoReadyEmailsForEvent modes", () => {
  const notified = { ...booking, id: "booking-2", bookingNumber: "ZS-2", pin: "CD12345", photoReadyEmailSentAt: new Date("2026-11-03T10:00:00Z") };
  const failedBefore = { ...booking, photoReadyEmailSentAt: null };

  function mockEvent(recipients: unknown[]) {
    selectRows([{ booking: failedBefore, service }]);
    selectRows([notice]);
    selectRows(recipients);
    mocks.update.mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) });
  }

  it("sends only to parents without a recorded email by default", async () => {
    mockEvent([{ booking: failedBefore, photoCount: 2 }, { booking: notified, photoCount: 1 }]);
    mocks.send.mockResolvedValue(undefined);
    expect(await sendPhotoReadyEmailsForEvent(booking.id)).toEqual({ sent: 1, failed: 0, total: 1, skipped: 1 });
    expect(mocks.send).toHaveBeenCalledTimes(1);
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ pin: failedBefore.pin }));
  });

  describe("resendPhotoReadyEmail", () => {
    const input = {
      bookingId: "00000000-0000-4000-8000-000000000001",
      currentEmail: "anna@example.com",
      email: "new@example.com",
      confirmEmail: "new@example.com",
    };
    const recipient = { ...booking, id: input.bookingId };

    function setup(queued: Array<{ id: string; subject: string; body: string }> = [], updated = true) {
      selectRows([{ booking: recipient, service }]);
      selectRows([notice]);
      selectRows([{ id: "photo-1" }]);
      const bookingWhere = vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue(updated ? [{ id: input.bookingId }] : []) });
      const queueWhere = vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue(queued) });
      const extraUpdates: Array<{ table: unknown; values: unknown }> = [];
      let updateCount = 0;
      const tx = {
        update: vi.fn((table) => ({
          set: vi.fn((values) => {
            updateCount += 1;
            if (updateCount === 1) return { where: bookingWhere };
            if (updateCount === 2) return { where: queueWhere };
            extraUpdates.push({ table, values });
            return { where: vi.fn().mockResolvedValue(undefined) };
          }),
        })),
      };
      mocks.transaction.mockImplementation(async (callback) => callback(tx));
      mocks.update.mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) });
      mocks.send.mockResolvedValue(undefined);
      return { tx, bookingWhere, queueWhere, extraUpdates };
    }

    it("updates only the selected booking and sends its notification to the corrected address", async () => {
      const { bookingWhere, queueWhere } = setup();
      await expect(resendPhotoReadyEmail(input)).resolves.toBe("started");
      const bookingQuery = new PgDialect().sqlToQuery(bookingWhere.mock.calls[0][0]);
      expect(bookingQuery.params).toEqual([input.bookingId, input.currentEmail, booking.pin]);
      const queueQuery = new PgDialect().sqlToQuery(queueWhere.mock.calls[0][0]);
      expect(queueQuery.params).toEqual([
        "QUEUED", input.currentEmail, "Kedves %",
        `\nFoglalási azonosító: ${booking.bookingNumber}\n`, `\nBelépési PIN-kód: ${booking.pin}\n`,
      ]);
      expect(mocks.send).toHaveBeenCalledOnce();
      expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ customerEmail: input.email, pin: booking.pin }));
    });

    it("updates an existing queued photo notification instead of sending a duplicate", async () => {
      const { extraUpdates } = setup([{
        id: "queued-1", subject: "Elkészültek a fotók - ZsaNa Photo",
        body: `Kedves Anna!\n\nBelépési PIN-kód: ${booking.pin}\n`,
      }]);
      await expect(resendPhotoReadyEmail(input)).resolves.toBe("queued");
      expect(mocks.send).not.toHaveBeenCalled();
      expect(extraUpdates).toEqual([
        { table: emailOutbox, values: expect.objectContaining({ body: expect.stringContaining(booking.pin) }) },
        { table: bookings, values: expect.objectContaining({ photoReadyEmailSentAt: expect.any(Date) }) },
      ]);
    });

    it("does not suppress the resend for another queued email type", async () => {
      setup([{ id: "queued-1", subject: "Más értesítés", body: `Kedves Anna!\nBelépési PIN-kód: ${booking.pin}\n` }]);
      await expect(resendPhotoReadyEmail(input)).resolves.toBe("started");
      expect(mocks.send).toHaveBeenCalledOnce();
    });

    it("rejects stale addresses before changing the queue or sending", async () => {
      const { queueWhere } = setup([], false);
      await expect(resendPhotoReadyEmail(input)).rejects.toThrow("időközben megváltoztak");
      expect(queueWhere).not.toHaveBeenCalled();
      expect(mocks.send).not.toHaveBeenCalled();
    });

    it("allows correcting a legacy invalid stored address", async () => {
      setup();
      await expect(resendPhotoReadyEmail({ ...input, currentEmail: "old-invalid-address" })).resolves.toBe("started");
      expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ customerEmail: input.email }));
    });

    it("refuses to change an address when the recipient has no photos", async () => {
      selectRows([{ booking: recipient, service }]);
      selectRows([notice]);
      selectRows([]);
      await expect(resendPhotoReadyEmail(input)).rejects.toThrow("még nincs feltöltött kép");
      expect(mocks.transaction).not.toHaveBeenCalled();
      expect(mocks.send).not.toHaveBeenCalled();
    });

    it("reports that the address was saved if sending fails", async () => {
      setup();
      mocks.send.mockRejectedValue(new Error("Resend error"));
      const log = vi.spyOn(console, "error").mockImplementation(() => {});
      try {
        await expect(resendPhotoReadyEmail(input)).rejects.toThrow("cím elmentve, de");
      } finally {
        log.mockRestore();
      }
    });

    it("rejects mismatched confirmation without changing anything", async () => {
      await expect(resendPhotoReadyEmail({ ...input, confirmEmail: "other@example.com" })).rejects.toThrow("nem egyezik");
      expect(mocks.select).not.toHaveBeenCalled();
    });
  });

  it("resends to every parent in ALL mode", async () => {
    mockEvent([{ booking: failedBefore, photoCount: 2 }, { booking: notified, photoCount: 1 }]);
    mocks.send.mockResolvedValue(undefined);
    expect(await sendPhotoReadyEmailsForEvent(booking.id, "ALL")).toEqual({ sent: 2, failed: 0, total: 2, skipped: 0 });
    expect(mocks.send.mock.calls.map(([input]) => input.pin)).toEqual([failedBefore.pin, notified.pin]);
    expect(mocks.sleep.mock.calls).toEqual([[600]]);
  });

  it("does not pause before a single email", async () => {
    mockEvent([{ booking: failedBefore, photoCount: 2 }, { booking: notified, photoCount: 1 }]);
    mocks.send.mockResolvedValue(undefined);
    await sendPhotoReadyEmailsForEvent(booking.id);
    expect(mocks.sleep).not.toHaveBeenCalled();
  });

  it("refuses an UNSENT send when everyone was already notified", async () => {
    mockEvent([{ booking: notified, photoCount: 1 }]);
    await expect(sendPhotoReadyEmailsForEvent(booking.id)).rejects.toThrow("Minden szülő megkapta már");
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("keeps failed recipients unmarked so a later UNSENT send retries them", async () => {
    const second = { ...failedBefore, id: "booking-3", bookingNumber: "ZS-3", pin: "EF12345" };
    mockEvent([{ booking: failedBefore, photoCount: 2 }, { booking: second, photoCount: 1 }]);
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      mocks.send.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("rate limited"));
      expect(await sendPhotoReadyEmailsForEvent(booking.id)).toEqual({ sent: 1, failed: 1, total: 2, skipped: 0 });
      expect(mocks.update).toHaveBeenCalledTimes(1);
    } finally {
      log.mockRestore();
    }
  });
});

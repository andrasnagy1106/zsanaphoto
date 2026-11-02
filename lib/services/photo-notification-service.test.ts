import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPaymentInformationForBooking } from "./payment-information-service";
import { savePhotoOrderDeadlineForBooking, sendPhotoReadyEmailsForEvent } from "./photo-notification-service";

const mocks = vi.hoisted(() => ({
  select: vi.fn(), insert: vi.fn(), update: vi.fn(), send: vi.fn(),
}));
vi.mock("@/db/client", () => ({ db: {
  select: mocks.select, insert: mocks.insert, update: mocks.update,
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
    expect(await sendPhotoReadyEmailsForEvent(booking.id)).toEqual({ sent: 1, failed: 0, total: 1 });
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

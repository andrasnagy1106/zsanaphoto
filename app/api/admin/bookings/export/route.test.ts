import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { Booking } from "@/db/schema";
import { GET } from "./route";

const mocks = vi.hoisted(() => ({
  getCurrentAdmin: vi.fn(),
  listBookings: vi.fn(),
  listServices: vi.fn(),
}));

vi.mock("@/lib/auth/guard", () => ({
  getCurrentAdmin: mocks.getCurrentAdmin,
}));
vi.mock("@/lib/services/booking-service", () => ({
  listBookings: mocks.listBookings,
}));
vi.mock("@/lib/services/service-service", () => ({
  listServices: mocks.listServices,
}));

const booking: Booking = {
  id: "booking-1",
  bookingNumber: "ZS-2026-0001",
  pin: "AB12345",
  manageToken: "manage-token",
  serviceId: "service-1",
  customerName: "Teszt Szülő",
  childName: "Árvíztűrő Anna",
  customerEmail: "test@example.com",
  customerPhone: "+36301234567",
  photoPublicationConsent: true,
  customerPhotoViewMode: "ORDER_ONLY",
  showPhotoTitles: false,
  photoReadyEmailSentAt: null,
  startAt: new Date("2026-11-05T09:00:00Z"),
  endAt: new Date("2026-11-05T10:00:00Z"),
  status: "CONFIRMED",
  notes: null,
  confirmedAt: null,
  cancelledAt: null,
  createdAt: new Date("2026-11-01T08:00:00Z"),
  updatedAt: new Date("2026-11-01T08:00:00Z"),
};

const expectedHeader = [
  "Foglalási azonosító", "PIN", "Ügyfél neve", "E-mail", "Telefonszám",
  "Online képmegjelenési hozzájárulás", "Szolgáltatás", "Dátum", "Kezdés",
  "Vége", "Státusz", "Megjegyzés", "Létrehozva", "Jóváhagyva", "Lemondva",
  "Gyermek neve",
].join(";");

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getCurrentAdmin.mockResolvedValue({ id: "admin-1" });
  mocks.listBookings.mockResolvedValue([booking]);
  mocks.listServices.mockResolvedValue([{ id: "service-1", name: "Fotózás" }]);
});

describe("booking CSV export", () => {
  it("exports all requested fields while preserving existing columns and Excel encoding", async () => {
    const response = await GET(new NextRequest("http://localhost/api/admin/bookings/export"));
    const bytes = new Uint8Array(await response.arrayBuffer());

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("Content-Disposition")).toMatch(
      /^attachment; filename="foglalasok-\d{4}-\d{2}-\d{2}\.csv"$/,
    );
    expect(response.headers.get("Cache-Control")).toBe("no-store, max-age=0");
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(new TextDecoder().decode(bytes)).toBe(
      expectedHeader + "\r\n" + [
        "ZS-2026-0001", "AB12345", "Teszt Szülő", "test@example.com",
        "+36301234567", "Hozzájárult", "Fotózás", "2026. november 5.",
        "10:00", "11:00", "Megerősítve", "", "2026. november 1. 09:00",
        "", "", "Árvíztűrő Anna",
      ].join(";"),
    );
  });

  it.each([
    [null, ""],
    ["", ""],
    ["Anna; Béla", '"Anna; Béla"'],
    ['Anna "Baba"', '"Anna ""Baba"""'],
    ["Anna\nBéla", '"Anna\nBéla"'],
    ["Anna\r\nBéla", '"Anna\r\nBéla"'],
  ])("exports child name %j with correct CSV escaping", async (childName, expected) => {
    mocks.listBookings.mockResolvedValue([{ ...booking, childName }]);
    const response = await GET(new NextRequest("http://localhost/api/admin/bookings/export"));
    const text = await response.text();

    expect(text).toContain(expectedHeader + "\r\n");
    expect(text.slice(text.indexOf("\r\n") + 2)).toBe(
      [
        "ZS-2026-0001", "AB12345", "Teszt Szülő", "test@example.com",
        "+36301234567", "Hozzájárult", "Fotózás", "2026. november 5.",
        "10:00", "11:00", "Megerősítve", "", "2026. november 1. 09:00",
        "", "", expected,
      ].join(";"),
    );
  });

  it("preserves active filters and sorting", async () => {
    await GET(new NextRequest(
      "http://localhost/api/admin/bookings/export?status=CONFIRMED&serviceId=service-1&fromDate=2026-11-01&toDate=2026-11-30&sortBy=customerName-asc",
    ));

    expect(mocks.listBookings).toHaveBeenCalledWith({
      status: "CONFIRMED",
      serviceId: "service-1",
      fromDate: "2026-11-01",
      toDate: "2026-11-30",
      sortBy: "customerName-asc",
    });
  });

  it("exports the headers when no bookings match", async () => {
    mocks.listBookings.mockResolvedValue([]);
    const response = await GET(new NextRequest("http://localhost/api/admin/bookings/export"));
    expect(await response.text()).toBe(expectedHeader);
  });

  it("rejects unauthenticated requests without loading booking data", async () => {
    mocks.getCurrentAdmin.mockResolvedValue(null);
    const response = await GET(new NextRequest("http://localhost/api/admin/bookings/export"));

    expect(response.status).toBe(401);
    expect(mocks.listBookings).not.toHaveBeenCalled();
    expect(mocks.listServices).not.toHaveBeenCalled();
  });
});

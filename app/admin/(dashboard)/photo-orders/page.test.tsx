import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listPhotoOrders: vi.fn(),
  listServices: vi.fn(),
  printButton: vi.fn(),
}));

vi.mock("@/lib/services/photo-order-service", () => ({ listPhotoOrders: mocks.listPhotoOrders }));
vi.mock("@/lib/services/service-service", () => ({ listServices: mocks.listServices }));
vi.mock("@/components/admin/AdminTable", () => ({ AdminTable: () => null }));
vi.mock("@/components/admin/PhotoOrderStatusControl", () => ({ PhotoOrderStatusControl: () => null }));
vi.mock("@/components/admin/PhotoOrdersPrintButton", () => ({
  PhotoOrdersPrintButton: (props: unknown) => {
    mocks.printButton(props);
    return null;
  },
}));

import AdminPhotoOrdersPage from "./page";

describe("filtered photo order printing", () => {
  it("passes the applied filters and their returned orders to the print button", async () => {
    const item = {
      id: "item-1", photoId: "photo-1", photoTitle: "Tesztfotó",
      size: "10x15 cm", quantity: 2, unitPrice: 600, totalPrice: 1200,
    };
    const order = {
      orderNumber: "ZR-TEST", notes: null, totalAmount: 1200,
      billingName: "Teszt Ügyfél", billingPostalCode: "1000",
      billingCity: "Budapest", billingAddress: "Teszt utca 1", includesDigital: false,
    };
    mocks.listPhotoOrders.mockResolvedValue([{
      order,
      booking: {
        customerName: "Teszt Ügyfél", childName: "Teszt Lili",
        bookingNumber: "ZS-TEST", photoPublicationConsent: null,
      },
      items: [item],
    }]);
    mocks.listServices.mockResolvedValue([]);

    renderToStaticMarkup(await AdminPhotoOrdersPage({
      searchParams: Promise.resolve({ status: "NEW", serviceId: "event-test" }),
    }));

    expect(mocks.listPhotoOrders).toHaveBeenCalledWith({ status: "NEW", serviceId: "event-test" });
    expect(mocks.printButton).toHaveBeenCalledWith({
      orders: [{
        order, customerName: "Teszt Ügyfél", childName: "Teszt Lili", bookingNumber: "ZS-TEST",
        photoPublicationConsent: null, items: [item],
      }],
    });
  });
});

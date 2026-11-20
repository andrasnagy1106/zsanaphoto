import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PhotoOrderDetailsDialog, PhotoOrderPrintContent } from "@/components/admin/PhotoOrderDetailsDialog";
import { PhotoOrdersPrintButton } from "@/components/admin/PhotoOrdersPrintButton";
import { formatPrice } from "@/lib/photo-order-catalog";

const props = {
  order: {
    orderNumber: "ZR-TEST",
    notes: "Első sor\nMásodik sor",
    totalAmount: 4600,
    billingName: "Teszt Ügyfél",
    billingPostalCode: "1000",
    billingCity: "Budapest",
    billingAddress: "Teszt utca 1.",
    includesDigital: true,
  },
  customerName: "Teszt Ügyfél",
  childName: "Teszt Lili",
  bookingNumber: "ZS-TEST",
  photoPublicationConsent: true,
  items: [{
    id: "item-1",
    photoId: "photo-1",
    photoTitle: "Egy nagyon hosszú, teljes fotónév",
    size: "10x15 cm",
    quantity: 2,
    unitPrice: 600,
    totalPrice: 1200,
  }],
};

describe("photo order details and print", () => {
  it.each([
    [true, "Hozzájárult"],
    [false, "Nem járult hozzá"],
    [null, "Nincs rögzítve"],
  ])("shows consent %s in both views", (consent, label) => {
    const data = { ...props, photoPublicationConsent: consent };
    expect(renderToStaticMarkup(<PhotoOrderDetailsDialog {...data} />)).toContain(label);
    expect(renderToStaticMarkup(<PhotoOrderPrintContent {...data} />)).toContain(label);
  });

  it("prints complete order details and the digital package", () => {
    const html = renderToStaticMarkup(<PhotoOrderPrintContent {...props} />);
    for (const value of [
      "ZR-TEST", "ZS-TEST", "Teszt Ügyfél", "1000 Budapest, Teszt utca 1.",
      "Egy nagyon hosszú, teljes fotónév", "10x15 cm", "2 db",
      formatPrice(600), formatPrice(1200), formatPrice(4600), formatPrice(3400),
      "Digitális változat", "Jelölés", "Első sor\nMásodik sor",
    ]) {
      expect(html).toContain(value);
    }
    expect(html.match(/class="photo-order-print-check"/g)).toHaveLength(2);
  });

  it("prints the child's name once, just before the online publication consent", () => {
    const html = renderToStaticMarkup(<PhotoOrderPrintContent {...props} />);
    expect(html).toContain(
      "<p><strong>Gyermek neve:</strong> Teszt Lili</p><p><strong>Online képmegjelenés:</strong> Hozzájárult</p>",
    );
    expect(html.match(/Gyermek neve:/g)).toHaveLength(1);
  });

  it.each([null, "   "])("omits the child name line when the name is missing (%j)", (childName) => {
    const html = renderToStaticMarkup(<PhotoOrderPrintContent {...props} childName={childName} />);
    expect(html).not.toContain("Gyermek neve:");
  });

  it("handles missing billing details, notes and legacy totals", () => {
    const data = {
      ...props,
      order: {
        ...props.order,
        billingName: null,
        billingPostalCode: null,
        billingCity: null,
        billingAddress: null,
        notes: null,
        totalAmount: 0,
        includesDigital: false,
      },
    };
    const html = renderToStaticMarkup(<PhotoOrderPrintContent {...data} />);
    expect(html).toContain("Nincs megadva");
    expect(html).toContain("Nincs megjegyzés.");
    expect(html).toContain(formatPrice(1200));
    expect(html).not.toContain("Digitális változat");
  });

  it("disables bulk printing when there are no matching orders", () => {
    const empty = renderToStaticMarkup(<PhotoOrdersPrintButton orders={[]} />);
    const matching = renderToStaticMarkup(<PhotoOrdersPrintButton orders={[props, props]} />);
    expect(empty).toContain('disabled=""');
    expect(empty).toContain("nyomtatása (0)");
    expect(matching).not.toContain('disabled=""');
    expect(matching).toContain("nyomtatása (2)");
  });
});

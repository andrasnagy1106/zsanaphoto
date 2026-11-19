"use client";

import { useEffect, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { PhotoOrderPrintContent, type PhotoOrderDetailsDialogProps } from "./PhotoOrderDetailsDialog";

interface PhotoOrdersPrintButtonProps {
  orders: PhotoOrderDetailsDialogProps[];
}

export function PhotoOrdersPrintButton({ orders }: PhotoOrdersPrintButtonProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (!isPrinting) return;
    const handleAfterPrint = () => setIsPrinting(false);
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, [isPrinting]);

  function printOrders() {
    flushSync(() => setIsPrinting(true));
    try {
      window.print();
    } catch (error) {
      setIsPrinting(false);
      throw error;
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={printOrders}
        disabled={orders.length === 0 || isPrinting}
        title="Az alkalmazott szűrésnek megfelelő rendelések nyomtatása"
        className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
      >
        Szűrt rendelések nyomtatása ({orders.length})
      </button>
      {isPrinting && createPortal(
        <div className="photo-order-print" aria-hidden="true">
          {orders.map((order) => <PhotoOrderPrintContent key={order.order.orderNumber} {...order} />)}
        </div>,
        document.body,
      )}
    </>
  );
}

"use client";

import { useState, useTransition } from "react";
import { updatePhotoOrderStatusAction } from "@/app/actions/photo-order-actions";
import type { PhotoOrder } from "@/db/schema";

const STATUS_OPTIONS: Array<{ value: PhotoOrder["status"]; label: string }> = [
  { value: "NEW", label: "Új" },
  { value: "PROCESSING", label: "Feldolgozás alatt" },
  { value: "COMPLETED", label: "Teljesítve" },
  { value: "CANCELLED", label: "Törölve" },
];

export function PhotoOrderStatusControl({ order }: { order: PhotoOrder }) {
  const [status, setStatus] = useState(order.status);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function changePhotoOrderStatus(nextStatus: PhotoOrder["status"]) {
    const previousStatus = status;
    setStatus(nextStatus);
    setError(null);
    startTransition(async () => {
      const result = await updatePhotoOrderStatusAction({ orderId: order.id, status: nextStatus });
      if (!result.success) {
        setStatus(previousStatus);
        setError(result.error ?? "A módosítás nem sikerült.");
      }
    });
  }

  return (
    <div>
      <select
        value={status}
        disabled={isPending}
        onChange={(event) => changePhotoOrderStatus(event.target.value as PhotoOrder["status"])}
        aria-label={`${order.orderNumber} rendelési állapota`}
        className="min-h-10 rounded-md border border-border bg-white px-3 text-sm disabled:opacity-60"
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
"use client";

import { useState } from "react";
import { formatZonedHungarianDate, formatZonedTime } from "@/lib/utils/time";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DatePicker } from "./DatePicker";
import { SlotPicker, type Slot } from "./SlotPicker";
import {
  cancelBookingByCustomerAction,
  rescheduleBookingByCustomerAction,
} from "@/app/actions/booking-actions";
import type { Booking, Service } from "@/db/schema";

interface BookingManagementProps {
  booking: Booking & { service: Service };
}

export function BookingManagement({ booking: initialBooking }: BookingManagementProps) {
  const [booking, setBooking] = useState(initialBooking);
  const [mode, setMode] = useState<"view" | "reschedule" | "cancel">("view");

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const start = new Date(booking.startAt);
  const end = new Date(booking.endAt);
  const canModify = booking.status === "PENDING" || booking.status === "CONFIRMED";

  async function handleCancel() {
    setSubmitting(true);
    setActionError(null);
    setSuccessMessage(null);

    const result = await cancelBookingByCustomerAction({ token: booking.manageToken });
    setSubmitting(false);

    if (result.success && result.booking) {
      setBooking((prev) => ({
        ...prev,
        status: result.booking!.status as Booking["status"],
        cancelledAt: new Date(),
      }));
      setMode("view");
      setSuccessMessage("A foglalásodat sikeresen lemondtuk. Küldtünk róla egy megerősítő e-mailt.");
    } else {
      setActionError(result.error ?? "Nem sikerült lemondani a foglalást.");
    }
  }

  async function handleReschedule() {
    if (!selectedSlot) return;
    setSubmitting(true);
    setActionError(null);
    setSuccessMessage(null);

    const result = await rescheduleBookingByCustomerAction({
      token: booking.manageToken,
      startAt: selectedSlot.startAt,
    });
    setSubmitting(false);

    if (result.success && result.booking) {
      setBooking((prev) => ({
        ...prev,
        startAt: new Date(result.booking!.startAt),
        endAt: new Date(result.booking!.endAt),
        status: result.booking!.status as Booking["status"],
      }));
      setMode("view");
      setSelectedDate(null);
      setSelectedSlot(null);
      setSuccessMessage("Az időpontodat sikeresen módosítottuk! Küldtünk róla egy visszaigazoló e-mailt.");
    } else {
      setActionError(result.error ?? "Nem sikerült módosítani az időpontot.");
    }
  }

  return (
    <div className="space-y-6">
      {successMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {successMessage}
        </div>
      ) : null}

      {actionError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {actionError}
        </div>
      ) : null}

      {/* Booking Overview Card */}
      <div className="rounded-2xl border border-border bg-white/70 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="text-xs font-semibold tracking-wider text-foreground/50 uppercase">
              Foglalási azonosító
            </span>
            <p className="font-mono text-lg font-bold text-foreground">{booking.bookingNumber}</p>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        <div className="mt-6 border-t border-border pt-6">
          <p className="font-display text-2xl text-foreground">{booking.service.name}</p>
          <div className="mt-2 text-foreground/80">
            <p className="font-medium text-lg text-accent">{formatZonedHungarianDate(start)}</p>
            <p className="text-base text-foreground/70">
              {formatZonedTime(start)} – {formatZonedTime(end)}
            </p>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-3 border-t border-border pt-6 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-foreground/50">Név</dt>
            <dd className="font-medium text-foreground">{booking.customerName}</dd>
          </div>
          <div>
            <dt className="text-foreground/50">E-mail</dt>
            <dd className="font-medium text-foreground">{booking.customerEmail}</dd>
          </div>
          <div>
            <dt className="text-foreground/50">Telefon</dt>
            <dd className="font-medium text-foreground">{booking.customerPhone}</dd>
          </div>
          {booking.notes ? (
            <div className="sm:col-span-2">
              <dt className="text-foreground/50">Megjegyzés</dt>
              <dd className="font-medium text-foreground">{booking.notes}</dd>
            </div>
          ) : null}
        </dl>
      </div>

      {/* Actions */}
      {canModify && mode === "view" && (
        <div className="flex flex-wrap gap-4">
          <button
            type="button"
            onClick={() => {
              setMode("reschedule");
              setActionError(null);
            }}
            className="min-h-11 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-dark"
          >
            Új időpont választása
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("cancel");
              setActionError(null);
            }}
            className="min-h-11 rounded-full border border-red-200 bg-white px-6 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
          >
            Foglalás lemondása
          </button>
        </div>
      )}

      {/* Reschedule Section */}
      {mode === "reschedule" && (
        <div className="rounded-2xl border border-accent/40 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h3 className="font-display text-xl text-foreground">Új időpont kiválasztása</h3>
            <button
              type="button"
              onClick={() => {
                setMode("view");
                setSelectedDate(null);
                setSelectedSlot(null);
              }}
              className="text-sm font-medium text-foreground/60 hover:text-foreground"
            >
              Mégse
            </button>
          </div>

          <div className="mt-6 space-y-6">
            <div>
              <p className="mb-2 text-sm font-medium text-foreground/70">1. Válassz egy új napot:</p>
              <DatePicker
                serviceId={booking.service.id}
                selectedDate={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  setSelectedSlot(null);
                }}
              />
            </div>

            {selectedDate && (
              <div className="border-t border-border pt-6">
                <p className="mb-2 text-sm font-medium text-foreground/70">2. Válassz egy szabad idősávot:</p>
                <SlotPicker
                  serviceId={booking.service.id}
                  dateIso={selectedDate}
                  selectedSlot={selectedSlot}
                  onSelect={(slot) => setSelectedSlot(slot)}
                />
              </div>
            )}

            {selectedSlot && (
              <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
                <p className="text-sm font-medium text-foreground">Kiválasztott új időpont:</p>
                <p className="font-display text-lg text-accent">
                  {formatZonedHungarianDate(new Date(selectedSlot.startAt))} |{" "}
                  {formatZonedTime(new Date(selectedSlot.startAt))} –{" "}
                  {formatZonedTime(new Date(selectedSlot.endAt))}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode("view");
                  setSelectedDate(null);
                  setSelectedSlot(null);
                }}
                disabled={submitting}
                className="min-h-11 rounded-full border border-border px-6 py-2.5 text-sm font-semibold text-foreground"
              >
                Vissza
              </button>
              <button
                type="button"
                onClick={handleReschedule}
                disabled={!selectedSlot || submitting}
                className="min-h-11 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-dark disabled:opacity-50"
              >
                {submitting ? "Módosítás mentése..." : "Új időpont megerősítése"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Section */}
      {mode === "cancel" && (
        <div className="rounded-2xl border border-red-200 bg-red-50/60 p-6 sm:p-8">
          <h3 className="font-display text-xl text-red-900">Biztosan le szeretnéd mondani a foglalást?</h3>
          <p className="mt-2 text-sm text-red-700">
            A lemondás után az időpont azonnal felszabadul és mások számára is foglalhatóvá válik.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setMode("view")}
              disabled={submitting}
              className="min-h-11 rounded-full border border-border bg-white px-6 py-2.5 text-sm font-semibold text-foreground"
            >
              Vissza
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={submitting}
              className="min-h-11 rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
            >
              {submitting ? "Lemondás folyamatban..." : "Igen, lemondom a foglalást"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

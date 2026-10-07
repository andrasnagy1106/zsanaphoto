"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createAvailabilityCalendarAction,
  createAvailabilityCalendarSlotAction,
  createAvailabilityCalendarSlotsAction,
  deleteAvailabilityCalendarAction,
  deleteAvailabilityCalendarSlotAction,
} from "@/app/actions/admin-availability-calendar-actions";
import type { AvailabilityCalendarWithSlots } from "@/lib/services/availability-calendar-service";

interface AvailabilityCalendarsManagerProps {
  calendars: AvailabilityCalendarWithSlots[];
}

export function AvailabilityCalendarsManager({ calendars }: AvailabilityCalendarsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [slotModes, setSlotModes] = useState<Record<string, string>>({});
  const [slotMessages, setSlotMessages] = useState<Record<string, string>>({});

  function handleCreateCalendar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const name = String(new FormData(form).get("name") ?? "");
    setMessage(null);

    startTransition(async () => {
      const result = await createAvailabilityCalendarAction({ name });
      setMessage(result.success ? "A naptár létrejött." : result.error ?? "A naptár mentése nem sikerült.");
      if (result.success) {
        form.reset();
        router.refresh();
      }
    });
  }

  function handleCreateCalendarSlots(event: React.FormEvent<HTMLFormElement>, calendarId: string) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const splitIntoAppointments = formData.get("mode") === "split";
    setSlotMessages((current) => ({ ...current, [calendarId]: "" }));

    startTransition(async () => {
      const input = {
        calendarId,
        date: String(formData.get("date") ?? ""),
        startTime: String(formData.get("startTime") ?? ""),
        endTime: String(formData.get("endTime") ?? ""),
      };
      const result = splitIntoAppointments
        ? await createAvailabilityCalendarSlotsAction({ ...input, durationMinutes: formData.get("durationMinutes") })
        : await createAvailabilityCalendarSlotAction(input);
      const savedMessage = "createdCount" in result
        ? `${result.createdCount} időpont létrehozva.`
        : "Az idősáv mentve.";
      setSlotMessages((current) => ({
        ...current,
        [calendarId]: result.success ? savedMessage : result.error ?? "Az időpontok mentése nem sikerült.",
      }));
      if (result.success) {
        form.reset();
        setSlotModes((current) => ({ ...current, [calendarId]: "single" }));
        router.refresh();
      }
    });
  }

  function handleDeleteCalendar(calendarId: string, calendarName: string) {
    if (!window.confirm(`Törlöd a(z) „${calendarName}” naptárat és az összes idősávját?`)) return;
    setMessage(null);

    startTransition(async () => {
      const result = await deleteAvailabilityCalendarAction(calendarId);
      setMessage(result.success ? "A naptár törölve." : result.error ?? "A naptár törlése nem sikerült.");
      if (result.success) router.refresh();
    });
  }

  function handleDeleteSlot(slotId: string) {
    setMessage(null);
    startTransition(async () => {
      const result = await deleteAvailabilityCalendarSlotAction(slotId);
      setMessage(result.success ? "Az idősáv törölve." : result.error ?? "Az idősáv törlése nem sikerült.");
      if (result.success) router.refresh();
    });
  }

  return (
    <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl text-foreground">Eseménynaptárak</h2>
          <p className="mt-1 max-w-2xl text-sm text-foreground/60">
            Minden sor egy külön foglalható alkalom: add meg a dátumát, kezdését és végét. Naptár hozzárendelésekor csak ezek jelennek meg.
          </p>
        </div>
      </div>

      <form onSubmit={handleCreateCalendar} className="mt-5 flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="availability-calendar-name">Naptár neve</label>
        <input
          id="availability-calendar-name"
          name="name"
          required
          minLength={2}
          maxLength={100}
          placeholder="Például: Karácsonyi fotózás 2026"
          className="min-h-11 min-w-0 flex-1 rounded-md border border-border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={isPending}
          className="min-h-11 rounded-md bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
        >
          Naptár létrehozása
        </button>
      </form>

      {message ? <p className="mt-3 text-sm text-foreground/75" role="status">{message}</p> : null}

      <div className="mt-5 divide-y divide-border border-t border-border">
        {calendars.length === 0 ? (
          <p className="py-5 text-sm text-foreground/60">Még nincs létrehozott eseménynaptár.</p>
        ) : calendars.map(({ calendar, slots }) => (
          <div key={calendar.id} className="py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-foreground">{calendar.name}</h3>
                <p className="text-xs text-foreground/55">{slots.length} rögzített idősáv</p>
              </div>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleDeleteCalendar(calendar.id, calendar.name)}
                className="min-h-9 rounded-md border border-border px-3 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
              >
                Naptár törlése
              </button>
            </div>

            <form
              onSubmit={(event) => handleCreateCalendarSlots(event, calendar.id)}
              className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3 sm:items-end"
            >
              <div>
                <label className="block text-xs font-medium text-foreground" htmlFor={`${calendar.id}-slot-mode`}>Rögzítés módja</label>
                <select
                  id={`${calendar.id}-slot-mode`}
                  name="mode"
                  value={slotModes[calendar.id] ?? "single"}
                  onChange={(event) => setSlotModes((current) => ({ ...current, [calendar.id]: event.target.value }))}
                  disabled={isPending}
                  className="mt-1 block min-h-10 w-full rounded-md border border-border px-3 py-2 text-sm"
                >
                  <option value="single">Egy időpont</option>
                  <option value="split">Időszak felosztása</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground" htmlFor={`${calendar.id}-slot-date`}>Dátum</label>
                <input
                  id={`${calendar.id}-slot-date`}
                  name="date"
                  type="date"
                  required
                  className="mt-1 block min-h-10 w-full rounded-md border border-border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground" htmlFor={`${calendar.id}-slot-start`}>Kezdés</label>
                <input
                  id={`${calendar.id}-slot-start`}
                  name="startTime"
                  type="time"
                  required
                  className="mt-1 block min-h-10 w-full rounded-md border border-border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground" htmlFor={`${calendar.id}-slot-end`}>Befejezés</label>
                <input
                  id={`${calendar.id}-slot-end`}
                  name="endTime"
                  type="time"
                  required
                  className="mt-1 block min-h-10 w-full rounded-md border border-border px-3 py-2 text-sm"
                />
              </div>
              {slotModes[calendar.id] === "split" ? (
                <div>
                  <label className="block text-xs font-medium text-foreground" htmlFor={`${calendar.id}-slot-duration`}>Időpont hossza (perc)</label>
                  <input
                    id={`${calendar.id}-slot-duration`}
                    name="durationMinutes"
                    type="number"
                    defaultValue={10}
                    min={1}
                    max={1440}
                    step={1}
                    required
                    disabled={isPending}
                    className="mt-1 block min-h-10 w-full rounded-md border border-border px-3 py-2 text-sm"
                  />
                </div>
              ) : null}
              <button
                type="submit"
                disabled={isPending}
                className="min-h-10 rounded-md border border-accent px-4 text-sm font-semibold text-accent hover:bg-accent/5 disabled:opacity-60"
              >
                {slotModes[calendar.id] === "split" ? "Időpontok létrehozása" : "Idősáv hozzáadása"}
              </button>
            </form>
            {slotMessages[calendar.id] ? <p className="mt-3 text-sm text-foreground/75" role="status">{slotMessages[calendar.id]}</p> : null}

            {slots.length > 0 ? (
              <ul className="mt-4 divide-y divide-border rounded-md border border-border">
                {slots.map((slot) => (
                  <li key={slot.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                    <span className="font-medium tabular-nums">{slot.date} · {slot.startTime}–{slot.endTime}</span>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleDeleteSlot(slot.id)}
                      className="min-h-8 px-2 text-xs font-medium text-red-700 hover:underline disabled:opacity-60"
                      aria-label={`${slot.date} ${slot.startTime}–${slot.endTime} idősáv törlése`}
                    >
                      Törlés
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
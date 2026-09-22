"use client";

import { useState } from "react";
import type { Service } from "@/db/schema";
import { createBookingAction } from "@/app/actions/booking-actions";
import { StepIndicator } from "./StepIndicator";
import { ServiceStep } from "./ServiceStep";
import { DatePicker } from "./DatePicker";
import { SlotPicker, type Slot } from "./SlotPicker";
import { CustomerForm, type CustomerFormData } from "./CustomerForm";
import { BookingSummary } from "./BookingSummary";
import { BookingSuccess } from "./BookingSuccess";

type Step = "service" | "date" | "slot" | "details" | "summary" | "success";

interface BookingWizardProps {
  services: Service[];
}

export function BookingWizard({ services }: BookingWizardProps) {
  const [step, setStep] = useState<Step>("service");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [customer, setCustomer] = useState<CustomerFormData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<{ bookingNumber: string; status: "PENDING" | "CONFIRMED"; startAt: string } | null>(null);

  function handleServiceSelect(service: Service) {
    setSelectedService(service);
    setStep("date");
  }

  async function handleConfirm() {
    if (!selectedService || !selectedSlot || !customer) return;
    setSubmitting(true);
    setSubmitError(null);

    const response = await createBookingAction({
      serviceId: selectedService.id,
      startAt: selectedSlot.startAt,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      notes: customer.notes,
      company: customer.company,
    });

    setSubmitting(false);

    if (response.success && response.booking) {
      setResult({
        bookingNumber: response.booking.bookingNumber,
        status: response.booking.status,
        startAt: response.booking.startAt,
      });
      setStep("success");
    } else {
      setSubmitError(response.error ?? "Valami hiba történt. Kérjük, próbáld meg újra.");
    }
  }

  if (step === "success" && result) {
    return <BookingSuccess {...result} />;
  }

  const stepNumberMap: Record<Exclude<Step, "success">, number> = {
    service: 1,
    date: 2,
    slot: 3,
    details: 4,
    summary: 5,
  };
  const stepLabelMap: Record<Exclude<Step, "success">, string> = {
    service: "Szolgáltatás",
    date: "Dátum",
    slot: "Időpont",
    details: "Adataid",
    summary: "Összegzés",
  };

  return (
    <div>
      <StepIndicator
        currentStep={stepNumberMap[step as Exclude<Step, "success">]}
        totalSteps={5}
        label={stepLabelMap[step as Exclude<Step, "success">]}
      />

      {step === "service" ? <ServiceStep services={services} onSelect={handleServiceSelect} /> : null}

      {step === "date" && selectedService ? (
        <div>
          <DatePicker
            serviceId={selectedService.id}
            selectedDate={selectedDate}
            onSelect={(date) => {
              setSelectedDate(date);
              setSelectedSlot(null);
              setStep("slot");
            }}
          />
          <button
            type="button"
            onClick={() => setStep("service")}
            className="mt-6 min-h-11 rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground"
          >
            Vissza
          </button>
        </div>
      ) : null}

      {step === "slot" && selectedService && selectedDate ? (
        <div>
          <SlotPicker
            key={selectedDate}
            serviceId={selectedService.id}
            dateIso={selectedDate}
            selectedSlot={selectedSlot}
            onSelect={(slot) => {
              setSelectedSlot(slot);
              setStep("details");
            }}
          />
          <button
            type="button"
            onClick={() => setStep("date")}
            className="mt-6 min-h-11 rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground"
          >
            Vissza
          </button>
        </div>
      ) : null}

      {step === "details" ? (
        <div>
          <CustomerForm
            defaultValues={customer ?? undefined}
            onSubmit={(data) => {
              setCustomer(data);
              setStep("summary");
            }}
          />
          <button
            type="button"
            onClick={() => setStep("slot")}
            className="mt-4 min-h-11 rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground"
          >
            Vissza
          </button>
        </div>
      ) : null}

      {step === "summary" && selectedService && selectedSlot && customer ? (
        <BookingSummary
          serviceName={selectedService.name}
          slot={selectedSlot}
          customer={customer}
          submitting={submitting}
          error={submitError}
          onBack={() => setStep("details")}
          onConfirm={handleConfirm}
        />
      ) : null}
    </div>
  );
}

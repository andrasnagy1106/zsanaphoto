interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  label: string;
}

export function StepIndicator({ currentStep, totalSteps, label }: StepIndicatorProps) {
  return (
    <div className="mb-8">
      <p className="text-sm font-medium text-foreground/60">
        {currentStep}. lépés / {totalSteps} — {label}
      </p>
      <div className="mt-2 flex gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={totalSteps} aria-valuenow={currentStep}>
        {Array.from({ length: totalSteps }, (_, index) => (
          <span
            key={index}
            className={`h-1.5 flex-1 rounded-full ${index < currentStep ? "bg-accent" : "bg-border"}`}
          />
        ))}
      </div>
    </div>
  );
}

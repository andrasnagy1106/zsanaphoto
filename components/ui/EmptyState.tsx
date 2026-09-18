interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/50 px-6 py-10 text-center">
      <p className="font-medium text-foreground">{title}</p>
      {description ? <p className="mt-1 text-sm text-foreground/60">{description}</p> : null}
    </div>
  );
}

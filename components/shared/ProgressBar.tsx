interface ProgressBarProps {
  percent: number;
  label?: string;
}

export default function ProgressBar({ percent, label }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-body-sm">
        {label && <span className="font-semibold text-ink">{label}</span>}
        <span className="text-muted">{clamped}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-strong">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

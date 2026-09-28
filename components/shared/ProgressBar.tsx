interface ProgressBarProps {
  percent: number;
  label?: string;
}

export default function ProgressBar({ percent, label }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-sm">
        {label && <span className="font-semibold">{label}</span>}
        <span className="text-zinc-600 dark:text-zinc-400">{clamped}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-foreground transition-all"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

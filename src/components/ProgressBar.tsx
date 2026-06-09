type ProgressBarProps = {
  value: number;
  max?: number;
  className?: string;
};

export function ProgressBar({ value, max = 100, className = "" }: ProgressBarProps) {
  const percent = Math.min(100, Math.round((value / max) * 100));

  return (
    <div className={`progress-track ${className}`}>
      <div className="progress-fill" style={{ width: `${percent}%` }} />
    </div>
  );
}

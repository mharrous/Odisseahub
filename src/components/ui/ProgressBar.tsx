export function ProgressBar({ value, label }: { value: number; label?: string }) {
  return (
    <div className="progress-wrap">
      <div className="progress-meta">
        {label && <span>{label}</span>}
        <span>{value}%</span>
      </div>
      <div className="progress-track" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={label ?? 'Progreso'}>
        <span style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: number;
  className?: string;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 4, className = '' }: SkeletonProps) {
  return (
    <div
      className={`skeleton animate-pulse ${className}`}
      style={{ width, height, borderRadius }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <Skeleton height={12} width="60%" />
      <div style={{ height: 8 }} />
      <Skeleton height={36} width="40%" />
      <div style={{ height: 6 }} />
      <Skeleton height={10} width="80%" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="skeleton-table-wrapper">
      <div className="skeleton-table-header">
        {[40, 20, 15, 10, 15].map((w, i) => <Skeleton key={i} width={`${w}%`} height={12} />)}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-table-row">
          {[40, 20, 15, 10, 15].map((w, j) => <Skeleton key={j} width={`${w}%`} height={12} />)}
        </div>
      ))}
    </div>
  );
}

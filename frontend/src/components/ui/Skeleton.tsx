interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: number;
  className?: string;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 4, className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse ${className}`}
      style={{ width, height, borderRadius, backgroundColor: '#E4E4E4' }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div style={{ backgroundColor: 'white', borderRadius: 8, padding: 24, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
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
    <div style={{ backgroundColor: 'white', borderRadius: 8, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
      <div style={{ padding: '12px 16px', backgroundColor: '#8A0538', display: 'flex', gap: 16 }}>
        {[40, 20, 15, 10, 15].map((w, i) => <Skeleton key={i} width={`${w}%`} height={12} />)}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ padding: '14px 16px', borderBottom: '1px solid #E4E4E4', display: 'flex', gap: 16, alignItems: 'center' }}>
          {[40, 20, 15, 10, 15].map((w, j) => <Skeleton key={j} width={`${w}%`} height={12} />)}
        </div>
      ))}
    </div>
  );
}

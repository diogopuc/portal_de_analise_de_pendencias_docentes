import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  hover?: boolean;
}

export function Card({ children, className = '', style, hover }: CardProps) {
  return (
    <div
      className={`${hover ? 'card-hover' : ''} ${className}`}
      style={{
        backgroundColor: 'white',
        borderRadius: 8,
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        padding: 24,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  titulo: string;
  valor: number | string;
  subtitulo?: string;
  cor?: string;
  icon?: ReactNode;
  destaque?: boolean;
}

export function StatCard({ titulo, valor, subtitulo, cor = '#8A0538', icon, destaque }: StatCardProps) {
  return (
    <div
      className="card-hover"
      style={{
        backgroundColor: destaque ? cor : 'white',
        borderRadius: 8,
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        borderTop: destaque ? 'none' : `3px solid ${cor}`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 11, color: destaque ? 'rgba(255,255,255,0.8)' : '#787878', margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {titulo}
        </p>
        {icon && (
          <div style={{ color: destaque ? 'rgba(255,255,255,0.7)' : cor }}>
            {icon}
          </div>
        )}
      </div>
      <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 36, color: destaque ? 'white' : cor, margin: 0, lineHeight: 1 }}>
        {valor}
      </p>
      {subtitulo && (
        <p style={{ fontSize: 12, color: destaque ? 'rgba(255,255,255,0.7)' : '#787878', margin: 0 }}>
          {subtitulo}
        </p>
      )}
    </div>
  );
}

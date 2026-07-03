import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  hover?: boolean;
}

export function Card({ children, className = '', style, hover }: CardProps) {
  return (
    <div className={`card${hover ? ' card-hover' : ''} ${className}`} style={style}>
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
      className="stat-card"
      style={{
        backgroundColor: destaque ? cor : 'white',
        borderTop: destaque ? 'none' : `3px solid ${cor}`,
      }}
    >
      <div className="flex justify-between items-start">
        <p className={`stat-card__label${destaque ? ' stat-card__label--inverted' : ''}`}>{titulo}</p>
        {icon && (
          <div className="stat-card__icon" style={{ color: destaque ? 'rgba(255,255,255,0.7)' : cor }}>
            {icon}
          </div>
        )}
      </div>
      <p className="stat-card__value" style={{ color: destaque ? 'white' : cor }}>{valor}</p>
      {subtitulo && (
        <p className={`stat-card__sub${destaque ? ' stat-card__sub--inverted' : ''}`}>{subtitulo}</p>
      )}
    </div>
  );
}

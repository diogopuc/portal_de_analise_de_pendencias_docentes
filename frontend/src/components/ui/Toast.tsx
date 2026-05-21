import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

interface Toast { id: string; tipo: 'sucesso' | 'erro' | 'aviso' | 'info'; mensagem: string; }
interface ToastCtx { mostrar: (tipo: Toast['tipo'], mensagem: string) => void; }

const ToastContext = createContext<ToastCtx>({ mostrar: () => {} });

export function useToast() { return useContext(ToastContext); }

const ICONS = {
  sucesso: <CheckCircle size={18} color="#4BB218" />,
  erro: <XCircle size={18} color="#E5000C" />,
  aviso: <AlertCircle size={18} color="#FFD600" />,
  info: <Info size={18} color="#863BFF" />,
};

const BG = {
  sucesso: '#EAFFD9',
  erro: '#FFE0E0',
  aviso: '#FFFDD9',
  info: '#EFE4FF',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const mostrar = useCallback((tipo: Toast['tipo'], mensagem: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(p => [...p, { id, tipo, mensagem }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);

  const remover = (id: string) => setToasts(p => p.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ mostrar }}>
      {children}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map(t => (
          <div
            key={t.id}
            className="animate-fadeIn"
            style={{
              backgroundColor: BG[t.tipo],
              border: `1px solid ${BG[t.tipo]}`,
              borderRadius: 8,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              minWidth: 280,
              maxWidth: 400,
            }}
          >
            {ICONS[t.tipo]}
            <span style={{ fontSize: 14, fontFamily: 'Source Sans 3, sans-serif', flex: 1, color: '#1E1E1E' }}>{t.mensagem}</span>
            <button onClick={() => remover(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
              <X size={14} color="#787878" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

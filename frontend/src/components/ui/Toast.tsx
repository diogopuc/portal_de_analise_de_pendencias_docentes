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
      <div className="toast-stack">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast--${t.tipo} animate-fadeIn`}>
            {ICONS[t.tipo]}
            <span className="toast__msg">{t.mensagem}</span>
            <button onClick={() => remover(t.id)} className="toast__close">
              <X size={14} color="#787878" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

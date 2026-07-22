import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/layout/Layout';
import { ToastProvider } from './components/ui/Toast';
import { Painel } from './pages/Painel';
import { Relatorios } from './pages/Relatorios';
import { RevisarRelatorio } from './pages/RevisarRelatorio';
import { TodosRelatorios } from './pages/TodosRelatorios';
import { Analise } from './pages/Analise';
import { Coordenador } from './pages/Coordenador';
import { Cursos } from './pages/Cursos';
import { Configuracao } from './pages/Configuracao';
import { Historico } from './pages/Historico';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 2,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Painel />} />
              <Route path="/relatorios" element={<Relatorios />} />
              <Route path="/revisar" element={<RevisarRelatorio />} />
              <Route path="/todos-relatorios" element={<TodosRelatorios />} />
              <Route path="/analise" element={<Analise />} />
              <Route path="/coordenador" element={<Coordenador />} />
              <Route path="/cursos" element={<Cursos />} />
              <Route path="/configuracao" element={<Configuracao />} />
              <Route path="/historico" element={<Historico />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

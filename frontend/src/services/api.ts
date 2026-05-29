import axios from 'axios';
import type { DashboardData, Docente, RelatorioPDF, LogEntry, ProcessingStatus, PaginatedResponse } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 120000,
});

export const dashboardAPI = {
  getDados: () => api.get<DashboardData>('/dashboard').then(r => r.data),
};

export const docentesAPI = {
  listar: (params: { busca?: string; campus?: string; tipoPendencia?: string; pagina?: number; limite?: number }) =>
    api.get<PaginatedResponse<Docente>>('/docentes', { params }).then(r => r.data),
  buscar: (matricula: number) => api.get<Docente>(`/docentes/${matricula}`).then(r => r.data),
  listarCampus: () => api.get<string[]>('/docentes/campus/lista').then(r => r.data),
};

export const relatoriosAPI = {
  processar: (arquivo?: File) => {
    const form = new FormData();
    if (arquivo) form.append('arquivo', arquivo);
    return api.post<{ sucesso: boolean; mensagem: string; totalDocentes: number }>('/relatorios/processar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },
  gerarPDF: (matricula: number) =>
    api.post<{ sucesso: boolean; nomeArquivo: string }>(`/relatorios/gerar/${matricula}`).then(r => r.data),
  gerarTodos: () =>
    api.post<{ sucesso: boolean; total: number; arquivos: string[] }>('/relatorios/gerar-todos').then(r => r.data),
  listar: (params: { busca?: string; pagina?: number; limite?: number }) =>
    api.get<PaginatedResponse<RelatorioPDF>>('/relatorios/lista', { params }).then(r => r.data),
  excluir: (nomeArquivo: string) =>
    api.delete(`/relatorios/${nomeArquivo}`).then(r => r.data),
  getStatus: () => api.get<ProcessingStatus>('/relatorios/status').then(r => r.data),
  getLogs: () => api.get<LogEntry[]>('/relatorios/logs').then(r => r.data),
  getDownloadUrl: (nomeArquivo: string) => `/api/relatorios/download/${nomeArquivo}`,
  getVisualizarUrl: (nomeArquivo: string) => `/api/relatorios/visualizar/${nomeArquivo}`,
  getZipUrl: () => `/api/relatorios/download-zip/todos`,
  getZipSimultaneasUrl:   () => `/api/relatorios/download-zip/simultaneas`,
  getZipSomenteAgendaUrl: () => `/api/relatorios/download-zip/somente-agenda`,
  getZipSomenteTachUrl:   () => `/api/relatorios/download-zip/somente-tach`,
};

import axios from 'axios';
import type { DashboardData, Docente, RelatorioPDF, LogEntry, ProcessingStatus, PaginatedDocentes, PaginatedRelatorios, SemanasConfigData, SnapshotMeta, ComparacaoResult } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 120000,
});

export const dashboardAPI = {
  getDados: () => api.get<DashboardData>('/dashboard').then(r => r.data),
};

export const docentesAPI = {
  listar: (params: { busca?: string; campus?: string; curso?: string; tipoPendencia?: string; pagina?: number; limite?: number }) =>
    api.get<PaginatedDocentes>('/docentes', { params }).then(r => r.data),
  buscar: (matricula: number) => api.get<Docente>(`/docentes/${matricula}`).then(r => r.data),
  listarCampus: () => api.get<string[]>('/docentes/campus/lista').then(r => r.data),
  getExportarExcelUrl: (params: { campus?: string; curso?: string; tipoPendencia?: string; busca?: string }) => {
    const p = new URLSearchParams();
    if (params.campus)        p.set('campus', params.campus);
    if (params.curso)         p.set('curso', params.curso);
    if (params.tipoPendencia) p.set('tipoPendencia', params.tipoPendencia);
    if (params.busca)         p.set('busca', params.busca);
    const qs = p.toString();
    return `/api/docentes/exportar-excel${qs ? `?${qs}` : ''}`;
  },
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
    api.get<PaginatedRelatorios>('/relatorios/lista', { params }).then(r => r.data),
  excluir: (nomeArquivo: string) =>
    api.delete(`/relatorios/${nomeArquivo}`).then(r => r.data),
  getStatus: () => api.get<ProcessingStatus>('/relatorios/status').then(r => r.data),
  getLogs: () => api.get<LogEntry[]>('/relatorios/logs').then(r => r.data),
  getNomeArquivo: (nomeDocente: string, matricula: number): string => {
    const sanitizado = nomeDocente
      .toUpperCase()
      .replace(/\s+/g, '_')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^A-Z0-9_]/g, '')
      .substring(0, 100);
    return `${sanitizado}_${matricula}.pdf`;
  },
  getDownloadUrl: (nomeArquivo: string) => `/api/relatorios/download/${nomeArquivo}`,
  getVisualizarUrl: (nomeArquivo: string) => `/api/relatorios/visualizar/${nomeArquivo}`,
  getZipUrl: () => `/api/relatorios/download-zip/todos`,
  getZipSimultaneasUrl:   () => `/api/relatorios/download-zip/simultaneas`,
  getZipSomenteAgendaUrl: () => `/api/relatorios/download-zip/somente-agenda`,
  getZipSomenteTachUrl:   () => `/api/relatorios/download-zip/somente-tach`,
};

export const configAPI = {
  getSemanas: () => api.get<SemanasConfigData>('/config/semanas').then(r => r.data),
  putSemanas: (data: SemanasConfigData) =>
    api.put<{ sucesso: boolean; mensagem: string }>('/config/semanas', data).then(r => r.data),
};

export const historicoAPI = {
  listar: () => api.get<SnapshotMeta[]>('/historico').then(r => r.data),
  comparar: (de: string, para: string) =>
    api.get<ComparacaoResult>('/historico/comparar', { params: { de, para } }).then(r => r.data),
};

export const emailAPI = {
  enviar: (data: { matricula: number; email: string; assunto?: string; corpo?: string }) =>
    api.post<{ sucesso: boolean; mensagem: string }>('/email/enviar', data).then(r => r.data),
};

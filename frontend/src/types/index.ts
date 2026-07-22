export interface StatusDia {
  data: string;
  status: string;
}

export interface DadosSemana {
  semana: string;
  aba: string;
  matricula: number;
  nomeDocente: string;
  chContrato: number;
  horasAlocar: number;
  campus: string;
  curso: string;
  geraAgenda: string;
  statusPorDia: StatusDia[];
  resultadoAgenda: string;
  resultadoTach: string;
  pendenciaAgenda: boolean;
  pendenciaTach: boolean;
  abonada: boolean;
  motivoAbono?: string;
}

export interface Docente {
  matricula: number;
  nomeDocente: string;
  campus: string;
  semanas: DadosSemana[];
  pendenciaAgenda: boolean;
  pendenciaTach: boolean;
  pendenciaSimultanea: boolean;
  tipoPendencia: 'somente_agenda' | 'somente_tach' | 'simultanea' | 'sem_pendencia';
}

export interface DashboardData {
  totalDocentes: number;
  totalPendenciaAgenda: number;
  totalPendenciaTach: number;
  totalSimultaneo: number;
  semPendencia: number;
  porSemana: { semana: string; aba: string; pendenciaAgenda: number; pendenciaTach: number; total: number; abonada: boolean; motivoAbono?: string }[];
  porCampus: { campus: string; total: number }[];
  statusTachDistribuicao: { status: string; total: number }[];
  ultimaAtualizacao: string;
  arquivoProcessado: string;
}

export interface RelatorioPDF {
  nomeArquivo: string;
  caminho: string;
  tamanhoBytes: number;
  geradoEm: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  tipo: 'info' | 'erro' | 'aviso' | 'sucesso';
  mensagem: string;
  detalhes?: string;
}

export interface ProcessingStatus {
  emProcessamento: boolean;
  progresso: number;
  total: number;
  etapa: string;
  erros: string[];
  ultimoProcessamento?: string;
}

export interface PaginatedDocentes {
  docentes: Docente[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

export interface PaginatedRelatorios {
  relatorios: RelatorioPDF[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

export const TIPO_PENDENCIA_LABELS: Record<string, string> = {
  somente_agenda: 'Somente Agenda',
  somente_tach: 'Somente TACH',
  simultanea: 'Simultânea',
  sem_pendencia: 'Sem Pendência',
};

export const STATUS_TACH_CORES: Record<string, string> = {
  'APROVADO': 'text-green-700 bg-green-50',
  'NÃO CRIADO': 'text-red-700 bg-red-50',
  'AGUARDANDO APROVAÇÃO': 'text-orange-700 bg-orange-50',
  'NECESSÁRIO AJUSTAR': 'text-red-700 bg-red-50',
  'RASCUNHO': 'text-yellow-700 bg-yellow-50',
  'FINALIZADO': 'text-blue-700 bg-blue-50',
};

export interface SemanaConfig {
  aba: string;
  semana: string;
  periodo: string;
}

export interface SemanasConfigData {
  semanas: SemanaConfig[];
  abonadas: Record<string, string>;
}

export interface SnapshotMeta {
  timestamp: string;
  arquivo: string;
  totalDocentes: number;
  porTipo: Record<string, number>;
  file: string;
}

export interface ComparacaoResult {
  antes: SnapshotMeta;
  depois: SnapshotMeta;
  regularizados: Docente[];
  novasPendencias: Docente[];
  delta: Record<string, number>;
}

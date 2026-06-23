// Datas das semanas e semanas abonadas: configuráveis em src/config/semanas.config.ts
export { SEMANAS_CONFIG, SEMANAS_ABONADAS } from '../config/semanas.config';

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
  statusPorDia: { data: string; status: string }[];
  resultadoAgenda: string;
  resultadoTach: string;
  pendenciaAgenda: boolean;
  pendenciaTach: boolean;
  abonada?: boolean;
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
  porSemana: { semana: string; aba: string; pendenciaAgenda: number; pendenciaTach: number; total: number; abonada?: boolean; motivoAbono?: string }[];
  porCampus: { campus: string; total: number }[];
  statusTachDistribuicao: { status: string; total: number }[];
  ultimaAtualizacao: string;
  arquivoProcessado: string;
}

export interface RelatorioPDF {
  id: string;
  matricula: number;
  nomeDocente: string;
  nomeArquivo: string;
  caminhoArquivo: string;
  geradoEm: string;
  tamanhoBytes: number;
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

export const STATUS_TACH_COM_PENDENCIA = [
  'AGUARDANDO APROVAÇÃO',
  'NÃO CRIADO',
  'NECESSÁRIO AJUSTAR',
  'RASCUNHO',
  'FINALIZADO',
];

export const STATUS_TACH_SEM_PENDENCIA = ['APROVADO'];

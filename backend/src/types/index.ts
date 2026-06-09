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

export const SEMANAS_CONFIG = [
  { aba: '04.05', semana: 'Semana 01', periodo: '04/05 a 10/05' },
  { aba: '11.05', semana: 'Semana 02', periodo: '11/05 a 17/05' },
  { aba: '18.05', semana: 'Semana 03', periodo: '18/05 a 24/05' },
  { aba: '25.05', semana: 'Semana 04', periodo: '25/05 a 31/05' }
];

export const STATUS_TACH_COM_PENDENCIA = [
  'AGUARDANDO APROVAÇÃO',
  'NÃO CRIADO',
  'NECESSÁRIO AJUSTAR',
  'RASCUNHO',
  'FINALIZADO',
];

export const STATUS_TACH_SEM_PENDENCIA = ['APROVADO'];

export const SEMANAS_ABONADAS: Record<string, string> = {
  '01.04': 'Semana abonada — Feriado: Quinta-Feira Santa (02/04) e Sexta-Feira da Paixão (03/04)',
  '20.04': 'Semana abonada — Feriado: Tiradentes (21/04)',
};

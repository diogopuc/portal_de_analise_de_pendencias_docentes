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
  { aba: '02.03', semana: 'Semana 01', periodo: '02/03 a 06/03' },
  { aba: '09.03', semana: 'Semana 02', periodo: '09/03 a 13/03' },
  { aba: '16.03', semana: 'Semana 03', periodo: '16/03 a 20/03' },
  { aba: '23.03', semana: 'Semana 04', periodo: '23/03 a 27/03' },
  { aba: '30.03', semana: 'Semana 05', periodo: '30/03 a 31/03' },
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

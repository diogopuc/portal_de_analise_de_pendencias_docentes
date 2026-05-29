import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Docente, DashboardData, LogEntry, ProcessingStatus, SEMANAS_CONFIG, SEMANAS_ABONADAS } from '../types';
import { ExcelReaderService } from './ExcelReaderService';

export class ProcessingService {
  private docentes: Docente[] = [];
  private logs: LogEntry[] = [];
  private status: ProcessingStatus = {
    emProcessamento: false,
    progresso: 0,
    total: 0,
    etapa: 'Aguardando',
    erros: [],
  };
  private ultimoArquivoProcessado = '';
  private dataDir: string;
  private excelReader: ExcelReaderService;

  constructor(dataDir: string) {
    this.dataDir = dataDir;
    this.excelReader = new ExcelReaderService();
  }

  private addLog(tipo: LogEntry['tipo'], mensagem: string, detalhes?: string) {
    this.logs.unshift({
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      tipo,
      mensagem,
      detalhes,
    });
    if (this.logs.length > 200) this.logs = this.logs.slice(0, 200);
  }

  async processarPlanilha(caminhoArquivo: string): Promise<void> {
    this.status.emProcessamento = true;
    this.status.progresso = 0;
    this.status.etapa = 'Iniciando processamento...';
    this.status.erros = [];
    this.addLog('info', 'Iniciando processamento da planilha', caminhoArquivo);

    try {
      this.status.etapa = 'Lendo arquivo Excel...';
      this.status.progresso = 20;
      this.docentes = this.excelReader.lerPlanilha(caminhoArquivo);

      this.status.etapa = 'Consolidando dados...';
      this.status.progresso = 60;
      this.ultimoArquivoProcessado = path.basename(caminhoArquivo);

      this.status.etapa = 'Finalizando...';
      this.status.progresso = 100;
      this.status.ultimoProcessamento = new Date().toISOString();
      this.addLog('sucesso', `Planilha processada com sucesso. ${this.docentes.length} docentes encontrados.`);
    } catch (err: any) {
      this.status.erros.push(err.message);
      this.addLog('erro', 'Erro ao processar planilha', err.message);
      throw err;
    } finally {
      this.status.emProcessamento = false;
      this.status.etapa = 'Concluído';
    }
  }

  getDocentes(): Docente[] {
    return this.docentes;
  }

  getDocente(matricula: number): Docente | undefined {
    return this.docentes.find(d => d.matricula === matricula);
  }

  getDashboard(): DashboardData {
    const total = this.docentes.length;
    const pendenciaAgenda = this.docentes.filter(d => d.pendenciaAgenda).length;
    const pendenciaTach = this.docentes.filter(d => d.pendenciaTach).length;
    const simultanea = this.docentes.filter(d => d.pendenciaSimultanea).length;
    const semPendencia = this.docentes.filter(d => d.tipoPendencia === 'sem_pendencia').length;

    const porSemana = SEMANAS_CONFIG.map(config => {
      const docentesSemana = this.docentes.filter(d =>
        d.semanas.some(s => s.aba === config.aba)
      );
      const pAgenda = docentesSemana.filter(d =>
        d.semanas.find(s => s.aba === config.aba)?.pendenciaAgenda
      ).length;
      const pTach = docentesSemana.filter(d =>
        d.semanas.find(s => s.aba === config.aba)?.pendenciaTach
      ).length;
      const abonada = config.aba in SEMANAS_ABONADAS;
      return {
        semana: config.semana,
        aba: config.aba,
        pendenciaAgenda: pAgenda,
        pendenciaTach: pTach,
        total: docentesSemana.length,
        abonada,
        motivoAbono: abonada ? SEMANAS_ABONADAS[config.aba] : undefined,
      };
    });

    const campusMap = new Map<string, number>();
    this.docentes.forEach(d => {
      const c = (d.campus || 'Desconhecido').trim().toUpperCase();
      campusMap.set(c, (campusMap.get(c) || 0) + 1);
    });
    const porCampus = Array.from(campusMap.entries())
      .map(([campus, total]) => ({ campus, total }))
      .sort((a, b) => b.total - a.total);

    const statusMap = new Map<string, number>();
    this.docentes.forEach(d => {
      d.semanas.forEach(s => {
        s.statusPorDia.forEach(sp => {
          if (sp.status && sp.status !== 'APROVADO') {
            statusMap.set(sp.status, (statusMap.get(sp.status) || 0) + 1);
          }
        });
      });
    });
    const statusTachDistribuicao = Array.from(statusMap.entries())
      .map(([status, total]) => ({ status, total }))
      .sort((a, b) => b.total - a.total);

    return {
      totalDocentes: total,
      totalPendenciaAgenda: pendenciaAgenda,
      totalPendenciaTach: pendenciaTach,
      totalSimultaneo: simultanea,
      semPendencia,
      porSemana,
      porCampus,
      statusTachDistribuicao,
      ultimaAtualizacao: this.status.ultimoProcessamento || '',
      arquivoProcessado: this.ultimoArquivoProcessado,
    };
  }

  getStatus(): ProcessingStatus {
    return this.status;
  }

  getLogs(): LogEntry[] {
    return this.logs;
  }

  addLogExterno(tipo: LogEntry['tipo'], mensagem: string, detalhes?: string) {
    this.addLog(tipo, mensagem, detalhes);
  }

  isProcessado(): boolean {
    return this.docentes.length > 0;
  }
}

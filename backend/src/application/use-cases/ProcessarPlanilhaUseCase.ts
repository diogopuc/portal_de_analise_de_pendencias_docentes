import path from 'path';
import fs   from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { IDocenteRepository } from '../../domain/repositories/IDocenteRepository';
import { ExcelPlanilhaReader } from '../../infrastructure/readers/ExcelPlanilhaReader';

export interface LogEntry {
  id: string;
  timestamp: string;
  tipo: 'info' | 'erro' | 'aviso' | 'sucesso';
  mensagem: string;
  detalhes?: string;
}

export interface StatusProcessamento {
  emProcessamento: boolean;
  progresso: number;
  total: number;
  etapa: string;
  erros: string[];
  ultimoProcessamento?: string;
  arquivoProcessado?: string;
}

export interface Snapshot {
  id: string;
  timestamp: string;
  arquivo: string;
  totalDocentes: number;
  porTipo: Record<string, number>;
  docentes: { matricula: number; nome: string; campus: string; tipo: string }[];
}

export class ProcessarPlanilhaUseCase {
  private logs: LogEntry[] = [];
  private status: StatusProcessamento = {
    emProcessamento: false,
    progresso: 0,
    total: 0,
    etapa: 'Aguardando',
    erros: [],
  };

  constructor(
    private readonly repositorio: IDocenteRepository,
    private readonly leitor: ExcelPlanilhaReader,
    private readonly historicoDir?: string,
  ) {}

  async executar(caminhoArquivo: string): Promise<void> {
    this.repositorio.limpar();
    this.status = { emProcessamento: true, progresso: 0, total: 0, etapa: 'Lendo arquivo Excel...', erros: [] };
    this.addLog('info', 'Iniciando processamento da planilha', caminhoArquivo);

    try {
      this.status.progresso = 20;
      this.leitor.popularRepositorio(caminhoArquivo, this.repositorio);

      this.status.progresso = 100;
      this.status.ultimoProcessamento = new Date().toISOString();
      this.status.arquivoProcessado   = path.basename(caminhoArquivo);
      this.addLog('sucesso', `Planilha processada. ${this.repositorio.listarTodos().length} docentes encontrados.`);

      this.salvarSnapshot(path.basename(caminhoArquivo));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.status.erros.push(msg);
      this.addLog('erro', 'Erro ao processar planilha', msg);
      throw err;
    } finally {
      this.status.emProcessamento = false;
      this.status.etapa = this.status.erros.length > 0 ? 'Erro' : 'Concluído';
    }
  }

  private salvarSnapshot(arquivo: string): void {
    if (!this.historicoDir) return;
    try {
      if (!fs.existsSync(this.historicoDir)) fs.mkdirSync(this.historicoDir, { recursive: true });
      const docentes = this.repositorio.listarTodos();
      const snapshot: Snapshot = {
        id: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        arquivo,
        totalDocentes: docentes.length,
        porTipo: {
          somente_agenda: docentes.filter(d => d.tipoPendencia === 'somente_agenda').length,
          somente_tach:   docentes.filter(d => d.tipoPendencia === 'somente_tach').length,
          simultanea:     docentes.filter(d => d.tipoPendencia === 'simultanea').length,
          sem_pendencia:  docentes.filter(d => d.tipoPendencia === 'sem_pendencia').length,
        },
        docentes: docentes.map(d => ({
          matricula: d.matricula,
          nome: d.nomeDocente,
          campus: d.campus,
          tipo: d.tipoPendencia,
        })),
      };
      const filename = new Date().toISOString().replace(/[:.]/g, '-') + '.json';
      fs.writeFileSync(path.join(this.historicoDir, filename), JSON.stringify(snapshot, null, 2), 'utf8');
    } catch {}
  }

  getStatus(): StatusProcessamento { return this.status; }
  getLogs(): LogEntry[] { return this.logs; }

  addLog(tipo: LogEntry['tipo'], mensagem: string, detalhes?: string): void {
    this.logs.unshift({ id: uuidv4(), timestamp: new Date().toISOString(), tipo, mensagem, detalhes });
    if (this.logs.length > 200) this.logs = this.logs.slice(0, 200);
  }
}

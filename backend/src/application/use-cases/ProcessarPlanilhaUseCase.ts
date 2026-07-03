import path from 'path';
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
    } catch (err: any) {
      this.status.erros.push(err.message);
      this.addLog('erro', 'Erro ao processar planilha', err.message);
      throw err;
    } finally {
      this.status.emProcessamento = false;
      this.status.etapa = this.status.erros.length > 0 ? 'Erro' : 'Concluído';
    }
  }

  getStatus(): StatusProcessamento {
    return this.status;
  }

  getLogs(): LogEntry[] {
    return this.logs;
  }

  addLog(tipo: LogEntry['tipo'], mensagem: string, detalhes?: string): void {
    this.logs.unshift({ id: uuidv4(), timestamp: new Date().toISOString(), tipo, mensagem, detalhes });
    if (this.logs.length > 200) this.logs = this.logs.slice(0, 200);
  }
}

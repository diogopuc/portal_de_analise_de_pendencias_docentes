import { IDocenteRepository } from '../../domain/repositories/IDocenteRepository';
import { PdfRelatorioGenerator } from '../../infrastructure/generators/PdfRelatorioGenerator';

export class GerarRelatorioUseCase {
  constructor(
    private readonly repositorio: IDocenteRepository,
    private readonly gerador: PdfRelatorioGenerator,
  ) {}

  async executar(matricula: number): Promise<{ nomeArquivo: string; tamanhoBytes: number }> {
    const docente = this.repositorio.encontrarPorMatricula(matricula);
    if (!docente) throw new Error('Docente não encontrado');
    const resultado = await this.gerador.gerarPDF(docente);
    return { nomeArquivo: resultado.nomeArquivo, tamanhoBytes: resultado.tamanhoBytes };
  }

  async executarTodos(
    onProgress?: (atual: number, total: number) => void,
  ): Promise<{ nomeArquivo: string; tamanhoBytes: number }[]> {
    const docentes = this.repositorio.listarTodos().filter(d => d.tipoPendencia !== 'sem_pendencia');
    const resultados = [];
    for (let i = 0; i < docentes.length; i++) {
      const r = await this.gerador.gerarPDF(docentes[i]);
      resultados.push({ nomeArquivo: r.nomeArquivo, tamanhoBytes: r.tamanhoBytes });
      onProgress?.(i + 1, docentes.length);
    }
    return resultados;
  }
}

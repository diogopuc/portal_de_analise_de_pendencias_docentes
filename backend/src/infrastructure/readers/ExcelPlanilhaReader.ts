import * as XLSX from 'xlsx';
import fs from 'fs';
import { Docente } from '../../domain/entities/Docente';
import { DadosSemana, StatusPorDia } from '../../domain/entities/DadosSemana';
import { PendenciaService } from '../../domain/services/PendenciaService';
import { IDocenteRepository } from '../../domain/repositories/IDocenteRepository';
import { SEMANAS_CONFIG, SEMANAS_ABONADAS } from '../../config/semanas.config';

export class ExcelPlanilhaReader {
  constructor(private readonly pendenciaService: PendenciaService) {}

  private normalizarTexto(texto: string): string {
    return texto.toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  }

  private normalizarStatus(status: string): string {
    return status.normalize('NFC').toUpperCase().trim();
  }

  private encontrarColuna(headers: string[], termos: string[]): number {
    const norm = headers.map(h => this.normalizarTexto(String(h || '')));
    for (const termo of termos) {
      const idx = norm.findIndex(h => h.includes(this.normalizarTexto(termo)));
      if (idx !== -1) return idx;
    }
    return -1;
  }

  popularRepositorio(caminhoArquivo: string, repositorio: IDocenteRepository): void {
    if (!fs.existsSync(caminhoArquivo)) {
      throw new Error(`Arquivo não encontrado: ${caminhoArquivo}`);
    }

    const wb = XLSX.readFile(caminhoArquivo);

    for (const config of SEMANAS_CONFIG) {
      const ws = wb.Sheets[config.aba];
      if (!ws) continue;

      const dados = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[][];
      if (dados.length < 2) continue;

      const headers = dados[0].map((h: any) => String(h || ''));

      const colMatricula = this.encontrarColuna(headers, ['matricula', 'matrícula']);
      if (colMatricula === -1) continue;

      const colNome      = this.encontrarColuna(headers, ['nome docente', 'nome do docente', 'docente']);
      const colCH        = this.encontrarColuna(headers, ['ch de contrato', 'ch total de contrato', 'ch total']);
      const colHoras     = this.encontrarColuna(headers, ['horas a alocar']);
      const colCampus    = this.encontrarColuna(headers, ['campus']);
      const colCurso     = this.encontrarColuna(headers, ['curso']);
      const colGeraAgenda = this.encontrarColuna(headers, ['gera agenda']);

      const colsStatus: { data: string; idx: number }[] = [];
      headers.forEach((h, i) => {
        if (this.normalizarTexto(h).includes('status')) {
          colsStatus.push({ data: h.replace(/status\s*/i, '').trim() || h, idx: i });
        }
      });

      for (let i = 1; i < dados.length; i++) {
        const row = dados[i];
        if (!row[colMatricula] && !row[colNome]) continue;

        const matricula = Number(row[colMatricula]);
        if (isNaN(matricula) || matricula === 0) continue;

        const nomeDocente  = String(row[colNome]      || '').trim().toUpperCase();
        const chContrato   = parseFloat(String(row[colCH]    || '0').replace(',', '.')) || 0;
        const horasAlocar  = parseFloat(String(row[colHoras] || '0').replace(',', '.')) || 0;
        const campus       = String(row[colCampus]    || '').trim();
        const curso        = String(row[colCurso]     || '').trim().replace(/^\d+\s*-\s*/, '');
        const geraAgenda   = String(row[colGeraAgenda] || '').trim();

        const statusPorDia: StatusPorDia[] = colsStatus
          .map(cs => ({ data: cs.data, status: this.normalizarStatus(String(row[cs.idx] || '')) }))
          .filter(s => s.status !== '');

        const abonada = config.aba in SEMANAS_ABONADAS;
        const pendenciaAgenda = abonada ? false : this.pendenciaService.calcularPendenciaAgenda(horasAlocar, geraAgenda);
        const pendenciaTach   = abonada ? false : this.pendenciaService.calcularPendenciaTach(statusPorDia);

        const dadosSemana = new DadosSemana({
          semana: config.semana,
          aba: config.aba,
          matricula,
          nomeDocente,
          chContrato,
          horasAlocar,
          campus,
          curso,
          geraAgenda,
          statusPorDia,
          pendenciaAgenda,
          pendenciaTach,
          abonada,
          motivoAbono: abonada ? SEMANAS_ABONADAS[config.aba] : undefined,
        });

        let docente = repositorio.encontrarPorMatricula(matricula);
        if (docente) {
          docente.adicionarSemana(dadosSemana);
        } else {
          docente = new Docente({ matricula, nomeDocente, campus });
          docente.adicionarSemana(dadosSemana);
          repositorio.salvar(docente);
        }
      }
    }
  }
}

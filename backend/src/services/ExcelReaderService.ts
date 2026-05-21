import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import {
  DadosSemana,
  Docente,
  SEMANAS_CONFIG,
  STATUS_TACH_COM_PENDENCIA,
} from '../types';

export class ExcelReaderService {
  private normalizarTexto(texto: string): string {
    return texto
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .trim();
  }

  private encontrarColuna(headers: string[], termos: string[]): number {
    const headersNorm = headers.map(h => this.normalizarTexto(String(h || '')));
    for (const termo of termos) {
      const termoNorm = this.normalizarTexto(termo);
      const idx = headersNorm.findIndex(h => h.includes(termoNorm));
      if (idx !== -1) return idx;
    }
    return -1;
  }

  private normalizarStatus(status: string): string {
    return status.toString().toUpperCase().trim();
  }

  private temPendenciaTach(statusPorDia: { data: string; status: string }[]): boolean {
    const statuses = statusPorDia
      .map(s => this.normalizarStatus(s.status))
      .filter(s => s !== '' && s !== 'APROVADO');
    return statuses.length > 0 && statuses.some(s => STATUS_TACH_COM_PENDENCIA.includes(s));
  }

  private temPendenciaAgenda(chContrato: number, horasAlocar: number): boolean {
    return horasAlocar > 0;
  }

  lerPlanilha(caminhoArquivo: string): Docente[] {
    if (!fs.existsSync(caminhoArquivo)) {
      throw new Error(`Arquivo não encontrado: ${caminhoArquivo}`);
    }

    const wb = XLSX.readFile(caminhoArquivo);
    const docentesMap = new Map<number, Docente>();

    for (const config of SEMANAS_CONFIG) {
      const ws = wb.Sheets[config.aba];
      if (!ws) continue;

      const dados = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[][];
      if (dados.length < 2) continue;

      const headers = dados[0].map((h: any) => String(h || ''));

      const colMatricula = this.encontrarColuna(headers, ['matricula', 'matrícula']);
      const colNome = this.encontrarColuna(headers, ['nome docente', 'nome do docente', 'docente']);
      const colCH = this.encontrarColuna(headers, ['ch de contrato', 'ch total de contrato', 'ch total']);
      const colHoras = this.encontrarColuna(headers, ['horas a alocar']);
      const colCampus = this.encontrarColuna(headers, ['campus']);
      const colCurso = this.encontrarColuna(headers, ['curso']);
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

        const nomeDocente = String(row[colNome] || '').trim().toUpperCase();
        const chContrato = parseFloat(String(row[colCH] || '0').replace(',', '.')) || 0;
        const horasAlocar = parseFloat(String(row[colHoras] || '0').replace(',', '.')) || 0;
        const campus = String(row[colCampus] || '').trim();
        const curso = String(row[colCurso] || '').trim();
        const geraAgenda = String(row[colGeraAgenda] || '').trim();

        const statusPorDia = colsStatus.map(cs => ({
          data: cs.data,
          status: this.normalizarStatus(String(row[cs.idx] || '')),
        })).filter(s => s.status !== '');

        const pendenciaAgenda = this.temPendenciaAgenda(chContrato, horasAlocar);
        const pendenciaTach = this.temPendenciaTach(statusPorDia);

        const dadosSemana: DadosSemana = {
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
          resultadoAgenda: pendenciaAgenda ? 'Pendência de Agenda' : 'Sem Pendência de Agenda',
          resultadoTach: pendenciaTach ? 'Pendência de TACH' : 'Sem Pendência de TACH',
          pendenciaAgenda,
          pendenciaTach,
        };

        if (docentesMap.has(matricula)) {
          const docente = docentesMap.get(matricula)!;
          docente.semanas.push(dadosSemana);
          if (pendenciaAgenda) docente.pendenciaAgenda = true;
          if (pendenciaTach) docente.pendenciaTach = true;
        } else {
          docentesMap.set(matricula, {
            matricula,
            nomeDocente,
            campus,
            semanas: [dadosSemana],
            pendenciaAgenda,
            pendenciaTach,
            pendenciaSimultanea: false,
            tipoPendencia: 'sem_pendencia',
          });
        }
      }
    }

    const docentes = Array.from(docentesMap.values());
    docentes.forEach(d => {
      d.pendenciaSimultanea = d.pendenciaAgenda && d.pendenciaTach;
      if (d.pendenciaSimultanea) d.tipoPendencia = 'simultanea';
      else if (d.pendenciaAgenda) d.tipoPendencia = 'somente_agenda';
      else if (d.pendenciaTach) d.tipoPendencia = 'somente_tach';
      else d.tipoPendencia = 'sem_pendencia';
    });

    return docentes.sort((a, b) => a.nomeDocente.localeCompare(b.nomeDocente));
  }
}

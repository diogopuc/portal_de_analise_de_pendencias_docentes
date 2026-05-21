import { PDFDocument, rgb, StandardFonts, PageSizes } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { Docente, SEMANAS_CONFIG, STATUS_TACH_COM_PENDENCIA } from '../types';

const PRIMARY = rgb(138 / 255, 5 / 255, 56 / 255);
const DARK = rgb(30 / 255, 30 / 255, 30 / 255);
const GRAY = rgb(120 / 255, 120 / 255, 120 / 255);
const LIGHT_BG = rgb(248 / 255, 248 / 255, 248 / 255);
const WHITE = rgb(1, 1, 1);
const SUCCESS = rgb(75 / 255, 178 / 255, 24 / 255);
const WARNING_COLOR = rgb(229 / 255, 0 / 255, 12 / 255);
const ORANGE = rgb(250 / 255, 173 / 255, 20 / 255);

// Contorna ausência de borderRadius nas tipagens — suportado em runtime pelo pdf-lib 1.17+
const rr = (opts: any) => opts;

function sanitizarNomeArquivo(nome: string): string {
  return nome
    .toUpperCase()
    .replace(/\s+/g, '_')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Z0-9_]/g, '')
    .substring(0, 100);
}

function nomeMes(aba: string): string {
  const meses: Record<string, string> = {
    '04': 'Abril', '05': 'Maio', '03': 'Março', '06': 'Junho',
  };
  const mes = aba.split('.')[1];
  return meses[mes] || 'Abril';
}

export class PDFGenerationService {
  private relatoriosDir: string;
  private assetsDir: string;

  constructor(relatoriosDir: string, assetsDir: string) {
    this.relatoriosDir = relatoriosDir;
    this.assetsDir = assetsDir;
    if (!fs.existsSync(relatoriosDir)) fs.mkdirSync(relatoriosDir, { recursive: true });
  }

  async gerarPDF(docente: Docente): Promise<{ nomeArquivo: string; caminho: string; tamanhoBytes: number }> {
    const pdfDoc = await PDFDocument.create();
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let page = pdfDoc.addPage(PageSizes.A4);
    const { width, height } = page.getSize();
    const marginX = 50;
    const contentW = width - marginX * 2;
    let y = height;

    // =========================================================
    // CABEÇALHO
    // =========================================================
    page.drawRectangle({ x: 0, y: height - 100, width, height: 100, color: PRIMARY });

    const logoPath = path.join(this.assetsDir, 'logoPUCPRBranca.png');
    if (fs.existsSync(logoPath)) {
      try {
        const logoBytes = fs.readFileSync(logoPath);
        const logoImg = await pdfDoc.embedPng(logoBytes);
        const logoScale = Math.min(110 / logoImg.width, 50 / logoImg.height);
        page.drawImage(logoImg, {
          x: marginX,
          y: height - 85,
          width: logoImg.width * logoScale,
          height: logoImg.height * logoScale,
        });
      } catch (_) {}
    }

    page.drawText('PONTIFÍCIA UNIVERSIDADE CATÓLICA DO PARANÁ', {
      x: marginX + 140, y: height - 48, size: 11, font: fontBold, color: WHITE,
    });
    page.drawText('Portal de Análise de Pendências Docentes', {
      x: marginX + 140, y: height - 68, size: 9, font: fontRegular,
      color: rgb(220 / 255, 180 / 255, 200 / 255),
    });

    // =========================================================
    // SAUDAÇÃO
    // =========================================================
    y = height - 120;
    const mesNome = nomeMes(docente.semanas[0]?.aba || '01.04');

    page.drawText(`Olá, Prof(a). ${docente.nomeDocente}.`, {
      x: marginX, y, size: 12, font: fontBold, color: PRIMARY,
    });
    const nomeWidth = fontBold.widthOfTextAtSize(`Olá, Prof(a). ${docente.nomeDocente}.`, 12);
    page.drawText(`  |  Matrícula: ${docente.matricula}`, {
      x: marginX + nomeWidth, y: y + 1, size: 9, font: fontRegular, color: GRAY,
    });
    y -= 16;

    page.drawText(`Segue o detalhamento das pendências ao longo do mês de ${mesNome}.`, {
      x: marginX, y, size: 10, font: fontRegular, color: DARK,
    });
    y -= 10;
    page.drawLine({ start: { x: marginX, y }, end: { x: width - marginX, y }, thickness: 0.5, color: rgb(0.86, 0.86, 0.86) });
    y -= 18;

    // =========================================================
    // RESUMO PENDÊNCIAS
    // =========================================================
    const boxW = (contentW - 16) / 2;
    const BOX_H = 44;

    const drawResumoBox = (bx: number, label: string, valor: string, cor: typeof PRIMARY) => {
      page.drawRectangle(rr({ x: bx, y: y - BOX_H, width: boxW, height: BOX_H, color: LIGHT_BG, borderColor: cor, borderWidth: 1.5, borderRadius: 6 }));
      page.drawText(label, { x: bx + 10, y: y - 14, size: 7.5, font: fontRegular, color: GRAY });
      page.drawText(valor, { x: bx + 10, y: y - 32, size: 13, font: fontBold, color: cor });
    };

    drawResumoBox(marginX, 'PENDÊNCIA DE AGENDA', docente.pendenciaAgenda ? 'SIM' : 'NÃO', docente.pendenciaAgenda ? WARNING_COLOR : SUCCESS);
    drawResumoBox(marginX + boxW + 16, 'PENDÊNCIA DE TACH', docente.pendenciaTach ? 'SIM' : 'NÃO', docente.pendenciaTach ? WARNING_COLOR : SUCCESS);
    y -= BOX_H + 16;

    // =========================================================
    // SEMANAS
    // =========================================================
    for (const config of SEMANAS_CONFIG) {
      const semana = docente.semanas.find(s => s.aba === config.aba);
      if (!semana) continue;

      // Estima altura mínima para o bloco desta semana
      const estimativa = 32 + 18 + 28 + 10 + (semana.statusPorDia.length * 14) + 60;
      if (y < estimativa + 50) {
        page = pdfDoc.addPage(PageSizes.A4);
        y = height - 40;
      }

      // --- Título da semana ---
      const TITLE_H = 26;
      page.drawRectangle(rr({ x: marginX, y: y - TITLE_H, width: contentW, height: TITLE_H, color: PRIMARY, borderRadius: 4 }));
      page.drawText(`${config.semana}  —  ${config.periodo}`, {
        x: marginX + 10, y: y - TITLE_H + 8, size: 10, font: fontBold, color: WHITE,
      });
      y -= TITLE_H + 8;

      // --- CH Contrato ---
      page.drawText('CH Contrato:', { x: marginX + 8, y: y - 4, size: 9, font: fontBold, color: GRAY });
      page.drawText(`${semana.chContrato}h`, { x: marginX + 130, y: y - 4, size: 9, font: fontRegular, color: DARK });
      y -= 20;

      // --- Horas Pendentes de Alocação (destaque) ---
      const corHoras = semana.pendenciaAgenda ? WARNING_COLOR : SUCCESS;
      const bgHoras = semana.pendenciaAgenda ? rgb(1, 0.91, 0.91) : rgb(0.91, 1, 0.91);
      const HORAS_H = 24;
      page.drawRectangle(rr({ x: marginX, y: y - HORAS_H, width: contentW, height: HORAS_H, color: bgHoras, borderColor: corHoras, borderWidth: 1, borderRadius: 4 }));
      page.drawText('Horas Pendentes de Alocação:', { x: marginX + 8, y: y - HORAS_H + 7, size: 9, font: fontBold, color: corHoras });
      page.drawText(
        `${semana.horasAlocar.toFixed(1)}h  ${semana.pendenciaAgenda ? '(PENDÊNCIA)' : '(OK)'}`,
        { x: marginX + 195, y: y - HORAS_H + 7, size: 9, font: fontBold, color: corHoras }
      );
      y -= HORAS_H + 12;

      // --- Status por dia ---
      if (semana.statusPorDia.length > 0) {
        page.drawText('Status por dia:', { x: marginX + 8, y, size: 8.5, font: fontBold, color: GRAY });
        y -= 14;

        for (const sp of semana.statusPorDia) {
          if (!sp.status) continue;
          if (y < 70) {
            page = pdfDoc.addPage(PageSizes.A4);
            y = height - 40;
          }
          const isAprovado = sp.status === 'APROVADO';
          const corStatus = isAprovado ? SUCCESS : STATUS_TACH_COM_PENDENCIA.includes(sp.status) ? WARNING_COLOR : ORANGE;
          page.drawRectangle(rr({ x: marginX + 10, y: y - 3, width: 7, height: 7, color: corStatus, borderRadius: 1 }));
          page.drawText(`${sp.data}:`, { x: marginX + 22, y, size: 8, font: fontBold, color: GRAY });
          page.drawText(sp.status, { x: marginX + 120, y, size: 8, font: fontRegular, color: corStatus });
          y -= 13;
        }
      }

      y -= 6;

      // --- Resultados ---
      const RES_H = 20;
      const drawResultado = (label: string, valor: string, pendencia: boolean) => {
        const cor = pendencia ? WARNING_COLOR : SUCCESS;
        const bg = pendencia ? rgb(1, 0.94, 0.94) : rgb(0.94, 1, 0.94);
        page.drawRectangle(rr({ x: marginX, y: y - RES_H, width: contentW, height: RES_H, color: bg, borderColor: cor, borderWidth: 0.5, borderRadius: 3 }));
        page.drawText(`${label}: ${valor}`, { x: marginX + 8, y: y - RES_H + 6, size: 8, font: fontBold, color: cor });
        y -= RES_H + 4;
      };

      drawResultado('Agenda', semana.resultadoAgenda, semana.pendenciaAgenda);
      drawResultado('TACH', semana.resultadoTach, semana.pendenciaTach);
      y -= 14;
    }

    // =========================================================
    // RODAPÉ
    // =========================================================
    pdfDoc.getPages().forEach(pg => {
      pg.drawLine({ start: { x: marginX, y: 30 }, end: { x: width - marginX, y: 30 }, thickness: 0.5, color: GRAY });
      pg.drawText('PUCPR © 2026 — Portal de Análise de Pendências Docentes', {
        x: marginX, y: 18, size: 7, font: fontRegular, color: GRAY,
      });
      pg.drawText(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, {
        x: width - 160, y: 18, size: 7, font: fontRegular, color: GRAY,
      });
    });

    const pdfBytes = await pdfDoc.save();
    const nomeArquivo = `${sanitizarNomeArquivo(docente.nomeDocente)}.pdf`;
    const caminho = path.join(this.relatoriosDir, nomeArquivo);
    fs.writeFileSync(caminho, pdfBytes);

    return { nomeArquivo, caminho, tamanhoBytes: pdfBytes.length };
  }

  async gerarTodosPDFs(
    docentes: Docente[],
    onProgress?: (atual: number, total: number) => void
  ): Promise<{ nomeArquivo: string; caminho: string; tamanhoBytes: number }[]> {
    const resultados = [];
    for (let i = 0; i < docentes.length; i++) {
      const resultado = await this.gerarPDF(docentes[i]);
      resultados.push(resultado);
      if (onProgress) onProgress(i + 1, docentes.length);
    }
    return resultados;
  }

  listarPDFs(): { nomeArquivo: string; caminho: string; tamanhoBytes: number; geradoEm: string }[] {
    if (!fs.existsSync(this.relatoriosDir)) return [];
    return fs.readdirSync(this.relatoriosDir)
      .filter(f => f.endsWith('.pdf'))
      .map(f => {
        const caminho = path.join(this.relatoriosDir, f);
        const stat = fs.statSync(caminho);
        return { nomeArquivo: f, caminho, tamanhoBytes: stat.size, geradoEm: stat.mtime.toISOString() };
      })
      .sort((a, b) => b.geradoEm.localeCompare(a.geradoEm));
  }

  excluirPDF(nomeArquivo: string): void {
    const caminho = path.join(this.relatoriosDir, path.basename(nomeArquivo));
    if (fs.existsSync(caminho)) fs.unlinkSync(caminho);
  }
}

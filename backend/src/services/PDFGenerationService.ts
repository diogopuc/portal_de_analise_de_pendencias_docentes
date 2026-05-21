import { PDFDocument, rgb, StandardFonts, PageSizes } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { Docente, SEMANAS_CONFIG, STATUS_TACH_COM_PENDENCIA } from '../types';

const PRIMARY = rgb(138 / 255, 5 / 255, 56 / 255);
const HEADER_BG = rgb(180 / 255, 25 / 255, 72 / 255);
const DARK = rgb(30 / 255, 30 / 255, 30 / 255);
const GRAY = rgb(120 / 255, 120 / 255, 120 / 255);
const LIGHT_BG = rgb(245 / 255, 245 / 255, 245 / 255);
const WHITE = rgb(1, 1, 1);
const SUCCESS = rgb(75 / 255, 178 / 255, 24 / 255);
const WARNING_COLOR = rgb(229 / 255, 0 / 255, 12 / 255);
const ORANGE = rgb(250 / 255, 173 / 255, 20 / 255);

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
    let y = height - 40;

    // === CABEÇALHO ===
    page.drawRectangle({ x: 0, y: height - 100, width, height: 100, color: HEADER_BG });

    const logoPath = path.join(this.assetsDir, 'logoPUCRelatorio.png');
    if (fs.existsSync(logoPath)) {
      try {
        const logoBytes = fs.readFileSync(logoPath);
        const logoImg = await pdfDoc.embedPng(logoBytes);
        const logoScale = Math.min(110 / logoImg.width, 50 / logoImg.height);
        const logoW = logoImg.width * logoScale;
        const logoH = logoImg.height * logoScale;
        const logoPadX = 10;
        const logoPadY = 8;
        // Fundo branco atrás da logo
        page.drawRectangle({
          x: marginX - logoPadX,
          y: height - 85 - logoPadY,
          width: logoW + logoPadX * 2,
          height: logoH + logoPadY * 2,
          color: WHITE,
        });
        page.drawImage(logoImg, {
          x: marginX,
          y: height - 85,
          width: logoW,
          height: logoH,
        });
      } catch (_) {}
    }

    page.drawText('PONTIFÍCIA UNIVERSIDADE CATÓLICA DO PARANÁ', {
      x: marginX + 140,
      y: height - 48,
      size: 11,
      font: fontBold,
      color: WHITE,
    });
    page.drawText('Portal de Análise de Pendências Docentes', {
      x: marginX + 140,
      y: height - 68,
      size: 9,
      font: fontRegular,
      color: rgb(220 / 255, 180 / 255, 200 / 255),
    });

    y = height - 120;

    // === SAUDAÇÃO ===
    const mesNome = nomeMes(docente.semanas[0]?.aba || '01.04');
    page.drawText(`Olá, Prof(a). ${docente.nomeDocente}.`, {
      x: marginX,
      y,
      size: 12,
      font: fontBold,
      color: PRIMARY,
    });
    const nomeWidth = fontBold.widthOfTextAtSize(`Olá, Prof(a). ${docente.nomeDocente}.`, 12);
    page.drawText(`  |  Matrícula: ${docente.matricula}`, {
      x: marginX + nomeWidth,
      y: y + 1,
      size: 9,
      font: fontRegular,
      color: GRAY,
    });
    y -= 18;
    page.drawText(`Segue o detalhamento das pendências ao longo do mês de ${mesNome}.`, {
      x: marginX,
      y,
      size: 10,
      font: fontRegular,
      color: DARK,
    });
    y -= 8;
    page.drawLine({ start: { x: marginX, y }, end: { x: width - marginX, y }, thickness: 1, color: rgb(220 / 255, 220 / 255, 220 / 255) });
    y -= 20;

    // === RESUMO ===
    const boxW = (width - marginX * 2 - 20) / 2;
    const drawResumoBox = (x: number, yy: number, label: string, valor: string, cor: typeof PRIMARY) => {
      page.drawRectangle({ x, y: yy - 36, width: boxW, height: 40, color: LIGHT_BG, borderColor: cor, borderWidth: 1 });
      page.drawText(label, { x: x + 10, y: yy - 10, size: 8, font: fontRegular, color: GRAY });
      page.drawText(valor, { x: x + 10, y: yy - 28, size: 11, font: fontBold, color: cor });
    };

    drawResumoBox(marginX, y, 'PENDÊNCIA DE AGENDA', docente.pendenciaAgenda ? 'SIM' : 'NÃO', docente.pendenciaAgenda ? WARNING_COLOR : SUCCESS);
    drawResumoBox(marginX + boxW + 20, y, 'PENDÊNCIA DE TACH', docente.pendenciaTach ? 'SIM' : 'NÃO', docente.pendenciaTach ? WARNING_COLOR : SUCCESS);
    y -= 52;

    // === SEMANAS ===
    for (const config of SEMANAS_CONFIG) {
      const semana = docente.semanas.find(s => s.aba === config.aba);
      if (!semana) continue;

      if (y < 140) {
        page = pdfDoc.addPage(PageSizes.A4);
        y = height - 40;
      }

      // Título da semana
      page.drawRectangle({ x: marginX, y: y - 22, width: width - marginX * 2, height: 24, color: PRIMARY });
      page.drawText(`${config.semana}  —  ${config.periodo}`, {
        x: marginX + 10, y: y - 14, size: 10, font: fontBold, color: WHITE,
      });
      y -= 30;

      // Dados do docente nesta semana
      const drawInfoRow = (label: string, valor: string) => {
        page.drawText(`${label}:`, { x: marginX + 5, y, size: 9, font: fontBold, color: GRAY });
        page.drawText(valor, { x: marginX + 120, y, size: 9, font: fontRegular, color: DARK });
        y -= 14;
      };

      drawInfoRow('CH Contrato', `${semana.chContrato}h`);

      // Horas Pendentes de Alocação — campo em destaque
      const corHoras = semana.pendenciaAgenda ? WARNING_COLOR : SUCCESS;
      const bgHoras = semana.pendenciaAgenda ? rgb(1, 0.92, 0.92) : rgb(0.92, 1, 0.92);
      page.drawRectangle({ x: marginX, y: y - 7, width: width - marginX * 2, height: 22, color: bgHoras, borderColor: corHoras, borderWidth: 1 });
      page.drawText('Horas Pendentes de Alocação:', { x: marginX + 8, y: y + 3, size: 9, font: fontBold, color: corHoras });
      page.drawText(`${semana.horasAlocar.toFixed(1)}h  ${semana.pendenciaAgenda ? '(PENDÊNCIA)' : '(OK)'}`, { x: marginX + 190, y: y + 3, size: 9, font: fontBold, color: corHoras });
      y -= 28;

      y -= 4;

      // Status por dia
      if (semana.statusPorDia.length > 0) {
        page.drawText('Status por dia:', { x: marginX + 5, y, size: 9, font: fontBold, color: GRAY });
        y -= 14;

        for (const sp of semana.statusPorDia) {
          if (!sp.status) continue;
          if (y < 60) {
            page = pdfDoc.addPage(PageSizes.A4);
            y = height - 40;
          }
          const isAprovado = sp.status === 'APROVADO';
          const corStatus = isAprovado ? SUCCESS : STATUS_TACH_COM_PENDENCIA.includes(sp.status) ? WARNING_COLOR : ORANGE;
          page.drawRectangle({ x: marginX + 10, y: y - 4, width: 8, height: 8, color: corStatus });
          page.drawText(`${sp.data}:`, { x: marginX + 24, y, size: 8, font: fontBold, color: GRAY });
          page.drawText(sp.status, { x: marginX + 120, y, size: 8, font: fontRegular, color: corStatus });
          y -= 13;
        }
      }

      // Resultados
      y -= 4;
      const drawResultado = (label: string, valor: string, pendencia: boolean) => {
        const cor = pendencia ? WARNING_COLOR : SUCCESS;
        page.drawRectangle({ x: marginX, y: y - 4, width: width - marginX * 2, height: 16, color: pendencia ? rgb(1, 0.94, 0.94) : rgb(0.94, 1, 0.94) });
        page.drawText(`${label}: ${valor}`, { x: marginX + 8, y, size: 8, font: fontBold, color: cor });
        y -= 18;
      };

      drawResultado('Agenda', semana.resultadoAgenda, semana.pendenciaAgenda);
      drawResultado('TACH', semana.resultadoTach, semana.pendenciaTach);
      y -= 10;
    }

    // === RODAPÉ ===
    const addFooter = (pg: typeof page) => {
      pg.drawLine({ start: { x: marginX, y: 30 }, end: { x: width - marginX, y: 30 }, thickness: 0.5, color: GRAY });
      pg.drawText('PUCPR © 2026 — Portal de Análise de Pendências Docentes', {
        x: marginX, y: 18, size: 7, font: fontRegular, color: GRAY,
      });
      pg.drawText(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, {
        x: width - 160, y: 18, size: 7, font: fontRegular, color: GRAY,
      });
    };

    pdfDoc.getPages().forEach(pg => addFooter(pg));

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

import { PDFDocument, rgb, StandardFonts, PageSizes } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { Docente, SEMANAS_CONFIG, STATUS_TACH_COM_PENDENCIA } from '../types';

const PRIMARY = rgb(138 / 255, 5 / 255, 56 / 255);
const DARK = rgb(30 / 255, 30 / 255, 30 / 255);
const GRAY = rgb(120 / 255, 120 / 255, 120 / 255);
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
    const HEADER_H = 110;
    page.drawRectangle({ x: 0, y: height - HEADER_H, width, height: HEADER_H, color: PRIMARY });

    const headerCenterY = height - HEADER_H / 2;
    let textStartX = marginX;

    const logoPath = path.join(this.assetsDir, 'logoPUCPRBranca.png');
    if (fs.existsSync(logoPath)) {
      try {
        const logoBytes = fs.readFileSync(logoPath);
        const logoImg = await pdfDoc.embedPng(logoBytes);
        const logoScale = Math.min(120 / logoImg.width, 70 / logoImg.height);
        const logoW = logoImg.width * logoScale;
        const logoH = logoImg.height * logoScale;
        page.drawImage(logoImg, {
          x: marginX,
          y: headerCenterY - logoH / 2,
          width: logoW,
          height: logoH,
        });
        textStartX = marginX + logoW + 22;
      } catch (_) {}
    }

    const titleText    = 'PONTIFÍCIA UNIVERSIDADE CATÓLICA DO PARANÁ';
    const subtitleText = 'Portal de Análise de Pendências Docentes';
    const remainingW   = width - marginX - textStartX;
    const titleX    = textStartX + (remainingW - fontBold.widthOfTextAtSize(titleText, 11)) / 2;
    const subtitleX = textStartX + (remainingW - fontRegular.widthOfTextAtSize(subtitleText, 9)) / 2;

    page.drawText(titleText, {
      x: titleX, y: headerCenterY + 8, size: 11, font: fontBold, color: WHITE,
    });
    page.drawText(subtitleText, {
      x: subtitleX, y: headerCenterY - 10, size: 9, font: fontRegular,
      color: rgb(220 / 255, 180 / 255, 200 / 255),
    });

    // =========================================================
    // SAUDAÇÃO
    // =========================================================
    y = height - HEADER_H - 20;
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
    // RESUMO PENDÊNCIAS — exibe apenas as pendências presentes
    // =========================================================
    const BOX_H = 44;
    const boxesAtivos: { label: string }[] = [];
    if (docente.pendenciaTach)   boxesAtivos.push({ label: 'PENDÊNCIA DE TACH' });
    if (docente.pendenciaAgenda) boxesAtivos.push({ label: 'PENDÊNCIA DE AGENDA' });

    const boxWDinamico = boxesAtivos.length === 1 ? 190 : (contentW - 16) / 2;
    const drawResumoBox = (bx: number, bw: number, label: string) => {
      page.drawRectangle(rr({ x: bx, y: y - BOX_H, width: bw, height: BOX_H, color: rgb(1, 0.94, 0.94), borderColor: WARNING_COLOR, borderWidth: 1.5, borderRadius: 6 }));
      page.drawText(label, { x: bx + 10, y: y - 14, size: 7.5, font: fontRegular, color: GRAY });
      page.drawText('SIM', { x: bx + 10, y: y - 32, size: 13, font: fontBold, color: WARNING_COLOR });
    };

    boxesAtivos.forEach((box, i) => {
      drawResumoBox(marginX + i * (boxWDinamico + 16), boxWDinamico, box.label);
    });
    y -= BOX_H + 16;

    // =========================================================
    // SEMANAS
    // =========================================================
    const mapearStatus = (status: string) =>
      status === 'FINALIZADO' ? 'NECESSÁRIO CRIAR NOVO TACH' : status;

    for (const config of SEMANAS_CONFIG) {
      const semana = docente.semanas.find(s => s.aba === config.aba);
      if (!semana) continue;

      // Omite a semana inteira se não há nenhuma pendência nela
      if (!semana.pendenciaAgenda && !semana.pendenciaTach) continue;

      // Estima altura mínima para o bloco desta semana
      const linhasTach = semana.pendenciaTach ? semana.statusPorDia.length : 0;
      const estimativa = 32 + (semana.pendenciaAgenda ? 28 + 10 : 0) + (semana.pendenciaTach ? 14 + linhasTach * 14 : 0) + 40;
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

      // --- Helper de resultado (sempre vermelho — só chamado quando há pendência) ---
      const RES_H = 20;
      const drawResultado = (texto: string) => {
        if (y < 70) { page = pdfDoc.addPage(PageSizes.A4); y = height - 40; }
        page.drawRectangle(rr({ x: marginX, y: y - RES_H, width: contentW, height: RES_H, color: rgb(1, 0.94, 0.94), borderColor: WARNING_COLOR, borderWidth: 0.5, borderRadius: 3 }));
        page.drawText(texto, { x: marginX + 8, y: y - RES_H + 6, size: 8, font: fontBold, color: WARNING_COLOR });
        y -= RES_H + 4;
      };

      // --- Resultado de Agenda (antes das horas, sem prefixo "Agenda:") ---
      if (semana.pendenciaAgenda) drawResultado(semana.resultadoAgenda);

      // --- Horas Pendentes de Alocação ---
      if (semana.pendenciaAgenda) {
        const HORAS_H = 24;
        page.drawRectangle(rr({ x: marginX, y: y - HORAS_H, width: contentW, height: HORAS_H, color: rgb(1, 0.91, 0.91), borderColor: WARNING_COLOR, borderWidth: 1, borderRadius: 4 }));
        page.drawText('Horas Pendentes de Alocação:', { x: marginX + 8, y: y - HORAS_H + 7, size: 9, font: fontBold, color: WARNING_COLOR });
        page.drawText(`${semana.horasAlocar.toFixed(1)}h  (PENDÊNCIA)`, { x: marginX + 195, y: y - HORAS_H + 7, size: 9, font: fontBold, color: WARNING_COLOR });
        y -= HORAS_H + 12;
      }

      // --- Resultado de TACH (antes do status por dia, sem prefixo "TACH:") ---
      if (semana.pendenciaTach) drawResultado(semana.resultadoTach);

      // --- Status por dia (apenas se há pendência de TACH) ---
      if (semana.pendenciaTach && semana.statusPorDia.length > 0) {
        y -= 8;
        page.drawText('Status por dia:', { x: marginX + 8, y, size: 8.5, font: fontBold, color: GRAY });
        y -= 14;

        for (const sp of semana.statusPorDia) {
          if (!sp.status) continue;
          if (y < 70) {
            page = pdfDoc.addPage(PageSizes.A4);
            y = height - 40;
          }
          const statusExibido = mapearStatus(sp.status);
          const isAprovado = sp.status === 'APROVADO';
          const corStatus = isAprovado ? SUCCESS : STATUS_TACH_COM_PENDENCIA.includes(sp.status) ? WARNING_COLOR : ORANGE;
          page.drawRectangle(rr({ x: marginX + 10, y: y - 3, width: 7, height: 7, color: corStatus, borderRadius: 1 }));
          page.drawText(`${sp.data}:`, { x: marginX + 22, y, size: 8, font: fontBold, color: GRAY });
          page.drawText(statusExibido, { x: marginX + 120, y, size: 8, font: fontRegular, color: corStatus });
          y -= 13;
        }
      }

      y -= 6;
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
      .sort((a, b) => a.nomeArquivo.localeCompare(b.nomeArquivo));
  }

  excluirPDF(nomeArquivo: string): void {
    const caminho = path.join(this.relatoriosDir, path.basename(nomeArquivo));
    if (fs.existsSync(caminho)) fs.unlinkSync(caminho);
  }
}

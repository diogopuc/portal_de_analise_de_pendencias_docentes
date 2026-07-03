import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import archiver from 'archiver';
import { ProcessarPlanilhaUseCase } from '../application/use-cases/ProcessarPlanilhaUseCase';
import { GerarRelatorioUseCase } from '../application/use-cases/GerarRelatorioUseCase';
import { IDocenteRepository } from '../domain/repositories/IDocenteRepository';
import { PdfRelatorioGenerator } from '../infrastructure/generators/PdfRelatorioGenerator';

const upload = multer({
  dest: path.join(process.cwd(), '..', 'temp'),
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.originalname.endsWith('.xlsx')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos .xlsx são permitidos'));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 },
});

export function relatoriosRoutes(
  processarPlanilha: ProcessarPlanilhaUseCase,
  gerarRelatorio: GerarRelatorioUseCase,
  repositorio: IDocenteRepository,
  pdfGerador: PdfRelatorioGenerator,
  dataDir: string,
): Router {
  const router = Router();

  // POST /processar
  router.post('/processar', upload.single('arquivo'), async (req: Request, res: Response) => {
    try {
      let caminhoArquivo: string;
      if (req.file) {
        caminhoArquivo = req.file.path;
      } else {
        const padrao = path.join(dataDir, 'Atv_Pendentes_Abril.xlsx');
        if (!fs.existsSync(padrao)) {
          return res.status(400).json({ erro: 'Nenhum arquivo enviado e arquivo padrão não encontrado.' });
        }
        caminhoArquivo = padrao;
      }

      await processarPlanilha.executar(caminhoArquivo);

      if (req.file) {
        try { fs.unlinkSync(caminhoArquivo); } catch (_) {}
      }

      res.json({
        sucesso: true,
        mensagem: `Processamento concluído. ${repositorio.listarTodos().length} docentes encontrados.`,
        totalDocentes: repositorio.listarTodos().length,
      });
    } catch (err: any) {
      processarPlanilha.addLog('erro', 'Falha no processamento', err.message);
      res.status(500).json({ erro: err.message });
    }
  });

  // POST /gerar/:matricula
  router.post('/gerar/:matricula', async (req: Request, res: Response) => {
    try {
      const resultado = await gerarRelatorio.executar(parseInt(req.params.matricula));
      processarPlanilha.addLog('sucesso', `PDF gerado: ${resultado.nomeArquivo}`);
      res.json({ sucesso: true, ...resultado });
    } catch (err: any) {
      res.status(err.message === 'Docente não encontrado' ? 404 : 500).json({ erro: err.message });
    }
  });

  // POST /gerar-todos
  router.post('/gerar-todos', async (_req: Request, res: Response) => {
    try {
      if (!repositorio.temDocentes()) {
        return res.status(400).json({ erro: 'Planilha não processada ainda.' });
      }
      processarPlanilha.addLog('info', 'Iniciando geração em lote...');
      const resultados = await gerarRelatorio.executarTodos();
      processarPlanilha.addLog('sucesso', `${resultados.length} PDFs gerados com sucesso.`);
      res.json({ sucesso: true, total: resultados.length, arquivos: resultados.map(r => r.nomeArquivo) });
    } catch (err: any) {
      res.status(500).json({ erro: err.message });
    }
  });

  // GET /download/:nomeArquivo
  router.get('/download/:nomeArquivo', (req: Request, res: Response) => {
    const nomeArquivo = path.basename(req.params.nomeArquivo);
    const caminho = path.join(dataDir, 'relatorios', nomeArquivo);
    if (!fs.existsSync(caminho)) return res.status(404).json({ erro: 'Arquivo não encontrado' });
    res.download(caminho, nomeArquivo);
  });

  // GET /visualizar/:nomeArquivo
  router.get('/visualizar/:nomeArquivo', (req: Request, res: Response) => {
    const nomeArquivo = path.basename(req.params.nomeArquivo);
    const caminho = path.join(dataDir, 'relatorios', nomeArquivo);
    if (!fs.existsSync(caminho)) return res.status(404).json({ erro: 'Arquivo não encontrado' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${nomeArquivo}"`);
    res.sendFile(caminho);
  });

  // GET /download-zip/todos
  router.get('/download-zip/todos', async (_req: Request, res: Response) => {
    const pdfs = pdfGerador.listarPDFs();
    if (pdfs.length === 0) return res.status(404).json({ erro: 'Nenhum PDF disponível' });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="relatorios_pendencias.zip"');
    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.pipe(res);
    pdfs.forEach(pdf => archive.file(pdf.caminho, { name: pdf.nomeArquivo }));
    await archive.finalize();
  });

  // GET /download-zip/:tipo
  const TIPOS_ZIP: Record<string, { tipo: string; nomeZip: string }> = {
    'simultaneas':    { tipo: 'simultanea',    nomeZip: 'pendencias_simultaneas.zip' },
    'somente-agenda': { tipo: 'somente_agenda', nomeZip: 'pendencias_somente_agenda.zip' },
    'somente-tach':   { tipo: 'somente_tach',   nomeZip: 'pendencias_somente_tach.zip' },
  };

  const sanitizarNome = (nome: string, matricula: number) =>
    nome.toUpperCase().replace(/\s+/g, '_').normalize('NFD')
      .replace(/[̀-ͯ]/g, '').replace(/[^A-Z0-9_]/g, '').substring(0, 100) + `_${matricula}.pdf`;

  router.get('/download-zip/:tipo', async (req: Request, res: Response) => {
    const config = TIPOS_ZIP[req.params.tipo];
    if (!config) return res.status(404).json({ erro: 'Tipo inválido' });
    if (!repositorio.temDocentes()) return res.status(400).json({ erro: 'Planilha não processada ainda.' });

    const docentes = repositorio.listarTodos().filter(d => d.tipoPendencia === config.tipo);
    if (docentes.length === 0) return res.status(404).json({ erro: 'Nenhum docente encontrado para este tipo.' });

    const nomesFiltrados = new Set(docentes.map(d => sanitizarNome(d.nomeDocente, d.matricula)));
    const pdfs = pdfGerador.listarPDFs().filter(p => nomesFiltrados.has(p.nomeArquivo));
    if (pdfs.length === 0) return res.status(404).json({ erro: 'Nenhum PDF disponível para este tipo. Gere os PDFs primeiro.' });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${config.nomeZip}"`);
    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.pipe(res);
    pdfs.forEach(pdf => archive.file(pdf.caminho, { name: pdf.nomeArquivo }));
    await archive.finalize();
  });

  // GET /lista
  router.get('/lista', (req: Request, res: Response) => {
    const { busca, pagina = '1', limite = '20' } = req.query as Record<string, string>;
    let pdfs = pdfGerador.listarPDFs();
    if (busca) pdfs = pdfs.filter(p => p.nomeArquivo.toLowerCase().includes(busca.toLowerCase()));

    const total     = pdfs.length;
    const paginaNum = Math.max(1, parseInt(pagina));
    const limiteNum = Math.min(100, Math.max(1, parseInt(limite)));
    const inicio    = (paginaNum - 1) * limiteNum;

    res.json({ relatorios: pdfs.slice(inicio, inicio + limiteNum), total, pagina: paginaNum, limite: limiteNum, totalPaginas: Math.ceil(total / limiteNum) });
  });

  // DELETE /:nomeArquivo
  router.delete('/:nomeArquivo', (req: Request, res: Response) => {
    try {
      pdfGerador.excluirPDF(req.params.nomeArquivo);
      processarPlanilha.addLog('info', `PDF excluído: ${req.params.nomeArquivo}`);
      res.json({ sucesso: true });
    } catch (err: any) {
      res.status(500).json({ erro: err.message });
    }
  });

  // GET /status
  router.get('/status', (_req: Request, res: Response) => {
    res.json(processarPlanilha.getStatus());
  });

  // GET /logs
  router.get('/logs', (_req: Request, res: Response) => {
    res.json(processarPlanilha.getLogs());
  });

  return router;
}

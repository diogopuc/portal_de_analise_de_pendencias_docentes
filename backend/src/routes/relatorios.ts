import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import archiver from 'archiver';
import { v4 as uuidv4 } from 'uuid';
import { ProcessingService } from '../services/ProcessingService';
import { PDFGenerationService } from '../services/PDFGenerationService';

const upload = multer({
  dest: path.join(process.cwd(), '..', 'temp'),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.originalname.endsWith('.xlsx')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos .xlsx são permitidos'));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 },
});

export function relatoriosRoutes(
  processingService: ProcessingService,
  pdfService: PDFGenerationService,
  dataDir: string
): Router {
  const router = Router();

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

      await processingService.processarPlanilha(caminhoArquivo);

      if (req.file) {
        try { fs.unlinkSync(caminhoArquivo); } catch (_) {}
      }

      res.json({
        sucesso: true,
        mensagem: `Processamento concluído. ${processingService.getDocentes().length} docentes encontrados.`,
        totalDocentes: processingService.getDocentes().length,
      });
    } catch (err: any) {
      processingService.addLogExterno('erro', 'Falha no processamento', err.message);
      res.status(500).json({ erro: err.message });
    }
  });

  router.post('/gerar/:matricula', async (req: Request, res: Response) => {
    try {
      const matricula = parseInt(req.params.matricula);
      const docente = processingService.getDocente(matricula);
      if (!docente) return res.status(404).json({ erro: 'Docente não encontrado' });

      const resultado = await pdfService.gerarPDF(docente);
      processingService.addLogExterno('sucesso', `PDF gerado: ${resultado.nomeArquivo}`);
      res.json({ sucesso: true, nomeArquivo: resultado.nomeArquivo, tamanhoBytes: resultado.tamanhoBytes });
    } catch (err: any) {
      res.status(500).json({ erro: err.message });
    }
  });

  router.post('/gerar-todos', async (req: Request, res: Response) => {
    try {
      if (!processingService.isProcessado()) {
        return res.status(400).json({ erro: 'Planilha não processada ainda.' });
      }

      const docentes = processingService.getDocentes().filter(d => d.tipoPendencia !== 'sem_pendencia');
      processingService.addLogExterno('info', `Iniciando geração em lote de ${docentes.length} PDFs...`);

      const resultados = await pdfService.gerarTodosPDFs(docentes);
      processingService.addLogExterno('sucesso', `${resultados.length} PDFs gerados com sucesso.`);

      res.json({ sucesso: true, total: resultados.length, arquivos: resultados.map(r => r.nomeArquivo) });
    } catch (err: any) {
      res.status(500).json({ erro: err.message });
    }
  });

  router.get('/download/:nomeArquivo', (req: Request, res: Response) => {
    const nomeArquivo = path.basename(req.params.nomeArquivo);
    const caminho = path.join(dataDir, 'relatorios', nomeArquivo);
    if (!fs.existsSync(caminho)) return res.status(404).json({ erro: 'Arquivo não encontrado' });
    res.download(caminho, nomeArquivo);
  });

  router.get('/download-zip/todos', async (req: Request, res: Response) => {
    const relatoriosDir = path.join(dataDir, 'relatorios');
    const pdfs = pdfService.listarPDFs();
    if (pdfs.length === 0) return res.status(404).json({ erro: 'Nenhum PDF disponível' });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="relatorios_pendencias.zip"');

    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.pipe(res);
    pdfs.forEach(pdf => archive.file(pdf.caminho, { name: pdf.nomeArquivo }));
    await archive.finalize();
  });

  router.get('/lista', (req: Request, res: Response) => {
    const { busca, pagina = '1', limite = '20' } = req.query as Record<string, string>;
    let pdfs = pdfService.listarPDFs();

    if (busca) {
      const buscaNorm = busca.toLowerCase();
      pdfs = pdfs.filter(p => p.nomeArquivo.toLowerCase().includes(buscaNorm));
    }

    const total = pdfs.length;
    const paginaNum = Math.max(1, parseInt(pagina));
    const limiteNum = Math.min(100, Math.max(1, parseInt(limite)));
    const inicio = (paginaNum - 1) * limiteNum;

    res.json({
      relatorios: pdfs.slice(inicio, inicio + limiteNum),
      total,
      pagina: paginaNum,
      limite: limiteNum,
      totalPaginas: Math.ceil(total / limiteNum),
    });
  });

  router.delete('/:nomeArquivo', (req: Request, res: Response) => {
    try {
      pdfService.excluirPDF(req.params.nomeArquivo);
      processingService.addLogExterno('info', `PDF excluído: ${req.params.nomeArquivo}`);
      res.json({ sucesso: true });
    } catch (err: any) {
      res.status(500).json({ erro: err.message });
    }
  });

  router.get('/status', (req: Request, res: Response) => {
    res.json(processingService.getStatus());
  });

  router.get('/logs', (req: Request, res: Response) => {
    res.json(processingService.getLogs());
  });

  return router;
}

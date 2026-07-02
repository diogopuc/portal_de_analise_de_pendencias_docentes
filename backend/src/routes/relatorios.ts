// =============================================================================
// relatorios.ts — Rotas da API de relatórios PDF
//
// Responsabilidades:
//   - Processar o upload da planilha Excel (.xlsx)
//   - Gerar PDFs individuais ou em lote para os docentes
//   - Servir PDFs para download ou visualização no navegador
//   - Listar, buscar e excluir PDFs gerados
//   - Expor status do processamento e logs de auditoria
// =============================================================================

import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import archiver from 'archiver';
import { v4 as uuidv4 } from 'uuid';
import { ProcessingService } from '../services/ProcessingService';
import { PDFGenerationService } from '../services/PDFGenerationService';

// -----------------------------------------------------------------------------
// Configuração do Multer — middleware de upload de arquivos
//
// - dest: pasta temporária onde o arquivo fica antes de ser processado
// - fileFilter: rejeita qualquer arquivo que não seja .xlsx
// - limits: tamanho máximo de 50 MB por arquivo
// -----------------------------------------------------------------------------
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

// -----------------------------------------------------------------------------
// relatoriosRoutes — Factory que cria e retorna o Router Express
//
// Recebe as dependências via injeção para evitar acoplamento direto:
//   - processingService: lê a planilha, consolida docentes e expõe os dados
//   - pdfService: gera, lista e exclui os arquivos PDF
//   - dataDir: caminho raiz da pasta /data (onde ficam planilhas e relatórios)
// -----------------------------------------------------------------------------
export function relatoriosRoutes(
  processingService: ProcessingService,
  pdfService: PDFGenerationService,
  dataDir: string
): Router {
  const router = Router();

  // ---------------------------------------------------------------------------
  // POST /processar
  //
  // Processa a planilha Excel e carrega os dados dos docentes em memória.
  //
  // Fluxo:
  //   1. Se um arquivo foi enviado via multipart/form-data, usa ele
  //   2. Caso contrário, tenta usar o arquivo padrão em data/Atv_Pendentes_Abril.xlsx
  //   3. Chama processingService.processarPlanilha() que lê todas as abas semanais,
  //      aplica as regras de negócio e consolida os docentes por matrícula
  //   4. Remove o arquivo temporário do upload (se houver)
  //   5. Retorna o total de docentes encontrados
  // ---------------------------------------------------------------------------
  router.post('/processar', upload.single('arquivo'), async (req: Request, res: Response) => {
    try {
      let caminhoArquivo: string;

      if (req.file) {
        // Arquivo enviado pelo usuário via upload
        caminhoArquivo = req.file.path;
      } else {
        // Fallback: usa a planilha padrão gravada em /data
        const padrao = path.join(dataDir, 'Atv_Pendentes_Abril.xlsx');
        if (!fs.existsSync(padrao)) {
          return res.status(400).json({ erro: 'Nenhum arquivo enviado e arquivo padrão não encontrado.' });
        }
        caminhoArquivo = padrao;
      }

      // Lê e processa todas as abas semanais da planilha
      await processingService.processarPlanilha(caminhoArquivo);

      // Remove o arquivo temporário do upload para não acumular lixo em /temp
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

  // ---------------------------------------------------------------------------
  // POST /gerar/:matricula
  //
  // Gera o PDF individual de um único docente identificado pela matrícula.
  //
  // Fluxo:
  //   1. Busca o docente pelo número de matrícula nos dados já processados
  //   2. Chama pdfService.gerarPDF() que monta o relatório com cabeçalho,
  //      resumo de pendências e detalhamento semanal
  //   3. Grava o PDF em /data/relatorios/NOME_DO_DOCENTE.pdf
  //   4. Retorna nome do arquivo e tamanho em bytes
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // POST /gerar-todos
  //
  // Gera PDFs em lote para todos os docentes com algum tipo de pendência
  // (exclui docentes classificados como 'sem_pendencia').
  //
  // Fluxo:
  //   1. Verifica se a planilha já foi processada
  //   2. Filtra apenas docentes com pendência (agenda, TACH ou simultânea)
  //   3. Chama pdfService.gerarTodosPDFs() que itera e gera cada PDF sequencialmente
  //   4. Retorna a lista de nomes de arquivo gerados
  // ---------------------------------------------------------------------------
  router.post('/gerar-todos', async (req: Request, res: Response) => {
    try {
      if (!processingService.isProcessado()) {
        return res.status(400).json({ erro: 'Planilha não processada ainda.' });
      }

      // Exclui docentes sem pendência — não faz sentido gerar relatório para eles
      const docentes = processingService.getDocentes().filter(d => d.tipoPendencia !== 'sem_pendencia');
      processingService.addLogExterno('info', `Iniciando geração em lote de ${docentes.length} PDFs...`);

      const resultados = await pdfService.gerarTodosPDFs(docentes);
      processingService.addLogExterno('sucesso', `${resultados.length} PDFs gerados com sucesso.`);

      res.json({ sucesso: true, total: resultados.length, arquivos: resultados.map(r => r.nomeArquivo) });
    } catch (err: any) {
      res.status(500).json({ erro: err.message });
    }
  });

  // ---------------------------------------------------------------------------
  // GET /download/:nomeArquivo
  //
  // Serve o PDF com Content-Disposition: attachment — o navegador faz download
  // do arquivo em vez de abri-lo. Usa path.basename() para bloquear
  // path traversal (ex: ../../etc/passwd).
  // ---------------------------------------------------------------------------
  router.get('/download/:nomeArquivo', (req: Request, res: Response) => {
    const nomeArquivo = path.basename(req.params.nomeArquivo);
    const caminho = path.join(dataDir, 'relatorios', nomeArquivo);
    if (!fs.existsSync(caminho)) return res.status(404).json({ erro: 'Arquivo não encontrado' });
    res.download(caminho, nomeArquivo);
  });

  // ---------------------------------------------------------------------------
  // GET /visualizar/:nomeArquivo
  //
  // Serve o PDF com Content-Disposition: inline — o navegador abre o arquivo
  // diretamente na aba (ex: visualização integrada do Chrome/Edge).
  // Diferente de /download, não força o salvamento local.
  // ---------------------------------------------------------------------------
  router.get('/visualizar/:nomeArquivo', (req: Request, res: Response) => {
    const nomeArquivo = path.basename(req.params.nomeArquivo);
    const caminho = path.join(dataDir, 'relatorios', nomeArquivo);
    if (!fs.existsSync(caminho)) return res.status(404).json({ erro: 'Arquivo não encontrado' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${nomeArquivo}"`);
    res.sendFile(caminho);
  });

  // ---------------------------------------------------------------------------
  // GET /download-zip/todos
  //
  // Compacta todos os PDFs gerados em um único arquivo ZIP e serve como stream.
  //
  // Fluxo:
  //   1. Lista todos os PDFs disponíveis em /data/relatorios
  //   2. Cria um arquivo ZIP em memória com compressão nível 6 (balanceado)
  //   3. Adiciona cada PDF ao ZIP preservando o nome original
  //   4. Faz pipe do stream diretamente para a resposta HTTP (sem gravar em disco)
  // ---------------------------------------------------------------------------
  router.get('/download-zip/todos', async (req: Request, res: Response) => {
    const pdfs = pdfService.listarPDFs();
    if (pdfs.length === 0) return res.status(404).json({ erro: 'Nenhum PDF disponível' });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="relatorios_pendencias.zip"');

    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.pipe(res);
    pdfs.forEach(pdf => archive.file(pdf.caminho, { name: pdf.nomeArquivo }));
    await archive.finalize();
  });

  // ---------------------------------------------------------------------------
  // GET /download-zip/:tipo
  //
  // Compacta apenas os PDFs de docentes de um tipo específico de pendência:
  //   - simultaneas      → tipoPendencia = 'simultanea'
  //   - somente-agenda   → tipoPendencia = 'somente_agenda'
  //   - somente-tach     → tipoPendencia = 'somente_tach'
  // ---------------------------------------------------------------------------
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

    if (!processingService.isProcessado()) {
      return res.status(400).json({ erro: 'Planilha não processada ainda.' });
    }

    const docentes = processingService.getDocentes().filter(d => d.tipoPendencia === config.tipo);
    if (docentes.length === 0) {
      return res.status(404).json({ erro: 'Nenhum docente encontrado para este tipo.' });
    }

    const nomesFiltrados = new Set(docentes.map(d => sanitizarNome(d.nomeDocente, d.matricula)));
    const pdfs = pdfService.listarPDFs().filter(p => nomesFiltrados.has(p.nomeArquivo));

    if (pdfs.length === 0) {
      return res.status(404).json({ erro: 'Nenhum PDF disponível para este tipo. Gere os PDFs primeiro.' });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${config.nomeZip}"`);

    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.pipe(res);
    pdfs.forEach(pdf => archive.file(pdf.caminho, { name: pdf.nomeArquivo }));
    await archive.finalize();
  });

  // ---------------------------------------------------------------------------
  // GET /lista
  //
  // Lista os PDFs gerados com suporte a busca textual e paginação.
  //
  // Query params:
  //   - busca: filtra pelo nome do arquivo (case-insensitive, substring)
  //   - pagina: número da página (padrão: 1)
  //   - limite: itens por página (padrão: 20, máximo: 100)
  //
  // Retorna: { relatorios, total, pagina, limite, totalPaginas }
  // ---------------------------------------------------------------------------
  router.get('/lista', (req: Request, res: Response) => {
    const { busca, pagina = '1', limite = '20' } = req.query as Record<string, string>;
    let pdfs = pdfService.listarPDFs();

    // Filtra por substring no nome do arquivo se o parâmetro de busca for informado
    if (busca) {
      const buscaNorm = busca.toLowerCase();
      pdfs = pdfs.filter(p => p.nomeArquivo.toLowerCase().includes(buscaNorm));
    }

    // Paginação: calcula slice com base na página e limite solicitados
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

  // ---------------------------------------------------------------------------
  // DELETE /:nomeArquivo
  //
  // Remove permanentemente um PDF da pasta /data/relatorios.
  // Registra a exclusão no log de auditoria do sistema.
  // ---------------------------------------------------------------------------
  router.delete('/:nomeArquivo', (req: Request, res: Response) => {
    try {
      pdfService.excluirPDF(req.params.nomeArquivo);
      processingService.addLogExterno('info', `PDF excluído: ${req.params.nomeArquivo}`);
      res.json({ sucesso: true });
    } catch (err: any) {
      res.status(500).json({ erro: err.message });
    }
  });

  // ---------------------------------------------------------------------------
  // GET /status
  //
  // Retorna o estado atual do processamento: se já foi processado, quando foi
  // a última execução, quantos docentes foram encontrados, etc.
  // Usado pelo frontend para exibir o painel de status em tempo real.
  // ---------------------------------------------------------------------------
  router.get('/status', (req: Request, res: Response) => {
    res.json(processingService.getStatus());
  });

  // ---------------------------------------------------------------------------
  // GET /logs
  //
  // Retorna os últimos registros de log do sistema (máx. 200 entradas).
  // Inclui eventos de processamento, geração de PDFs, erros e exclusões.
  // ---------------------------------------------------------------------------
  router.get('/logs', (req: Request, res: Response) => {
    res.json(processingService.getLogs());
  });

  return router;
}

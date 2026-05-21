import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001');
const DATA_DIR = path.resolve(__dirname, '..', '..', 'data');
const ASSETS_DIR = path.resolve(__dirname, '..', '..', 'assets');
const RELATORIOS_DIR = path.join(DATA_DIR, 'relatorios');

[DATA_DIR, RELATORIOS_DIR, path.join(DATA_DIR, 'logs'), path.join(DATA_DIR, 'cache')].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

import { ProcessingService } from './services/ProcessingService';
import { PDFGenerationService } from './services/PDFGenerationService';
import { dashboardRoutes } from './routes/dashboard';
import { docentesRoutes } from './routes/docentes';
import { relatoriosRoutes } from './routes/relatorios';
import { errorHandler } from './middleware/errorHandler';

const processingService = new ProcessingService(DATA_DIR);
const pdfService = new PDFGenerationService(RELATORIOS_DIR, ASSETS_DIR);

app.use(cors({ origin: ['http://localhost:3000', 'http://127.0.0.1:3000'] }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/dashboard', dashboardRoutes(processingService));
app.use('/api/docentes', docentesRoutes(processingService));
app.use('/api/relatorios', relatoriosRoutes(processingService, pdfService, DATA_DIR));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), processado: processingService.isProcessado() });
});

app.use(errorHandler);

async function inicializar() {
  const arquivoPadrao = path.join(DATA_DIR, 'Atv_Pendentes_Abril.xlsx');
  const arquivoRaiz = path.resolve(__dirname, '..', '..', 'Atv_Pendentes_Abril.xlsx');

  let arquivoParaProcessar = '';
  if (fs.existsSync(arquivoPadrao)) arquivoParaProcessar = arquivoPadrao;
  else if (fs.existsSync(arquivoRaiz)) arquivoParaProcessar = arquivoRaiz;

  if (arquivoParaProcessar) {
    console.log(`[BOOT] Processando planilha: ${arquivoParaProcessar}`);
    try {
      await processingService.processarPlanilha(arquivoParaProcessar);
      console.log(`[BOOT] ${processingService.getDocentes().length} docentes carregados.`);
    } catch (err: any) {
      console.error('[BOOT] Erro ao processar planilha:', err.message);
    }
  } else {
    console.log('[BOOT] Nenhuma planilha encontrada. Aguardando upload via interface.');
  }
}

app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`  Portal de Pendências Docentes - PUCPR`);
  console.log(`  Backend rodando em: http://localhost:${PORT}`);
  console.log(`========================================\n`);
  inicializar();
});

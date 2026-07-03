import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

import { InMemoryDocenteRepository } from './infrastructure/repositories/InMemoryDocenteRepository';
import { ExcelPlanilhaReader }       from './infrastructure/readers/ExcelPlanilhaReader';
import { PdfRelatorioGenerator }     from './infrastructure/generators/PdfRelatorioGenerator';
import { PendenciaService }          from './domain/services/PendenciaService';
import { ProcessarPlanilhaUseCase }  from './application/use-cases/ProcessarPlanilhaUseCase';
import { GerarRelatorioUseCase }     from './application/use-cases/GerarRelatorioUseCase';
import { ObterDashboardUseCase }     from './application/use-cases/ObterDashboardUseCase';
import { dashboardRoutes }           from './routes/dashboard';
import { docentesRoutes }            from './routes/docentes';
import { relatoriosRoutes }          from './routes/relatorios';
import { errorHandler }              from './middleware/errorHandler';

dotenv.config();

const app            = express();
const PORT           = parseInt(process.env.PORT || '3001');
const DATA_DIR       = path.resolve(__dirname, '..', '..', 'data');
const ASSETS_DIR     = path.resolve(__dirname, '..', '..', 'assets');
const RELATORIOS_DIR = path.join(DATA_DIR, 'relatorios');

[DATA_DIR, RELATORIOS_DIR, path.join(DATA_DIR, 'logs'), path.join(DATA_DIR, 'cache')].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Composition Root — todas as dependências instanciadas aqui
const pendenciaService  = new PendenciaService();
const repositorio       = new InMemoryDocenteRepository();
const leitor            = new ExcelPlanilhaReader(pendenciaService);
const pdfGerador        = new PdfRelatorioGenerator(RELATORIOS_DIR, ASSETS_DIR);
const processarPlanilha = new ProcessarPlanilhaUseCase(repositorio, leitor);
const gerarRelatorio    = new GerarRelatorioUseCase(repositorio, pdfGerador);
const obterDashboard    = new ObterDashboardUseCase(repositorio);

app.use(cors({ origin: ['http://localhost:3000', 'http://127.0.0.1:3000'] }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/dashboard',  dashboardRoutes(obterDashboard, processarPlanilha));
app.use('/api/docentes',   docentesRoutes(repositorio));
app.use('/api/relatorios', relatoriosRoutes(processarPlanilha, gerarRelatorio, repositorio, pdfGerador, DATA_DIR));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), processado: repositorio.temDocentes() });
});

app.use(errorHandler);

async function inicializar() {
  const arquivoPadrao = path.join(DATA_DIR, 'Atv_Pendentes_Abril.xlsx');
  const arquivoRaiz   = path.resolve(__dirname, '..', '..', 'Atv_Pendentes_Abril.xlsx');

  const arquivoParaProcessar = fs.existsSync(arquivoPadrao) ? arquivoPadrao
    : fs.existsSync(arquivoRaiz) ? arquivoRaiz : '';

  if (arquivoParaProcessar) {
    console.log(`[BOOT] Processando planilha: ${arquivoParaProcessar}`);
    try {
      await processarPlanilha.executar(arquivoParaProcessar);
      console.log(`[BOOT] ${repositorio.listarTodos().length} docentes carregados.`);
    } catch (err: any) {
      console.error('[BOOT] Erro ao processar planilha:', err.message);
    }
  } else {
    console.log('[BOOT] Nenhuma planilha encontrada. Aguardando upload via interface.');
  }
}

async function main() {
  await inicializar();

  app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`  Portal de Pendências Docentes - PUCPR`);
    console.log(`  Backend rodando em: http://localhost:${PORT}`);
    console.log(`========================================\n`);
  });
}

main();

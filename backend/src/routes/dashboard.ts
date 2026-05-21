import { Router, Request, Response } from 'express';
import { ProcessingService } from '../services/ProcessingService';

export function dashboardRoutes(processingService: ProcessingService): Router {
  const router = Router();

  router.get('/', (req: Request, res: Response) => {
    if (!processingService.isProcessado()) {
      return res.json({
        totalDocentes: 0,
        totalPendenciaAgenda: 0,
        totalPendenciaTach: 0,
        totalSimultaneo: 0,
        semPendencia: 0,
        porSemana: [],
        porCampus: [],
        statusTachDistribuicao: [],
        ultimaAtualizacao: '',
        arquivoProcessado: '',
      });
    }
    res.json(processingService.getDashboard());
  });

  return router;
}

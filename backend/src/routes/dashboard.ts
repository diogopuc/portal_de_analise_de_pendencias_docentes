import { Router, Request, Response } from 'express';
import { ObterDashboardUseCase } from '../application/use-cases/ObterDashboardUseCase';
import { ProcessarPlanilhaUseCase } from '../application/use-cases/ProcessarPlanilhaUseCase';

export function dashboardRoutes(
  obterDashboard: ObterDashboardUseCase,
  processarPlanilha: ProcessarPlanilhaUseCase,
): Router {
  const router = Router();

  router.get('/', (_req: Request, res: Response) => {
    const status = processarPlanilha.getStatus();
    if (!status.arquivoProcessado) {
      return res.json({
        totalDocentes: 0, totalPendenciaAgenda: 0, totalPendenciaTach: 0,
        totalSimultaneo: 0, semPendencia: 0, porSemana: [], porCampus: [],
        statusTachDistribuicao: [], ultimaAtualizacao: '', arquivoProcessado: '',
      });
    }
    res.json(obterDashboard.executar(
      status.arquivoProcessado ?? '',
      status.ultimoProcessamento ?? '',
    ));
  });

  return router;
}

import { Router, Request, Response } from 'express';
import { lerConfig, salvarConfig, SemanasConfigData } from '../config/semanas.config';

export function configRoutes(): Router {
  const router = Router();

  router.get('/semanas', (_req: Request, res: Response) => {
    res.json(lerConfig());
  });

  router.put('/semanas', (req: Request, res: Response) => {
    try {
      const body = req.body as SemanasConfigData;
      if (!Array.isArray(body.semanas) || typeof body.abonadas !== 'object') {
        return res.status(400).json({ erro: 'Formato inválido. Esperado: { semanas: [...], abonadas: {...} }' });
      }
      for (const s of body.semanas) {
        if (!s.aba || !s.semana || !s.periodo) {
          return res.status(400).json({ erro: `Semana inválida: ${JSON.stringify(s)}` });
        }
      }
      salvarConfig(body);
      res.json({ sucesso: true, mensagem: 'Configuração salva. Reprocesse a planilha para aplicar.' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ erro: msg });
    }
  });

  return router;
}

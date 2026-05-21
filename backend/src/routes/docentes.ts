import { Router, Request, Response } from 'express';
import { ProcessingService } from '../services/ProcessingService';

export function docentesRoutes(processingService: ProcessingService): Router {
  const router = Router();

  router.get('/', (req: Request, res: Response) => {
    const { busca, campus, tipoPendencia, pagina = '1', limite = '20' } = req.query as Record<string, string>;
    let docentes = processingService.getDocentes();

    if (busca) {
      const buscaNorm = busca.toLowerCase();
      docentes = docentes.filter(d =>
        d.nomeDocente.toLowerCase().includes(buscaNorm) ||
        String(d.matricula).includes(buscaNorm)
      );
    }
    if (campus) docentes = docentes.filter(d => d.campus === campus);
    if (tipoPendencia) docentes = docentes.filter(d => d.tipoPendencia === tipoPendencia);

    const total = docentes.length;
    const paginaNum = Math.max(1, parseInt(pagina));
    const limiteNum = Math.min(100, Math.max(1, parseInt(limite)));
    const inicio = (paginaNum - 1) * limiteNum;
    const paginados = docentes.slice(inicio, inicio + limiteNum);

    res.json({
      docentes: paginados,
      total,
      pagina: paginaNum,
      limite: limiteNum,
      totalPaginas: Math.ceil(total / limiteNum),
    });
  });

  router.get('/:matricula', (req: Request, res: Response) => {
    const matricula = parseInt(req.params.matricula);
    const docente = processingService.getDocente(matricula);
    if (!docente) return res.status(404).json({ erro: 'Docente não encontrado' });
    res.json(docente);
  });

  router.get('/campus/lista', (req: Request, res: Response) => {
    const docentes = processingService.getDocentes();
    const campusList = [...new Set(docentes.map(d => d.campus).filter(Boolean))].sort();
    res.json(campusList);
  });

  return router;
}

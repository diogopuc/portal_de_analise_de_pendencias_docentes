import { Router, Request, Response } from 'express';
import { IDocenteRepository } from '../domain/repositories/IDocenteRepository';

export function docentesRoutes(repositorio: IDocenteRepository): Router {
  const router = Router();

  router.get('/', (req: Request, res: Response) => {
    const { busca, campus, tipoPendencia, pagina = '1', limite = '20' } = req.query as Record<string, string>;
    let docentes = repositorio.listarTodos();

    if (busca) {
      const buscaNorm = busca.toLowerCase();
      docentes = docentes.filter(d =>
        d.nomeDocente.toLowerCase().includes(buscaNorm) || String(d.matricula).includes(buscaNorm)
      );
    }
    if (campus)        docentes = docentes.filter(d => d.campus === campus);
    if (tipoPendencia) docentes = docentes.filter(d => d.tipoPendencia === tipoPendencia);

    const total     = docentes.length;
    const paginaNum = Math.max(1, parseInt(pagina));
    const limiteNum = Math.min(100, Math.max(1, parseInt(limite)));
    const inicio    = (paginaNum - 1) * limiteNum;

    res.json({
      docentes: docentes.slice(inicio, inicio + limiteNum),
      total,
      pagina: paginaNum,
      limite: limiteNum,
      totalPaginas: Math.ceil(total / limiteNum),
    });
  });

  router.get('/campus/lista', (_req: Request, res: Response) => {
    const campusList = [...new Set(repositorio.listarTodos().map(d => d.campus).filter(Boolean))].sort();
    res.json(campusList);
  });

  router.get('/:matricula', (req: Request, res: Response) => {
    const docente = repositorio.encontrarPorMatricula(parseInt(req.params.matricula));
    if (!docente) return res.status(404).json({ erro: 'Docente não encontrado' });
    res.json(docente);
  });

  return router;
}

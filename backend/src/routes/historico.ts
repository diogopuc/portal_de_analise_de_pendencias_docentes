import { Router, Request, Response } from 'express';
import path from 'path';
import fs   from 'fs';

export function historicoRoutes(historicoDir: string): Router {
  const router = Router();

  const lerSnapshot = (file: string) =>
    JSON.parse(fs.readFileSync(path.join(historicoDir, file), 'utf8'));

  router.get('/comparar', (req: Request, res: Response) => {
    const { de, para } = req.query as Record<string, string>;
    if (!de || !para) return res.status(400).json({ erro: 'Parâmetros "de" e "para" são obrigatórios.' });

    const pathDe   = path.join(historicoDir, path.basename(de));
    const pathPara = path.join(historicoDir, path.basename(para));

    if (!fs.existsSync(pathDe))   return res.status(404).json({ erro: `Snapshot "${de}" não encontrado.` });
    if (!fs.existsSync(pathPara)) return res.status(404).json({ erro: `Snapshot "${para}" não encontrado.` });

    const snapAntes  = lerSnapshot(path.basename(de));
    const snapDepois = lerSnapshot(path.basename(para));

    const mapaAntes  = new Map(snapAntes.docentes.map((d: any) => [d.matricula, d]));
    const mapaDepois = new Map(snapDepois.docentes.map((d: any) => [d.matricula, d]));

    const regularizados = snapAntes.docentes.filter((d: any) =>
      d.tipo !== 'sem_pendencia' &&
      (mapaDepois.get(d.matricula) as any)?.tipo === 'sem_pendencia',
    );

    const novasPendencias = snapDepois.docentes.filter((d: any) =>
      d.tipo !== 'sem_pendencia' &&
      (!mapaAntes.has(d.matricula) || (mapaAntes.get(d.matricula) as any)?.tipo === 'sem_pendencia'),
    );

    const delta: Record<string, number> = {};
    ['somente_agenda', 'somente_tach', 'simultanea', 'sem_pendencia'].forEach(tipo => {
      delta[tipo] = (snapDepois.porTipo[tipo] ?? 0) - (snapAntes.porTipo[tipo] ?? 0);
    });

    res.json({
      antes:  { timestamp: snapAntes.timestamp,  arquivo: snapAntes.arquivo,  totalDocentes: snapAntes.totalDocentes,  porTipo: snapAntes.porTipo  },
      depois: { timestamp: snapDepois.timestamp, arquivo: snapDepois.arquivo, totalDocentes: snapDepois.totalDocentes, porTipo: snapDepois.porTipo },
      regularizados,
      novasPendencias,
      delta,
    });
  });

  router.get('/', (_req: Request, res: Response) => {
    if (!fs.existsSync(historicoDir)) return res.json([]);

    const files = fs.readdirSync(historicoDir)
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse();

    const snapshots = files.map(f => {
      const { docentes: _d, ...meta } = lerSnapshot(f);
      return { ...meta, file: f };
    });

    res.json(snapshots);
  });

  router.get('/:file', (req: Request, res: Response) => {
    const file = path.basename(req.params.file);
    const filePath = path.join(historicoDir, file);
    if (!fs.existsSync(filePath)) return res.status(404).json({ erro: 'Snapshot não encontrado.' });
    res.json(lerSnapshot(file));
  });

  return router;
}

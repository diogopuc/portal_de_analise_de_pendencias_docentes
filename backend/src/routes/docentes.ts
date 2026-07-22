import { Router, Request, Response } from 'express';
import ExcelJS from 'exceljs';
import { IDocenteRepository } from '../domain/repositories/IDocenteRepository';

const TIPO_LABEL: Record<string, string> = {
  somente_agenda: 'Somente Agenda',
  somente_tach:   'Somente TACH',
  simultanea:     'Simultânea',
  sem_pendencia:  'Sem Pendência',
};

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

  // GET /exportar-excel
  router.get('/exportar-excel', async (req: Request, res: Response) => {
    const { campus, curso, tipoPendencia, busca } = req.query as Record<string, string>;
    let docentes = repositorio.listarTodos();
    if (campus)        docentes = docentes.filter(d => d.campus === campus);
    if (tipoPendencia) docentes = docentes.filter(d => d.tipoPendencia === tipoPendencia);
    if (curso)         docentes = docentes.filter(d => d.semanas.some(s => s.curso === curso));
    if (busca) {
      const norm = busca.toLowerCase();
      docentes = docentes.filter(d => d.nomeDocente.toLowerCase().includes(norm) || String(d.matricula).includes(norm));
    }

    const wb    = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet('Pendências');

    sheet.columns = [
      { header: 'Matrícula',        key: 'matricula',       width: 12 },
      { header: 'Nome',             key: 'nome',            width: 35 },
      { header: 'Campus',           key: 'campus',          width: 22 },
      { header: 'Curso',            key: 'curso',           width: 46 },
      { header: 'Tipo Pendência',   key: 'tipo',            width: 20 },
      { header: 'Semana',           key: 'semana',          width: 12 },
      { header: 'CH Contrato',      key: 'chContrato',      width: 13 },
      { header: 'Horas a Alocar',   key: 'horasAlocar',     width: 15 },
      { header: 'Pend. Agenda',     key: 'pendenciaAgenda', width: 14 },
      { header: 'Pend. TACH',       key: 'pendenciaTach',   width: 13 },
      { header: 'Resultado Agenda', key: 'resultadoAgenda', width: 30 },
      { header: 'Resultado TACH',   key: 'resultadoTach',   width: 30 },
      { header: 'Abonada',          key: 'abonada',         width: 10 },
      { header: 'Motivo Abono',     key: 'motivoAbono',     width: 45 },
    ];

    const hdr = sheet.getRow(1);
    hdr.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    hdr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8A0538' } };
    hdr.alignment = { vertical: 'middle' };

    docentes.forEach(d => {
      d.semanas.forEach(s => {
        sheet.addRow({
          matricula:       d.matricula,
          nome:            d.nomeDocente,
          campus:          d.campus,
          curso:           s.curso,
          tipo:            TIPO_LABEL[d.tipoPendencia] ?? d.tipoPendencia,
          semana:          s.semana,
          chContrato:      s.chContrato,
          horasAlocar:     s.horasAlocar,
          pendenciaAgenda: s.pendenciaAgenda ? 'SIM' : 'NÃO',
          pendenciaTach:   s.pendenciaTach   ? 'SIM' : 'NÃO',
          resultadoAgenda: s.resultadoAgenda,
          resultadoTach:   s.resultadoTach,
          abonada:         s.abonada ? 'SIM' : 'NÃO',
          motivoAbono:     s.motivoAbono ?? '',
        });
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="pendencias_docentes.xlsx"');
    await wb.xlsx.write(res);
    res.end();
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

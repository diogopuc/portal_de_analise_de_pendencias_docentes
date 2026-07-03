import { IDocenteRepository } from '../../domain/repositories/IDocenteRepository';
import { SEMANAS_CONFIG, SEMANAS_ABONADAS } from '../../config/semanas.config';

export class ObterDashboardUseCase {
  constructor(private readonly repositorio: IDocenteRepository) {}

  executar(arquivoProcessado: string, ultimaAtualizacao: string) {
    const docentes = this.repositorio.listarTodos();

    const porSemana = SEMANAS_CONFIG.map(config => {
      const docentesSemana = docentes.filter(d => d.semanas.some(s => s.aba === config.aba));
      const abonada = config.aba in SEMANAS_ABONADAS;
      return {
        semana: config.semana,
        aba: config.aba,
        pendenciaAgenda: docentesSemana.filter(d => d.semanas.find(s => s.aba === config.aba)?.pendenciaAgenda).length,
        pendenciaTach:   docentesSemana.filter(d => d.semanas.find(s => s.aba === config.aba)?.pendenciaTach).length,
        total: docentesSemana.length,
        abonada,
        motivoAbono: abonada ? SEMANAS_ABONADAS[config.aba] : undefined,
      };
    });

    const campusMap = new Map<string, number>();
    docentes.forEach(d => {
      const c = (d.campus || 'Desconhecido').trim().toUpperCase();
      campusMap.set(c, (campusMap.get(c) || 0) + 1);
    });

    const statusMap = new Map<string, number>();
    docentes.forEach(d =>
      d.semanas.forEach(s =>
        s.statusPorDia.forEach(sp => {
          if (sp.status && sp.status !== 'APROVADO') {
            statusMap.set(sp.status, (statusMap.get(sp.status) || 0) + 1);
          }
        })
      )
    );

    return {
      totalDocentes:        docentes.length,
      totalPendenciaAgenda: docentes.filter(d => d.pendenciaAgenda).length,
      totalPendenciaTach:   docentes.filter(d => d.pendenciaTach).length,
      totalSimultaneo:      docentes.filter(d => d.pendenciaSimultanea).length,
      semPendencia:         docentes.filter(d => d.tipoPendencia === 'sem_pendencia').length,
      porSemana,
      porCampus: Array.from(campusMap.entries())
        .map(([campus, total]) => ({ campus, total }))
        .sort((a, b) => b.total - a.total),
      statusTachDistribuicao: Array.from(statusMap.entries())
        .map(([status, total]) => ({ status, total }))
        .sort((a, b) => b.total - a.total),
      ultimaAtualizacao,
      arquivoProcessado,
    };
  }
}

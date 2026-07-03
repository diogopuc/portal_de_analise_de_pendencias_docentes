import { StatusTach } from '../value-objects/StatusTach';
import { StatusPorDia } from '../entities/DadosSemana';

export class PendenciaService {
  private static readonly VALORES_NAO_GERA = ['nao', 'n', 'no', 'false', '0'];

  calcularPendenciaAgenda(horasAlocar: number, geraAgenda: string): boolean {
    const norm = geraAgenda.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
    if (PendenciaService.VALORES_NAO_GERA.includes(norm)) return false;
    return horasAlocar > 0;
  }

  calcularPendenciaTach(statusPorDia: StatusPorDia[]): boolean {
    const statuses = statusPorDia.map(s => new StatusTach(s.status)).filter(s => !s.eIgnorado);
    return statuses.length > 0 && statuses.some(s => s.temPendencia);
  }
}

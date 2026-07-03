import { DadosSemana } from './DadosSemana';

export type TipoPendencia = 'somente_agenda' | 'somente_tach' | 'simultanea' | 'sem_pendencia';

export class Docente {
  readonly matricula: number;
  readonly nomeDocente: string;
  readonly campus: string;
  private readonly _semanas: DadosSemana[] = [];
  private _pendenciaAgenda = false;
  private _pendenciaTach = false;

  constructor(props: { matricula: number; nomeDocente: string; campus: string }) {
    this.matricula = props.matricula;
    this.nomeDocente = props.nomeDocente;
    this.campus = props.campus;
  }

  adicionarSemana(semana: DadosSemana): void {
    this._semanas.push(semana);
    if (semana.pendenciaAgenda) this._pendenciaAgenda = true;
    if (semana.pendenciaTach) this._pendenciaTach = true;
  }

  get semanas(): readonly DadosSemana[] {
    return this._semanas;
  }

  get pendenciaAgenda(): boolean {
    return this._pendenciaAgenda;
  }

  get pendenciaTach(): boolean {
    return this._pendenciaTach;
  }

  get pendenciaSimultanea(): boolean {
    return this._pendenciaAgenda && this._pendenciaTach;
  }

  get tipoPendencia(): TipoPendencia {
    if (this.pendenciaSimultanea) return 'simultanea';
    if (this._pendenciaAgenda) return 'somente_agenda';
    if (this._pendenciaTach) return 'somente_tach';
    return 'sem_pendencia';
  }

  toJSON() {
    return {
      matricula: this.matricula,
      nomeDocente: this.nomeDocente,
      campus: this.campus,
      semanas: this._semanas,
      pendenciaAgenda: this.pendenciaAgenda,
      pendenciaTach: this.pendenciaTach,
      pendenciaSimultanea: this.pendenciaSimultanea,
      tipoPendencia: this.tipoPendencia,
    };
  }
}

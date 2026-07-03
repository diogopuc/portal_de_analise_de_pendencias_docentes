export interface StatusPorDia {
  readonly data: string;
  readonly status: string;
}

export interface DadosSemanaProps {
  semana: string;
  aba: string;
  matricula: number;
  nomeDocente: string;
  chContrato: number;
  horasAlocar: number;
  campus: string;
  curso: string;
  geraAgenda: string;
  statusPorDia: StatusPorDia[];
  pendenciaAgenda: boolean;
  pendenciaTach: boolean;
  abonada: boolean;
  motivoAbono?: string;
}

export class DadosSemana {
  readonly semana: string;
  readonly aba: string;
  readonly matricula: number;
  readonly nomeDocente: string;
  readonly chContrato: number;
  readonly horasAlocar: number;
  readonly campus: string;
  readonly curso: string;
  readonly geraAgenda: string;
  readonly statusPorDia: readonly StatusPorDia[];
  readonly pendenciaAgenda: boolean;
  readonly pendenciaTach: boolean;
  readonly abonada: boolean;
  readonly motivoAbono?: string;

  constructor(props: DadosSemanaProps) {
    this.semana = props.semana;
    this.aba = props.aba;
    this.matricula = props.matricula;
    this.nomeDocente = props.nomeDocente;
    this.chContrato = props.chContrato;
    this.horasAlocar = props.horasAlocar;
    this.campus = props.campus;
    this.curso = props.curso;
    this.geraAgenda = props.geraAgenda;
    this.statusPorDia = props.statusPorDia;
    this.pendenciaAgenda = props.pendenciaAgenda;
    this.pendenciaTach = props.pendenciaTach;
    this.abonada = props.abonada;
    this.motivoAbono = props.motivoAbono;
  }

  get resultadoAgenda(): string {
    return this.pendenciaAgenda ? 'Pendência de Agenda' : 'Sem Pendência de Agenda';
  }

  get resultadoTach(): string {
    return this.pendenciaTach ? 'Pendência de TACH' : 'Sem Pendência de TACH';
  }

  toJSON() {
    return {
      semana: this.semana,
      aba: this.aba,
      matricula: this.matricula,
      nomeDocente: this.nomeDocente,
      chContrato: this.chContrato,
      horasAlocar: this.horasAlocar,
      campus: this.campus,
      curso: this.curso,
      geraAgenda: this.geraAgenda,
      statusPorDia: this.statusPorDia,
      resultadoAgenda: this.resultadoAgenda,
      resultadoTach: this.resultadoTach,
      pendenciaAgenda: this.pendenciaAgenda,
      pendenciaTach: this.pendenciaTach,
      abonada: this.abonada,
      motivoAbono: this.motivoAbono,
    };
  }
}

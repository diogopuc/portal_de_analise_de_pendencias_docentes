import { STATUS_TACH_COM_PENDENCIA, STATUS_TACH_SEM_PENDENCIA } from '../../shared/constants/tach.constants';

export class StatusTach {
  private readonly _valor: string;

  constructor(valor: string) {
    this._valor = valor.normalize('NFC').toUpperCase().trim();
  }

  get valor(): string {
    return this._valor;
  }

  get temPendencia(): boolean {
    return (STATUS_TACH_COM_PENDENCIA as readonly string[]).includes(this._valor);
  }

  get eIgnorado(): boolean {
    return this._valor === '' || (STATUS_TACH_SEM_PENDENCIA as readonly string[]).includes(this._valor);
  }

  equals(other: StatusTach): boolean {
    return this._valor === other._valor;
  }
}

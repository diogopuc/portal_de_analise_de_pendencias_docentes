import { Docente } from '../../domain/entities/Docente';
import { IDocenteRepository } from '../../domain/repositories/IDocenteRepository';

export class InMemoryDocenteRepository implements IDocenteRepository {
  private readonly store = new Map<number, Docente>();

  salvar(docente: Docente): void {
    this.store.set(docente.matricula, docente);
  }

  encontrarPorMatricula(matricula: number): Docente | undefined {
    return this.store.get(matricula);
  }

  listarTodos(): Docente[] {
    return Array.from(this.store.values()).sort((a, b) =>
      a.nomeDocente.localeCompare(b.nomeDocente)
    );
  }

  limpar(): void {
    this.store.clear();
  }

  temDocentes(): boolean {
    return this.store.size > 0;
  }
}

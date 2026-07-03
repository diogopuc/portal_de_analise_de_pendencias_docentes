import { Docente } from '../entities/Docente';

export interface IDocenteRepository {
  salvar(docente: Docente): void;
  encontrarPorMatricula(matricula: number): Docente | undefined;
  listarTodos(): Docente[];
  limpar(): void;
  temDocentes(): boolean;
}

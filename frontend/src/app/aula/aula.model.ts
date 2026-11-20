export interface Aula {
  id: number;
  codigo: string;
  ubicacion: string;
  capacidad: number;
  estado: string;
}

export interface AulaFormData {
  codigo: string;
  ubicacion: string;
  capacidad: number;
  estado: string;
}

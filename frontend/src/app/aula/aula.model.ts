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

export interface AulaAuthSession {
  token: string;
  tipo: string;
  username: string;
  roles: string[];
}

export type RolSistema = 'ROLE_ADMIN' | 'ROLE_TECNICO' | 'ROLE_ALUMNO';

export type RolRegistro = 'ADMIN' | 'TECNICO' | 'ALUMNO';

export type PerfilDemo = 'tecnico' | 'admin' | 'alumno' | 'cmendoza' | 'atorres';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegistroUsuarioRequest {
  username: string;
  nombreCompleto: string;
  correo: string;
  password: string;
  rol: RolRegistro;
  especialidad?: string;
}

export interface AuthResponse {
  token: string;
  tipo?: string;
  username: string;
  nombreCompleto?: string;
  correo?: string;
  especialidad?: string;
  roles: string[];
}

export interface UsuarioPerfil {
  id: number;
  username: string;
  nombreCompleto: string;
  correo: string;
  rol: RolRegistro;
  roles: string[];
  especialidad?: string;
  activo: boolean;
  fechaRegistro?: string;
}

export interface SesionUsuario {
  token: string;
  username: string;
  nombreCompleto?: string;
  correo?: string;
  especialidad?: string;
  roles: string[];
  origen: 'BACKEND_JWT' | 'DEMO_JWT';
}

export type RolSistema = 'ROLE_ADMIN' | 'ROLE_TECNICO' | 'ROLE_ALUMNO';

export type PerfilDemo = 'tecnico' | 'admin' | 'alumno';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  roles: string[];
}

export interface SesionUsuario {
  token: string;
  username: string;
  roles: string[];
  origen: 'BACKEND_JWT' | 'DEMO_JWT';
}

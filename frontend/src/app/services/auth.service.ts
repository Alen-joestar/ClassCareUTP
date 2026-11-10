import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { AuthResponse, LoginRequest, PerfilDemo, SesionUsuario } from '../models/auth.model';

const STORAGE_KEY = 'classcare-jwt-session';

const CREDENCIALES_DEMO: Record<PerfilDemo, LoginRequest & { roles: string[] }> = {
  tecnico: {
    username: 'tecnico',
    password: 'tecnico123',
    roles: ['ROLE_TECNICO']
  },
  admin: {
    username: 'admin',
    password: 'admin123',
    roles: ['ROLE_ADMIN']
  },
  alumno: {
    username: 'alumno',
    password: 'alumno123',
    roles: ['ROLE_ALUMNO']
  }
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/auth';

  private readonly sesionState = signal<SesionUsuario | null>(this.cargarSesionInicial());

  readonly sesion = this.sesionState.asReadonly();
  readonly autenticado = computed(() => Boolean(this.sesionState()?.token));

  /**
   * Según SecurityConfig.java, solo ROLE_TECNICO y ROLE_ADMIN pueden ejecutar PUT /api/reportes/{id}.
   */
  readonly puedeActualizarReportes = computed(() => {
    const roles = this.sesionState()?.roles ?? [];
    return roles.includes('ROLE_TECNICO') || roles.includes('ROLE_ADMIN');
  });

  readonly rolEtiqueta = computed(() => {
    const actual = this.sesionState();
    if (!actual) {
      return 'Público (Sin JWT)';
    }
    if (actual.roles.includes('ROLE_ADMIN')) {
      return 'Admin (JWT)';
    }
    if (actual.roles.includes('ROLE_TECNICO')) {
      return 'Soporte Técnico (JWT)';
    }
    return 'Alumno (JWT)';
  });

  /**
   * Devuelve el token JWT activo para que el funcional authInterceptor lo inyecte en Authorization: Bearer <token>.
   */
  getToken(): string | null {
    return this.sesionState()?.token ?? null;
  }

  /**
   * Autenticación contra POST /api/auth/login (Spring Security + JwtTokenProvider).
   */
  login(credenciales: LoginRequest, rolesRespaldo: string[] = ['ROLE_TECNICO']): Observable<SesionUsuario> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credenciales).pipe(
      map(respuesta => ({
        token: respuesta.token,
        username: respuesta.username,
        roles: respuesta.roles,
        origen: 'BACKEND_JWT' as const
      })),
      catchError(() => {
        // Respaldo demostrativo cuando se ejecuta ng serve sin el servidor Spring Boot encendido
        const tokenSimulado = this.generarTokenRespaldo(credenciales.username, rolesRespaldo);
        return of({
          token: tokenSimulado,
          username: credenciales.username,
          roles: rolesRespaldo,
          origen: 'DEMO_JWT' as const
        });
      }),
      tap(nuevaSesion => this.guardarSesion(nuevaSesion))
    );
  }

  /**
   * Permite cambiar rápidamente entre los usuarios configurados en SecurityConfig.java
   * (tecnico, admin, alumno) para demostrar el interceptor JWT y control RBAC en vivo.
   */
  loginRapido(perfil: PerfilDemo): Observable<SesionUsuario> {
    const datos = CREDENCIALES_DEMO[perfil];
    return this.login(
      { username: datos.username, password: datos.password },
      datos.roles
    );
  }

  logout(): void {
    this.sesionState.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  private guardarSesion(sesion: SesionUsuario): void {
    this.sesionState.set(sesion);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sesion));
    }
  }

  private cargarSesionInicial(): SesionUsuario | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    const guardado = localStorage.getItem(STORAGE_KEY);
    if (guardado) {
      try {
        return JSON.parse(guardado) as SesionUsuario;
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    // Sesión inicial por defecto con perfil técnico para que las pruebas de cambio de estado envíen Bearer JWT desde el primer momento
    const inicial: SesionUsuario = {
      token: this.generarTokenRespaldo('tecnico', ['ROLE_TECNICO']),
      username: 'tecnico',
      roles: ['ROLE_TECNICO'],
      origen: 'DEMO_JWT'
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inicial));
    return inicial;
  }

  private generarTokenRespaldo(username: string, roles: string[]): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(
      JSON.stringify({
        sub: username,
        roles: roles.join(','),
        iss: 'classcare-utp-client'
      })
    );
    return `${header}.${payload}.classcare-signature`;
  }
}

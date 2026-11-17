import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
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

  /**
   * Según SecurityConfig.java, exclusivamente ROLE_ADMIN puede ejecutar DELETE /api/reportes/{id}.
   */
  readonly puedeEliminarReportes = computed(() => {
    const roles = this.sesionState()?.roles ?? [];
    return roles.includes('ROLE_ADMIN');
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

  constructor() {
    // Corrección #1: Si la sesión cargada es un token simulado (DEMO_JWT),
    // intenta automáticamente canjearlo por un JWT real firmado por Spring Boot (POST /api/auth/login).
    const actual = this.sesionState();
    if (actual && actual.origen === 'DEMO_JWT') {
      const perfil = this.deducirPerfil(actual.username);
      this.loginRapido(perfil).subscribe();
    }
  }

  /**
   * Devuelve el token JWT activo para que el funcional authInterceptor lo inyecte en Authorization: Bearer <token>.
   */
  getToken(): string | null {
    return this.sesionState()?.token ?? null;
  }

  /**
   * Si el usuario tenía un DEMO_JWT (porque abrió Angular antes de encender Spring Boot),
   * obtiene el token real firmado por JwtTokenProvider para reintentar la petición protegida.
   */
  asegurarTokenReal(): Observable<SesionUsuario | null> {
    const actual = this.sesionState();
    if (!actual) {
      return of(null);
    }
    if (actual.origen === 'BACKEND_JWT') {
      return of(actual);
    }
    const perfil = this.deducirPerfil(actual.username);
    return this.loginRapido(perfil);
  }

  /**
   * Autenticación contra POST /api/auth/login (Spring Security + JwtTokenProvider).
   * Si las credenciales son incorrectas (401), propaga el error real.
   * Solo usa el token demostrativo cuando el servidor backend está apagado.
   */
  login(credenciales: LoginRequest, rolesRespaldo?: string[]): Observable<SesionUsuario> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credenciales).pipe(
      map(respuesta => {
        const perfilLocal = Object.values(CREDENCIALES_DEMO).find(
          c => c.username === credenciales.username
        );
        const rolesResueltos =
          respuesta.roles && respuesta.roles.length > 0
            ? respuesta.roles
            : (rolesRespaldo ?? perfilLocal?.roles ?? ['ROLE_TECNICO']);

        return {
          token: respuesta.token,
          username: respuesta.username || credenciales.username,
          roles: rolesResueltos,
          origen: 'BACKEND_JWT' as const
        };
      }),
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401 || err.status === 403 || err.status === 400) {
          return throwError(() => err);
        }
        // Si el backend está apagado, verificamos contra las credenciales demo locales
        const perfilLocal = Object.values(CREDENCIALES_DEMO).find(
          c => c.username === credenciales.username && c.password === credenciales.password
        );
        if (!perfilLocal && !rolesRespaldo) {
          return throwError(
            () => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' })
          );
        }
        const rolesAsignados = rolesRespaldo ?? perfilLocal?.roles ?? ['ROLE_TECNICO'];
        const tokenSimulado = this.generarTokenRespaldo(credenciales.username, rolesAsignados);
        return of({
          token: tokenSimulado,
          username: credenciales.username,
          roles: rolesAsignados,
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

  private deducirPerfil(username: string): PerfilDemo {
    if (username === 'admin') {
      return 'admin';
    }
    if (username === 'alumno') {
      return 'alumno';
    }
    return 'tecnico';
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

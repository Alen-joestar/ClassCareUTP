import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import {
  AuthResponse,
  LoginRequest,
  PerfilDemo,
  RegistroUsuarioRequest,
  SesionUsuario,
  UsuarioPerfil
} from '../models/auth.model';

const STORAGE_KEY = 'classcare-jwt-session';
const LOCAL_USERS_KEY = 'classcare-local-users';

interface CuentaLocalDemo extends LoginRequest {
  nombreCompleto: string;
  correo: string;
  especialidad: string;
  roles: string[];
}

const CREDENCIALES_DEMO: Record<PerfilDemo, CuentaLocalDemo> = {
  tecnico: {
    username: 'tecnico',
    password: 'tecnico123',
    nombreCompleto: 'Soporte Técnico UTP',
    correo: 'tecnico@utp.edu.pe',
    especialidad: 'Soporte Integral de Campus',
    roles: ['ROLE_TECNICO']
  },
  admin: {
    username: 'admin',
    password: 'admin123',
    nombreCompleto: 'Administrador General UTP',
    correo: 'admin@utp.edu.pe',
    especialidad: 'Dirección de Infraestructura',
    roles: ['ROLE_ADMIN']
  },
  alumno: {
    username: 'alumno',
    password: 'alumno123',
    nombreCompleto: 'Estudiante / Docente UTP',
    correo: 'alumno@utp.edu.pe',
    especialidad: 'Comunidad Académica',
    roles: ['ROLE_ALUMNO']
  },
  cmendoza: {
    username: 'cmendoza',
    password: 'tecnico123',
    nombreCompleto: 'Carlos Mendoza',
    correo: 'cmendoza@utp.edu.pe',
    especialidad: 'Audiovisual y Proyección',
    roles: ['ROLE_TECNICO']
  },
  atorres: {
    username: 'atorres',
    password: 'tecnico123',
    nombreCompleto: 'Ana Torres',
    correo: 'atorres@utp.edu.pe',
    especialidad: 'Instalaciones Eléctricas',
    roles: ['ROLE_TECNICO']
  }
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/auth';

  private readonly sesionState = signal<SesionUsuario | null>(this.cargarSesionInicial());
  private readonly tecnicosState = signal<UsuarioPerfil[]>(this.obtenerTecnicosIniciales());
  private readonly usuariosState = signal<UsuarioPerfil[]>([]);

  readonly sesion = this.sesionState.asReadonly();
  readonly tecnicosRegistrados = this.tecnicosState.asReadonly();
  readonly usuariosRegistrados = this.usuariosState.asReadonly();
  readonly autenticado = computed(() => Boolean(this.sesionState()?.token));
  readonly panelVisible = signal(false);

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

  readonly nombreMostrado = computed(() => {
    const actual = this.sesionState();
    if (!actual) {
      return 'Invitado';
    }
    return actual.nombreCompleto || actual.username;
  });

  readonly inicialesUsuario = computed(() => {
    const actual = this.sesionState();
    if (!actual) {
      return 'IN';
    }
    const base = (actual.nombreCompleto || actual.username).trim();
    const partes = base.split(/\s+/).filter(Boolean);
    if (partes.length >= 2) {
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    return base.slice(0, 2).toUpperCase();
  });

  readonly rolCargo = computed(() => {
    const actual = this.sesionState();
    if (!actual) {
      return 'Acceso de Consulta';
    }
    if (actual.roles.includes('ROLE_ADMIN')) {
      return 'Administrador de Infraestructura';
    }
    if (actual.roles.includes('ROLE_TECNICO')) {
      return 'Especialista de Soporte Técnico';
    }
    return 'Docente / Estudiante';
  });

  readonly rolEtiqueta = computed(() => {
    const actual = this.sesionState();
    if (!actual) {
      return 'Iniciar Sesión';
    }
    const nombre = actual.nombreCompleto || actual.username;
    if (actual.roles.includes('ROLE_ADMIN')) {
      return `${nombre} • Admin`;
    }
    if (actual.roles.includes('ROLE_TECNICO')) {
      return `${nombre} • Técnico`;
    }
    return `${nombre} • Académico`;
  });

  constructor() {
    const actual = this.sesionState();
    if (actual && actual.origen === 'DEMO_JWT') {
      const perfil = this.deducirPerfil(actual.username);
      this.loginRapido(perfil).subscribe();
    }
    this.cargarTecnicos().subscribe();
  }

  /**
   * Devuelve el token JWT activo para que el funcional authInterceptor lo inyecte en Authorization: Bearer <token>.
   */
  getToken(): string | null {
    return this.sesionState()?.token ?? null;
  }

  /**
   * Si el usuario tenía un DEMO_JWT, obtiene el token real firmado por JwtTokenProvider.
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
   * Autenticación contra POST /api/auth/login (Spring Security + JwtTokenProvider + JPA).
   */
  login(credenciales: LoginRequest, rolesRespaldo?: string[]): Observable<SesionUsuario> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credenciales).pipe(
      map(respuesta => {
        const perfilLocal = this.buscarCuentaLocal(credenciales.username);
        const rolesResueltos =
          respuesta.roles && respuesta.roles.length > 0
            ? respuesta.roles
            : (rolesRespaldo ?? perfilLocal?.roles ?? ['ROLE_TECNICO']);

        return {
          token: respuesta.token,
          username: respuesta.username || credenciales.username,
          nombreCompleto: respuesta.nombreCompleto || perfilLocal?.nombreCompleto || credenciales.username,
          correo: respuesta.correo || perfilLocal?.correo || `${credenciales.username}@utp.edu.pe`,
          especialidad: respuesta.especialidad || perfilLocal?.especialidad,
          roles: rolesResueltos,
          origen: 'BACKEND_JWT' as const
        };
      }),
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401 || err.status === 403 || err.status === 400) {
          return throwError(() => err);
        }
        const perfilLocal = this.buscarCuentaLocal(credenciales.username, credenciales.password);
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
          nombreCompleto: perfilLocal?.nombreCompleto || credenciales.username,
          correo: perfilLocal?.correo || `${credenciales.username}@utp.edu.pe`,
          especialidad: perfilLocal?.especialidad,
          roles: rolesAsignados,
          origen: 'DEMO_JWT' as const
        });
      }),
      tap(nuevaSesion => this.guardarSesion(nuevaSesion))
    );
  }

  /**
   * Registra un nuevo usuario en la base de datos (POST /api/auth/register) e inicia su sesión JWT.
   */
  registrarUsuario(payload: RegistroUsuarioRequest): Observable<SesionUsuario> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, payload).pipe(
      map(respuesta => ({
        token: respuesta.token,
        username: respuesta.username || payload.username,
        nombreCompleto: respuesta.nombreCompleto || payload.nombreCompleto,
        correo: respuesta.correo || payload.correo,
        especialidad: respuesta.especialidad || payload.especialidad,
        roles: respuesta.roles && respuesta.roles.length > 0 ? respuesta.roles : [`ROLE_${payload.rol}`],
        origen: 'BACKEND_JWT' as const
      })),
      catchError((err: HttpErrorResponse) => {
        if (err.status === 400 || err.status === 409 || err.status === 422) {
          return throwError(() => err);
        }
        // Respaldo local en caso de que el servidor backend no esté disponible
        const roles = [`ROLE_${payload.rol}`];
        const cuentaLocal: CuentaLocalDemo = {
          username: payload.username.trim().toLowerCase(),
          password: payload.password,
          nombreCompleto: payload.nombreCompleto.trim(),
          correo: payload.correo.trim().toLowerCase(),
          especialidad: payload.especialidad || 'Comunidad UTP',
          roles
        };
        this.guardarCuentaLocalRespaldo(cuentaLocal);
        return of({
          token: this.generarTokenRespaldo(cuentaLocal.username, roles),
          username: cuentaLocal.username,
          nombreCompleto: cuentaLocal.nombreCompleto,
          correo: cuentaLocal.correo,
          especialidad: cuentaLocal.especialidad,
          roles,
          origen: 'DEMO_JWT' as const
        });
      }),
      tap(nuevaSesion => {
        this.guardarSesion(nuevaSesion);
        this.cargarTecnicos().subscribe();
        this.cargarUsuarios().subscribe();
      })
    );
  }

  /**
   * Consulta los técnicos registrados en el backend para sincronizar el módulo de Atenciones.
   */
  cargarTecnicos(): Observable<UsuarioPerfil[]> {
    return this.http.get<UsuarioPerfil[]>(`${this.apiUrl}/tecnicos`).pipe(
      tap(lista => {
        if (Array.isArray(lista) && lista.length > 0) {
          this.tecnicosState.set(lista);
        }
      }),
      catchError(() => of(this.tecnicosState()))
    );
  }

  /**
   * Consulta el directorio completo de usuarios registrados en el campus.
   */
  cargarUsuarios(): Observable<UsuarioPerfil[]> {
    return this.http.get<UsuarioPerfil[]>(`${this.apiUrl}/usuarios`).pipe(
      tap(lista => {
        if (Array.isArray(lista)) {
          this.usuariosState.set(lista);
        }
      }),
      catchError(() => of(this.usuariosState()))
    );
  }

  /**
   * Permite cambiar rápidamente entre los usuarios base para pruebas RBAC en vivo.
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

  abrirPanel(): void {
    this.panelVisible.set(true);
  }

  togglePanel(): void {
    this.panelVisible.update(visible => !visible);
  }

  cerrarPanel(): void {
    this.panelVisible.set(false);
  }

  private deducirPerfil(username: string): PerfilDemo {
    if (username === 'admin') return 'admin';
    if (username === 'alumno') return 'alumno';
    if (username === 'cmendoza') return 'cmendoza';
    if (username === 'atorres') return 'atorres';
    return 'tecnico';
  }

  private buscarCuentaLocal(username: string, password?: string): CuentaLocalDemo | undefined {
    const normalizado = username.trim().toLowerCase();
    const todas = [...Object.values(CREDENCIALES_DEMO), ...this.leerCuentasLocalesRespaldo()];
    return todas.find(
      c => c.username.toLowerCase() === normalizado && (!password || c.password === password)
    );
  }

  private leerCuentasLocalesRespaldo(): CuentaLocalDemo[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(LOCAL_USERS_KEY);
      return raw ? (JSON.parse(raw) as CuentaLocalDemo[]) : [];
    } catch {
      return [];
    }
  }

  private guardarCuentaLocalRespaldo(cuenta: CuentaLocalDemo): void {
    if (typeof localStorage === 'undefined') return;
    const actuales = this.leerCuentasLocalesRespaldo().filter(
      c => c.username.toLowerCase() !== cuenta.username.toLowerCase()
    );
    actuales.push(cuenta);
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(actuales));
  }

  private obtenerTecnicosIniciales(): UsuarioPerfil[] {
    return [
      {
        id: 1,
        username: 'tecnico',
        nombreCompleto: 'Soporte Técnico UTP',
        correo: 'tecnico@utp.edu.pe',
        rol: 'TECNICO',
        roles: ['ROLE_TECNICO'],
        especialidad: 'Soporte Integral de Campus',
        activo: true
      },
      {
        id: 2,
        username: 'cmendoza',
        nombreCompleto: 'Carlos Mendoza',
        correo: 'cmendoza@utp.edu.pe',
        rol: 'TECNICO',
        roles: ['ROLE_TECNICO'],
        especialidad: 'Audiovisual y Proyección',
        activo: true
      },
      {
        id: 3,
        username: 'atorres',
        nombreCompleto: 'Ana Torres',
        correo: 'atorres@utp.edu.pe',
        rol: 'TECNICO',
        roles: ['ROLE_TECNICO'],
        especialidad: 'Instalaciones Eléctricas',
        activo: true
      },
      {
        id: 4,
        username: 'lvargas',
        nombreCompleto: 'Luis Vargas',
        correo: 'lvargas@utp.edu.pe',
        rol: 'TECNICO',
        roles: ['ROLE_TECNICO'],
        especialidad: 'Climatización e Infraestructura',
        activo: true
      },
      {
        id: 5,
        username: 'egomez',
        nombreCompleto: 'Elena Gómez',
        correo: 'egomez@utp.edu.pe',
        rol: 'TECNICO',
        roles: ['ROLE_TECNICO'],
        especialidad: 'Redes y Conectividad',
        activo: true
      }
    ];
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
      nombreCompleto: 'Soporte Técnico UTP',
      correo: 'tecnico@utp.edu.pe',
      especialidad: 'Soporte Integral de Campus',
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

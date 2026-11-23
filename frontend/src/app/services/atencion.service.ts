import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, switchMap, tap, throwError } from 'rxjs';
import {
  ActualizarEstadoPayload,
  Atencion,
  AtencionBackendDTO,
  CrearAtencionPayload,
  EstadoAtencion,
  ReportePendienteAsignacion
} from '../models/atencion.model';
import { AuthService } from './auth.service';
import { ReporteService } from './reporte.service';

const STORAGE_KEY = 'classcare-atenciones-cache';

const ATENCIONES_SEMILLA: Atencion[] = [
  {
    id: 1,
    reporteId: 1,
    tecnicoEncargado: 'tecnico01',
    estado: 'PENDIENTE',
    observaciones: 'Caso asignado para inspección de proyector multimedia en aula A-101.',
    fechaRegistro: '2026-11-10T09:00:00',
    fechaResolucion: null,
    aulaCodigo: 'A-101',
    tipoProblema: 'Tecnológico',
    prioridad: 'ALTA',
    tipoMantenimiento: 'CORRECTIVO',
    impactoAcademico: 'Requiere aula alterna'
  },
  {
    id: 2,
    reporteId: 2,
    tecnicoEncargado: 'tecnico02',
    estado: 'EN_ATENCION',
    observaciones: 'Técnico en sitio realizando reemplazo de luminaria fluorescente.',
    fechaRegistro: '2026-11-11T14:30:00',
    fechaResolucion: null,
    aulaCodigo: 'B-202',
    tipoProblema: 'Eléctrico',
    prioridad: 'MEDIA',
    tipoMantenimiento: 'CORRECTIVO',
    impactoAcademico: 'Clase en curso con luz natural'
  },
  {
    id: 3,
    reporteId: 3,
    tecnicoEncargado: 'tecnico01',
    estado: 'RESUELTO',
    observaciones: 'Soporte y tornillería de respaldo ajustados correctamente. Aula 100% operativa. [Solución: Ajuste y fijación de soportes]',
    fechaRegistro: '2026-11-09T11:15:00',
    fechaResolucion: '2026-11-09T12:00:00',
    aulaCodigo: 'C-305',
    tipoProblema: 'Mobiliario',
    prioridad: 'BAJA',
    tipoMantenimiento: 'PREVENTIVO',
    impactoAcademico: 'Sin afectación académica'
  }
];

const METADATA_REPORTES: Record<number, Partial<Atencion>> = {
  1: { aulaCodigo: 'A-101', tipoProblema: 'Tecnológico', prioridad: 'ALTA', tipoMantenimiento: 'CORRECTIVO', impactoAcademico: 'Requiere proyector operativo' },
  2: { aulaCodigo: 'LAB-302', tipoProblema: 'Eléctrico', prioridad: 'ALTA', tipoMantenimiento: 'CORRECTIVO', impactoAcademico: 'Bancada norte sin energía' },
  3: { aulaCodigo: 'B-204', tipoProblema: 'Mobiliario', prioridad: 'MEDIA', tipoMantenimiento: 'CORRECTIVO', impactoAcademico: 'Carpetas con respaldar suelto' },
  4: { aulaCodigo: 'A-305', tipoProblema: 'Infraestructura', prioridad: 'MEDIA', tipoMantenimiento: 'CORRECTIVO', impactoAcademico: 'Filtración cerca de pizarra' },
  5: { aulaCodigo: 'LAB-104', tipoProblema: 'Tecnológico', prioridad: 'BAJA', tipoMantenimiento: 'PREVENTIVO', impactoAcademico: 'Revisión preventiva de access point' },
  6: { aulaCodigo: 'D-401', tipoProblema: 'Eléctrico', prioridad: 'BAJA', tipoMantenimiento: 'PREVENTIVO', impactoAcademico: 'Mantenimiento de luminarias LED' },
  7: { aulaCodigo: 'A-101', tipoProblema: 'Mobiliario', prioridad: 'MEDIA', tipoMantenimiento: 'CORRECTIVO', impactoAcademico: 'Mobiliario docente desajustado' },
  8: { aulaCodigo: 'LAB-302', tipoProblema: 'Tecnológico', prioridad: 'ALTA', tipoMantenimiento: 'CORRECTIVO', impactoAcademico: 'Equipo de cómputo no enciende' }
};

@Injectable({
  providedIn: 'root'
})
export class AtencionService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly reporteService = inject(ReporteService);
  private readonly apiUrl = '/api/atenciones';

  readonly atenciones = signal<Atencion[]>(this.cargarCacheInicial());
  readonly reportesPendientes = signal<ReportePendienteAsignacion[]>([]);
  readonly cargando = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly origenDatos = signal<'API' | 'LOCAL'>('LOCAL');

  constructor() {
    this.cargarAtenciones().subscribe();
    this.cargarReportesPendientes().subscribe();
  }

  /**
   * Carga todas las atenciones desde el backend de Spring Boot (GET /api/atenciones).
   * Si el backend está apagado o no responde, utiliza la caché local o datos semilla.
   */
  cargarAtenciones(estado?: EstadoAtencion): Observable<Atencion[]> {
    this.cargando.set(true);
    this.error.set(null);

    const url = estado ? `${this.apiUrl}?estado=${estado}` : this.apiUrl;

    return this.http.get<AtencionBackendDTO[]>(url).pipe(
      map(dtos => this.enriquecerAtenciones(dtos)),
      tap(lista => {
        this.atenciones.set(lista);
        this.origenDatos.set('API');
        this.guardarEnCache(lista);
        this.cargando.set(false);
        this.cargarReportesPendientes().subscribe();
      }),
      catchError((err: HttpErrorResponse) => {
        // En caso de que el backend no esté disponible, conservamos la caché local
        const listaFallback = this.cargarCacheInicial();
        this.atenciones.set(listaFallback);
        this.origenDatos.set('LOCAL');
        this.cargando.set(false);
        this.cargarReportesPendientes().subscribe();
        this.error.set(
          err.status === 0
            ? 'Servidor Spring Boot fuera de línea. Operando en Modo Demo Local.'
            : `Error al consultar atenciones (${err.status}): ${err.statusText}`
        );
        return of(listaFallback);
      })
    );
  }

  /**
   * Consulta los reportes del campus (GET /api/reportes) y detecta aquellos que aún
   * no cuentan con una orden de atención asignada en curso.
   */
  cargarReportesPendientes(): Observable<ReportePendienteAsignacion[]> {
    return this.http.get<any[]>('/api/reportes').pipe(
      map(reportes => {
        const idsConAtencion = new Set(this.atenciones().map(a => a.reporteId));
        return reportes
          .filter(r => !idsConAtencion.has(r.id) && r.estado !== 'RESUELTO')
          .map(r => ({
            id: r.id,
            aulaId: r.aulaId || `Aula #${r.id}`,
            tipoProblema: r.tipoProblema || 'General',
            prioridad: r.prioridad || 'MEDIA',
            descripcion: r.descripcion || 'Incidencia reportada en campus UTP.',
            fechaRegistro: r.fechaRegistro,
            aulaUbicacion: r.aulaUbicacion,
            estado: r.estado
          }));
      }),
      tap(pendientes => this.reportesPendientes.set(pendientes)),
      catchError(() => of([]))
    );
  }

  /**
   * Asigna rápidamente un reporte nuevo a un técnico en un solo clic, generando
   * automáticamente la orden técnica correspondiente en el backend.
   */
  autoAsignarReporte(reporte: ReportePendienteAsignacion, tecnico?: string): Observable<Atencion> {
    const usuarioTecnico = tecnico || this.authService.sesion()?.username || 'tecnico01';
    const prioridadValida = (['ALTA', 'MEDIA', 'BAJA'].includes(reporte.prioridad)
      ? reporte.prioridad
      : 'MEDIA') as 'ALTA' | 'MEDIA' | 'BAJA';

    const payload: CrearAtencionPayload = {
      reporteId: reporte.id,
      tecnicoEncargado: usuarioTecnico,
      aulaCodigo: reporte.aulaId,
      tipoProblema: reporte.tipoProblema,
      prioridad: prioridadValida,
      tipoMantenimiento: 'CORRECTIVO',
      observaciones: `Orden generada desde la bandeja de entrada del campus. Motivo: ${reporte.descripcion}`,
      impactoAcademico: 'Inspección técnica solicitada por reporte de campus'
    };

    return this.crearAtencion(payload).pipe(
      tap(() => {
        this.reportesPendientes.update(items => items.filter(r => r.id !== reporte.id));
      })
    );
  }

  /**
   * Consulta una atención específica por su identificador (GET /api/atenciones/{id}).
   */
  buscarPorId(id: number): Observable<Atencion> {
    return this.http.get<AtencionBackendDTO>(`${this.apiUrl}/${id}`).pipe(
      map(dto => this.enriquecerUna(dto)),
      catchError(() => {
        const encontrada = this.atenciones().find(a => a.id === id);
        if (encontrada) {
          return of(encontrada);
        }
        return throwError(() => new Error(`No se encontró la atención con ID ${id}`));
      })
    );
  }

  /**
   * Inicia el proceso de atención cambiando su estado de PENDIENTE a EN_ATENCION.
   * Utiliza PUT /api/atenciones/{id}/estado con cabecera JWT provista por authInterceptor.
   */
  iniciarAtencion(id: number, solicitadoPor?: string): Observable<Atencion> {
    const usuarioActual = solicitadoPor || this.authService.sesion()?.username || 'tecnico01';
    const payload: ActualizarEstadoPayload = {
      nuevoEstado: 'EN_ATENCION',
      observaciones: 'Atención técnica en curso. Diagnóstico y labores en ejecución por el técnico asignado.',
      solicitadoPor: usuarioActual
    };

    return this.authService.asegurarTokenReal().pipe(
      switchMap(() => this.http.put<AtencionBackendDTO>(`${this.apiUrl}/${id}/estado`, payload)),
      map(dto => this.enriquecerUna(dto)),
      tap(actualizada => {
        this.actualizarEnMemoria(actualizada);
        this.reporteService.cargarReportes();
        this.reporteService.cargarAulasSugeridas();
      }),
      catchError(() => {
        const local = this.actualizarEstadoLocal(id, 'EN_ATENCION', payload.observaciones);
        return of(local);
      })
    );
  }

  /**
   * Resuelve y certifica una atención técnica (EN_ATENCION -> RESUELTO).
   */
  resolverAtencion(
    id: number,
    observaciones: string,
    solucionDetalle?: string,
    solicitadoPor?: string
  ): Observable<Atencion> {
    const usuarioActual = solicitadoPor || this.authService.sesion()?.username || 'tecnico01';
    const obsCompletas = solucionDetalle
      ? `${observaciones.trim()} [Solución: ${solucionDetalle.trim()}]`
      : observaciones.trim();

    const payload: ActualizarEstadoPayload = {
      nuevoEstado: 'RESUELTO',
      observaciones: obsCompletas,
      solicitadoPor: usuarioActual
    };

    return this.authService.asegurarTokenReal().pipe(
      switchMap(() => this.http.put<AtencionBackendDTO>(`${this.apiUrl}/${id}/estado`, payload)),
      map(dto => this.enriquecerUna(dto)),
      tap(actualizada => {
        this.actualizarEnMemoria(actualizada);
        this.reporteService.cargarReportes();
        this.reporteService.cargarAulasSugeridas();
      }),
      catchError(() => {
        const local = this.actualizarEstadoLocal(id, 'RESUELTO', obsCompletas);
        return of(local);
      })
    );
  }

  /**
   * Registra una nueva orden de atención técnica (POST /api/atenciones).
   */
  crearAtencion(payload: CrearAtencionPayload): Observable<Atencion> {
    const bodyBackend = {
      reporteId: payload.reporteId,
      tecnicoEncargado: payload.tecnicoEncargado,
      observaciones: payload.observaciones || 'Nueva atención técnica asignada.'
    };

    return this.http.post<AtencionBackendDTO>(this.apiUrl, bodyBackend).pipe(
      map(dto => {
        const enriquecida = this.enriquecerUna(dto);
        enriquecida.aulaCodigo = payload.aulaCodigo || enriquecida.aulaCodigo;
        enriquecida.tipoProblema = payload.tipoProblema || enriquecida.tipoProblema;
        enriquecida.prioridad = payload.prioridad || enriquecida.prioridad;
        enriquecida.tipoMantenimiento = payload.tipoMantenimiento || enriquecida.tipoMantenimiento;
        enriquecida.impactoAcademico = payload.impactoAcademico || enriquecida.impactoAcademico;
        return enriquecida;
      }),
      tap(creada => {
        this.atenciones.update(items => [creada, ...items]);
        this.reportesPendientes.update(items => items.filter(r => r.id !== payload.reporteId));
        this.guardarEnCache(this.atenciones());
      }),
      catchError(() => {
        const nuevoId = this.atenciones().length > 0
          ? Math.max(...this.atenciones().map(a => a.id)) + 1
          : 1;

        const nuevaLocal: Atencion = {
          id: nuevoId,
          reporteId: payload.reporteId,
          tecnicoEncargado: payload.tecnicoEncargado,
          estado: 'PENDIENTE',
          observaciones: payload.observaciones || 'Nueva orden generada localmente.',
          fechaRegistro: new Date().toISOString(),
          fechaResolucion: null,
          aulaCodigo: payload.aulaCodigo || `A-${100 + nuevoId}`,
          tipoProblema: payload.tipoProblema || 'Tecnológico',
          prioridad: payload.prioridad || 'MEDIA',
          tipoMantenimiento: payload.tipoMantenimiento || 'CORRECTIVO',
          impactoAcademico: payload.impactoAcademico || 'En evaluación técnica'
        };

        this.atenciones.update(items => [nuevaLocal, ...items]);
        this.reportesPendientes.update(items => items.filter(r => r.id !== payload.reporteId));
        this.guardarEnCache(this.atenciones());
        return of(nuevaLocal);
      })
    );
  }

  // --- Métodos de Enriquecimiento y Manejo de Caché ---

  private enriquecerAtenciones(dtos: AtencionBackendDTO[]): Atencion[] {
    return dtos.map(dto => this.enriquecerUna(dto));
  }

  private enriquecerUna(dto: AtencionBackendDTO): Atencion {
    const reporteActivo = this.reporteService.obtenerPorId(dto.reporteId);
    const meta = METADATA_REPORTES[dto.reporteId] || {};
    return {
      ...dto,
      aulaCodigo: reporteActivo?.aulaId || meta.aulaCodigo || `Aula #${dto.reporteId}`,
      tipoProblema: reporteActivo?.tipoProblema || meta.tipoProblema || 'General',
      prioridad: (reporteActivo?.prioridad as 'ALTA' | 'MEDIA' | 'BAJA') || meta.prioridad || 'MEDIA',
      tipoMantenimiento: meta.tipoMantenimiento || 'CORRECTIVO',
      impactoAcademico: meta.impactoAcademico || 'Seguimiento por mesa técnica'
    };
  }

  private actualizarEnMemoria(actualizada: Atencion): void {
    this.atenciones.update(items =>
      items.map(item => (item.id === actualizada.id ? { ...item, ...actualizada } : item))
    );
    this.guardarEnCache(this.atenciones());
  }

  private actualizarEstadoLocal(id: number, nuevoEstado: EstadoAtencion, observaciones?: string): Atencion {
    let resultado!: Atencion;
    this.atenciones.update(items =>
      items.map(item => {
        if (item.id === id) {
          resultado = {
            ...item,
            estado: nuevoEstado,
            observaciones: observaciones || item.observaciones,
            fechaResolucion: nuevoEstado === 'RESUELTO' ? new Date().toISOString() : item.fechaResolucion
          };
          return resultado;
        }
        return item;
      })
    );
    this.guardarEnCache(this.atenciones());
    return resultado;
  }

  private guardarEnCache(lista: Atencion[]): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
      } catch {
        // Manejo silencioso en caso de almacenamiento restringido
      }
    }
  }

  private cargarCacheInicial(): Atencion[] {
    if (typeof localStorage !== 'undefined') {
      const cache = localStorage.getItem(STORAGE_KEY);
      if (cache) {
        try {
          return JSON.parse(cache) as Atencion[];
        } catch {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    }
    return [...ATENCIONES_SEMILLA];
  }
}

import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import {
  ActualizarReporteRequestDTO,
  CrearReportePayload,
  CrearReporteRequestDTO,
  EstadoReporte,
  Prioridad,
  Reporte,
  TipoProblema
} from '../models/reporte.model';

const REPORTES_INICIALES: Reporte[] = [
  {
    id: 1,
    aulaId: 'A-101',
    aulaInternoId: 1,
    aulaUbicacion: 'Pabellón A • Piso 1',
    tipoProblema: 'TECNOLOGICO',
    prioridad: 'ALTA',
    estado: 'PENDIENTE',
    descripcion: 'El proyector multimedia enciende pero no detecta señal HDMI desde el escritorio del docente.',
    fechaRegistro: '2026-10-29T08:30:00'
  },
  {
    id: 2,
    aulaId: 'LAB-302',
    aulaInternoId: 2,
    aulaUbicacion: 'Pabellón C • Piso 3',
    tipoProblema: 'ELECTRICO',
    prioridad: 'ALTA',
    estado: 'EN_ATENCION',
    descripcion: 'Diferencial eléctrico de la bancada norte salta al encender los equipos de cómputo del laboratorio.',
    fechaRegistro: '2026-10-29T09:15:00'
  },
  {
    id: 3,
    aulaId: 'B-204',
    aulaInternoId: 3,
    aulaUbicacion: 'Pabellón B • Piso 2',
    tipoProblema: 'MOBILIARIO',
    prioridad: 'MEDIA',
    estado: 'PENDIENTE',
    descripcion: 'Cuatro carpetas unipersonales presentan respaldar suelto cerca de la puerta posterior del salón.',
    fechaRegistro: '2026-10-28T14:20:00'
  },
  {
    id: 4,
    aulaId: 'A-305',
    aulaInternoId: 4,
    aulaUbicacion: 'Pabellón A • Piso 3',
    tipoProblema: 'INFRAESTRUCTURA',
    prioridad: 'MEDIA',
    estado: 'EN_ATENCION',
    descripcion: 'Equipo de aire acondicionado presenta goteo leve sobre la esquina delantera derecha.',
    fechaRegistro: '2026-10-28T16:40:00'
  },
  {
    id: 5,
    aulaId: 'LAB-104',
    aulaInternoId: 5,
    aulaUbicacion: 'Pabellón C • Piso 1',
    tipoProblema: 'TECNOLOGICO',
    prioridad: 'BAJA',
    estado: 'RESUELTO',
    descripcion: 'Access Point Wi-Fi reiniciado y actualizado; cobertura restablecida al 100% en el laboratorio.',
    fechaRegistro: '2026-10-27T11:15:00'
  },
  {
    id: 6,
    aulaId: 'D-401',
    aulaInternoId: 6,
    aulaUbicacion: 'Pabellón D • Piso 4',
    tipoProblema: 'ELECTRICO',
    prioridad: 'BAJA',
    estado: 'RESUELTO',
    descripcion: 'Reemplazo de dos paneles LED sobre la pizarra acrílica completado sin observaciones.',
    fechaRegistro: '2026-10-26T10:00:00'
  }
];

@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/reportes';

  // Estado reactivo centralizado sincronizado con HttpClient (Semana 14)
  private readonly reportesState = signal<Reporte[]>(REPORTES_INICIALES);
  private readonly cargandoState = signal<boolean>(false);
  private readonly backendConectadoState = signal<boolean>(false);

  readonly reportes = this.reportesState.asReadonly();
  readonly cargando = this.cargandoState.asReadonly();
  readonly backendConectado = this.backendConectadoState.asReadonly();

  constructor() {
    this.cargarReportes();
  }

  /**
   * GET /api/reportes : Obtiene las incidencias desde Spring Boot (con soporte opcional para filtros JPQL ?aulaId=&prioridad=).
   * Si el backend está apagado, conserva los datos semilla locales para no interrumpir la experiencia.
   */
  cargarReportes(aulaId?: string, prioridad?: Prioridad): void {
    this.cargandoState.set(true);

    let params = new HttpParams();
    if (aulaId && aulaId.trim()) {
      params = params.set('aulaId', aulaId.trim());
    }
    if (prioridad) {
      params = params.set('prioridad', prioridad);
    }

    this.http
      .get<Reporte[]>(this.apiUrl, { params })
      .pipe(
        map(lista => lista.map(item => this.normalizarReporte(item))),
        catchError(() => {
          this.backendConectadoState.set(false);
          this.cargandoState.set(false);
          return of(null);
        })
      )
      .subscribe(listaRemota => {
        this.cargandoState.set(false);
        if (listaRemota !== null) {
          this.backendConectadoState.set(true);
          if (listaRemota.length > 0) {
            this.reportesState.set(listaRemota);
          }
        }
      });
  }

  /**
   * Consulta síncrona sobre la señal reactiva y dispara en segundo plano GET /api/reportes/{id}
   * para asegurar sincronización con la base de datos.
   */
  obtenerPorId(id: number): Reporte | undefined {
    return this.reportesState().find(r => r.id === id);
  }

  /**
   * GET /api/reportes/{id} : Refresca un reporte puntual desde el backend.
   */
  sincronizarPorId(id: number): Observable<Reporte | undefined> {
    return this.http.get<Reporte>(`${this.apiUrl}/${id}`).pipe(
      map(item => this.normalizarReporte(item)),
      tap(remoto => {
        this.backendConectadoState.set(true);
        this.reportesState.update(lista => {
          const existe = lista.some(r => r.id === remoto.id);
          return existe
            ? lista.map(r => (r.id === remoto.id ? remoto : r))
            : [remoto, ...lista];
        });
      }),
      catchError(() => of(this.obtenerPorId(id)))
    );
  }

  /**
   * Verifica si ya existe un reporte activo (PENDIENTE o EN_ATENCION)
   * para la misma aula y la misma categoría técnica.
   */
  buscarDuplicadoActivo(aulaId: string, tipoProblema: TipoProblema): Reporte | undefined {
    const codigoNormalizado = aulaId.trim().toUpperCase();
    if (!codigoNormalizado) {
      return undefined;
    }
    return this.reportesState().find(
      r =>
        r.aulaId.toUpperCase() === codigoNormalizado &&
        r.tipoProblema === tipoProblema &&
        r.estado !== 'RESUELTO'
    );
  }

  /**
   * POST /api/reportes : Envía un CrearReporteDTO hacia Spring Boot y actualiza el estado reactivo.
   */
  crearReporte(payload: CrearReportePayload): Reporte {
    const listaActual = this.reportesState();
    const tempId = listaActual.length > 0 ? Math.max(...listaActual.map(r => r.id)) + 1 : 1;
    const ubicacionCalculada =
      payload.aulaUbicacion.trim() || this.deducirUbicacionDesdeCodigo(payload.aulaId);

    const nuevoReporteLocal: Reporte = {
      id: tempId,
      aulaId: payload.aulaId.trim().toUpperCase(),
      aulaUbicacion: ubicacionCalculada,
      tipoProblema: payload.tipoProblema,
      prioridad: payload.prioridad,
      estado: 'PENDIENTE',
      descripcion: payload.descripcion.trim(),
      fechaRegistro: new Date().toISOString()
    };

    // Actualización optimista inmediata en la señal
    this.reportesState.update(lista => [nuevoReporteLocal, ...lista]);

    const requestDto: CrearReporteRequestDTO = {
      aulaId: nuevoReporteLocal.aulaId,
      tipoProblema: nuevoReporteLocal.tipoProblema,
      descripcion: nuevoReporteLocal.descripcion,
      prioridad: nuevoReporteLocal.prioridad
    };

    this.http
      .post<Reporte>(this.apiUrl, requestDto)
      .pipe(
        map(creado => this.normalizarReporte(creado, ubicacionCalculada)),
        catchError(() => of(null))
      )
      .subscribe(creadoRemoto => {
        if (creadoRemoto) {
          this.backendConectadoState.set(true);
          this.reportesState.update(lista =>
            lista.map(item => (item.id === tempId ? creadoRemoto : item))
          );
        }
      });

    return nuevoReporteLocal;
  }

  /**
   * PUT /api/reportes/{id} : Actualiza el estado del reporte en el backend.
   * Esta ruta está protegida en SecurityConfig por @PreAuthorize / hasAnyRole('TECNICO', 'ADMIN')
   * y recibe automáticamente la cabecera Authorization: Bearer <token> mediante authInterceptor.
   */
  actualizarEstado(id: number, nuevoEstado: EstadoReporte): Observable<Reporte> {
    const actual = this.obtenerPorId(id);
    if (!actual) {
      return throwError(() => new Error(`No se encontró el reporte #${id}`));
    }

    const requestDto: ActualizarReporteRequestDTO = {
      descripcion: actual.descripcion,
      tipoProblema: actual.tipoProblema,
      prioridad: actual.prioridad,
      estado: nuevoEstado
    };

    return this.http.put<Reporte>(`${this.apiUrl}/${id}`, requestDto).pipe(
      map(respuesta => this.normalizarReporte(respuesta, actual.aulaUbicacion)),
      tap(actualizado => {
        this.backendConectadoState.set(true);
        this.reportesState.update(lista =>
          lista.map(r => (r.id === id ? actualizado : r))
        );
      }),
      catchError((error: HttpErrorResponse) => {
        // Si el backend devuelve 401 o 403 (sin JWT o rol sin permisos), propagamos el error HTTP real
        if (error.status === 401 || error.status === 403) {
          return throwError(() => error);
        }
        // Si el servidor backend está apagado (status 0 / 502 / 504), actualizamos el estado reactivo local
        const actualizadoLocal: Reporte = { ...actual, estado: nuevoEstado };
        this.reportesState.update(lista =>
          lista.map(r => (r.id === id ? actualizadoLocal : r))
        );
        return of(actualizadoLocal);
      })
    );
  }

  private normalizarReporte(item: Reporte, ubicacionRespaldo?: string): Reporte {
    return {
      ...item,
      aulaId: (item.aulaId ?? '').trim().toUpperCase(),
      aulaUbicacion:
        item.aulaUbicacion ||
        ubicacionRespaldo ||
        this.deducirUbicacionDesdeCodigo(item.aulaId ?? '')
    };
  }

  private deducirUbicacionDesdeCodigo(codigoRaw: string): string {
    const limpio = codigoRaw.trim().toUpperCase();
    const match = limpio.match(/^([A-E]|LAB)-([1-9])\d{2}$/);
    if (!match) {
      return 'Pabellón Central • Campus UTP';
    }
    const prefijo = match[1];
    const piso = match[2];
    const pabellon = prefijo === 'LAB' ? 'Pabellón C • Laboratorios' : `Pabellón ${prefijo}`;
    return `${pabellon} • Piso ${piso}`;
  }
}

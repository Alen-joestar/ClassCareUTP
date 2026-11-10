import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, switchMap, tap, throwError } from 'rxjs';
import {
  ActualizarReporteRequestDTO,
  AulaDisponible,
  CrearReportePayload,
  CrearReporteRequestDTO,
  EstadoReporte,
  Prioridad,
  Reporte,
  TipoProblema
} from '../models/reporte.model';
import { AuthService } from './auth.service';

const AULAS_POR_DEFECTO: AulaDisponible[] = [
  { codigo: 'A-101', ubicacion: 'Pabellón A • Piso 1' },
  { codigo: 'LAB-302', ubicacion: 'Pabellón C • Piso 3' },
  { codigo: 'B-204', ubicacion: 'Pabellón B • Piso 2' },
  { codigo: 'A-305', ubicacion: 'Pabellón A • Piso 3' },
  { codigo: 'D-401', ubicacion: 'Pabellón D • Piso 4' },
  { codigo: 'C-201', ubicacion: 'Pabellón C • Piso 2' }
];

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
  private readonly authService = inject(AuthService);
  private readonly apiUrl = '/api/reportes';
  private readonly aulasApiUrl = '/api/aulas';

  // Estado reactivo centralizado sincronizado con HttpClient (Semana 14)
  // Inicia vacío para evitar cualquier parpadeo (flash) de datos de respaldo al recargar con el backend encendido
  private readonly reportesState = signal<Reporte[]>([]);
  private readonly aulasSugeridasState = signal<AulaDisponible[]>(AULAS_POR_DEFECTO);
  private readonly cargandoState = signal<boolean>(true);
  private readonly backendConectadoState = signal<boolean>(false);

  readonly reportes = this.reportesState.asReadonly();
  readonly aulasSugeridas = this.aulasSugeridasState.asReadonly();
  readonly cargando = this.cargandoState.asReadonly();
  readonly backendConectado = this.backendConectadoState.asReadonly();

  constructor() {
    this.cargarReportes();
    this.cargarAulasSugeridas();
  }

  /**
   * Corrección #3: GET /api/reportes sincroniza fielmente el estado del servidor cuando responde 200 OK.
   * Solo usa el conjunto semilla local cuando el servidor backend está apagado.
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
          // Solo si el backend está apagado y la lista está vacía, activamos los 6 reportes de respaldo
          if (this.reportesState().length === 0) {
            this.reportesState.set(REPORTES_INICIALES);
          }
          return of(null);
        })
      )
      .subscribe(listaRemota => {
        this.cargandoState.set(false);
        if (listaRemota !== null) {
          this.backendConectadoState.set(true);
          this.reportesState.set(listaRemota);
        }
      });
  }

  /**
   * Corrección #4: GET /api/aulas obtiene las aulas reales registradas en la base de datos
   * para que los chips rápidos de ReporteFormComponent siempre apunten a aulas existentes.
   */
  cargarAulasSugeridas(): void {
    this.http
      .get<AulaDisponible[]>(this.aulasApiUrl)
      .pipe(catchError(() => of(null)))
      .subscribe(aulasRemotas => {
        if (aulasRemotas && aulasRemotas.length > 0) {
          this.aulasSugeridasState.set(
            aulasRemotas.map(a => ({
              id: a.id,
              codigo: (a.codigo ?? '').trim().toUpperCase(),
              ubicacion: a.ubicacion || this.deducirUbicacionDesdeCodigo(a.codigo ?? ''),
              capacidad: a.capacidad,
              estado: a.estado
            }))
          );
        }
      });
  }

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
   * Corrección #2: POST /api/reportes devuelve un Observable<Reporte>.
   * - Si el backend devuelve 400 o 404 (ej. aula no existe en BD), propaga el error HTTP real sin guardar datos falsos.
   * - Si el backend está apagado (status 0 / 502 / 504), guarda en memoria local para modo demostrativo.
   */
  crearReporte(payload: CrearReportePayload): Observable<Reporte> {
    const codigoNormalizado = payload.aulaId.trim().toUpperCase();
    const ubicacionCalculada =
      payload.aulaUbicacion.trim() || this.deducirUbicacionDesdeCodigo(codigoNormalizado);

    const requestDto: CrearReporteRequestDTO = {
      aulaId: codigoNormalizado,
      tipoProblema: payload.tipoProblema,
      descripcion: payload.descripcion.trim(),
      prioridad: payload.prioridad
    };

    return this.http.post<Reporte>(this.apiUrl, requestDto).pipe(
      map(creado => this.normalizarReporte(creado, ubicacionCalculada)),
      tap(creadoRemoto => {
        this.backendConectadoState.set(true);
        this.reportesState.update(lista => [creadoRemoto, ...lista]);
      }),
      catchError((error: HttpErrorResponse) => {
        // Si el backend respondió con error de negocio o recurso no encontrado (400 / 404), no mentir al usuario
        if (error.status === 400 || error.status === 404 || error.status === 409) {
          return throwError(() => error);
        }

        // Respaldo solo cuando el servidor Spring Boot está apagado
        const listaActual = this.reportesState();
        const nextId = listaActual.length > 0 ? Math.max(...listaActual.map(r => r.id)) + 1 : 1;
        const nuevoReporteLocal: Reporte = {
          id: nextId,
          aulaId: codigoNormalizado,
          aulaUbicacion: ubicacionCalculada,
          tipoProblema: payload.tipoProblema,
          prioridad: payload.prioridad,
          estado: 'PENDIENTE',
          descripcion: payload.descripcion.trim(),
          fechaRegistro: new Date().toISOString()
        };
        this.reportesState.update(lista => [nuevoReporteLocal, ...lista]);
        return of(nuevoReporteLocal);
      })
    );
  }

  /**
   * PUT /api/reportes/{id} : Actualiza el estado del reporte en el backend.
   * Incluye reintento automático si el cliente tenía un DEMO_JWT previo a encender el backend.
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

    const ejecutarPut = () =>
      this.http.put<Reporte>(`${this.apiUrl}/${id}`, requestDto).pipe(
        map(respuesta => this.normalizarReporte(respuesta, actual.aulaUbicacion)),
        tap(actualizado => {
          this.backendConectadoState.set(true);
          this.reportesState.update(lista =>
            lista.map(r => (r.id === id ? actualizado : r))
          );
        })
      );

    return ejecutarPut().pipe(
      catchError((error: HttpErrorResponse) => {
        // Corrección #1: Si dio 401 porque el navegador tenía un DEMO_JWT antes de encender Spring Boot,
        // solicita el token real a /api/auth/login y reintenta una vez.
        if (error.status === 401 && this.authService.sesion()?.origen === 'DEMO_JWT') {
          return this.authService.asegurarTokenReal().pipe(switchMap(() => ejecutarPut()));
        }

        // Propagar errores reales del servidor (401, 403, 404, 400)
        if (error.status === 401 || error.status === 403 || error.status === 404 || error.status === 400) {
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

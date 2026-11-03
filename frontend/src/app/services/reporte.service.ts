import { Injectable, signal } from '@angular/core';
import { CrearReportePayload, EstadoReporte, Reporte, TipoProblema } from '../models/reporte.model';

@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  // Fuente única de verdad reactiva (Preparada para HttpClient en Semana 14)
  private readonly reportesState = signal<Reporte[]>([
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
  ]);

  readonly reportes = this.reportesState.asReadonly();

  obtenerPorId(id: number): Reporte | undefined {
    return this.reportesState().find(r => r.id === id);
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

  crearReporte(payload: CrearReportePayload): Reporte {
    const listaActual = this.reportesState();
    const nextId = listaActual.length > 0 ? Math.max(...listaActual.map(r => r.id)) + 1 : 1;

    const nuevoReporte: Reporte = {
      id: nextId,
      aulaId: payload.aulaId.trim().toUpperCase(),
      aulaUbicacion: payload.aulaUbicacion.trim() || 'Pabellón Central • Campus UTP',
      tipoProblema: payload.tipoProblema,
      prioridad: payload.prioridad,
      estado: 'PENDIENTE',
      descripcion: payload.descripcion.trim(),
      fechaRegistro: new Date().toISOString()
    };

    this.reportesState.update(lista => [nuevoReporte, ...lista]);
    return nuevoReporte;
  }

  actualizarEstado(id: number, nuevoEstado: EstadoReporte): void {
    this.reportesState.update(lista =>
      lista.map(reporte => (reporte.id === id ? { ...reporte, estado: nuevoEstado } : reporte))
    );
  }
}

import { Injectable, signal } from '@angular/core';
import { EstadoReporte, Reporte } from '../models/reporte.model';

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
      aulaUbicacion: 'Pabellón A - Primer piso',
      tipoProblema: 'TECNOLOGICO',
      prioridad: 'ALTA',
      estado: 'PENDIENTE',
      descripcion: 'El proyector multimedia no emite señal HDMI ni enciende con el control remoto.',
      fechaRegistro: '2026-09-10T08:30:00'
    },
    {
      id: 2,
      aulaId: 'B-202',
      aulaInternoId: 2,
      aulaUbicacion: 'Pabellón B - Segundo piso',
      tipoProblema: 'ELECTRICO',
      prioridad: 'MEDIA',
      estado: 'EN_ATENCION',
      descripcion: 'Foco fluorescente parpadea constantemente en la fila delantera del aula.',
      fechaRegistro: '2026-09-09T14:15:00'
    },
    {
      id: 3,
      aulaId: 'C-305',
      aulaInternoId: 3,
      aulaUbicacion: 'Pabellón C - Tercer piso',
      tipoProblema: 'MOBILIARIO',
      prioridad: 'BAJA',
      estado: 'RESUELTO',
      descripcion: 'Silla ergonómica del docente con tornillo flojo en el soporte del respaldo.',
      fechaRegistro: '2026-09-08T11:00:00'
    }
  ]);

  readonly reportes = this.reportesState.asReadonly();

  obtenerPorId(id: number): Reporte | undefined {
    return this.reportesState().find(r => r.id === id);
  }

  actualizarEstado(id: number, nuevoEstado: EstadoReporte): void {
    this.reportesState.update(lista =>
      lista.map(reporte => (reporte.id === id ? { ...reporte, estado: nuevoEstado } : reporte))
    );
  }
}

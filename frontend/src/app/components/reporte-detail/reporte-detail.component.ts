import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EstadoReporte, Prioridad } from '../../models/reporte.model';
import { ReporteService } from '../../services/reporte.service';

@Component({
  selector: 'app-reporte-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './reporte-detail.component.html',
  styleUrl: './reporte-detail.component.scss'
})
export class ReporteDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly reporteService = inject(ReporteService);

  readonly reporteId = signal<number | null>(null);
  readonly mensajeActualizacion = signal<string>('');

  // Reporte reactivo calculado a partir del parámetro de ruta :id y del servicio
  readonly reporte = computed(() => {
    const id = this.reporteId();
    if (id === null || Number.isNaN(id)) {
      return undefined;
    }
    return this.reporteService.obtenerPorId(id);
  });

  constructor() {
    this.route.paramMap.subscribe(params => {
      const rawId = params.get('id');
      this.reporteId.set(rawId ? Number(rawId) : null);
      this.mensajeActualizacion.set('');
    });
  }

  cambiarEstado(nuevoEstado: EstadoReporte): void {
    const actual = this.reporte();
    if (!actual || actual.estado === nuevoEstado) {
      return;
    }
    this.reporteService.actualizarEstado(actual.id, nuevoEstado);
    this.mensajeActualizacion.set(`Estado del ticket #${actual.id} actualizado a ${nuevoEstado}.`);
  }

  getPrioridadBadgeClass(prioridad: Prioridad): string {
    switch (prioridad) {
      case 'ALTA': return 'badge--alta';
      case 'MEDIA': return 'badge--media';
      case 'BAJA': return 'badge--baja';
    }
  }

  getEstadoBadgeClass(estado: EstadoReporte): string {
    switch (estado) {
      case 'PENDIENTE': return 'badge--pendiente';
      case 'EN_ATENCION': return 'badge--atencion';
      case 'RESUELTO': return 'badge--resuelto';
    }
  }

  getImpactoAula(prioridad: Prioridad, estado: EstadoReporte): string {
    if (estado === 'RESUELTO') {
      return 'Disponible (Incidencia subsanada)';
    }
    if (prioridad === 'ALTA') {
      return 'En Mantenimiento (Bloqueo preventivo por urgencia alta)';
    }
    return 'Operativa con observación técnica';
  }
}

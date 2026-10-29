import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EstadoReporte, Prioridad } from '../../models/reporte.model';
import { ReporteService } from '../../services/reporte.service';

@Component({
  selector: 'app-reporte-detail',
  imports: [
    DatePipe,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatSnackBarModule
  ],
  templateUrl: './reporte-detail.component.html',
  styleUrl: './reporte-detail.component.scss'
})
export class ReporteDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly reporteService = inject(ReporteService);
  private readonly snackBar = inject(MatSnackBar);

  readonly reporteId = signal<number | null>(null);

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
    });
  }

  cambiarEstado(nuevoEstado: EstadoReporte): void {
    const actual = this.reporte();
    if (!actual || actual.estado === nuevoEstado) {
      return;
    }
    this.reporteService.actualizarEstado(actual.id, nuevoEstado);
    this.snackBar.open(
      `Ticket #${actual.id} actualizado a estado: ${nuevoEstado}`,
      'Cerrar',
      { duration: 3500, horizontalPosition: 'end', verticalPosition: 'bottom' }
    );
  }

  getPrioridadBadgeClass(prioridad: Prioridad): string {
    switch (prioridad) {
      case 'ALTA': return 'm3-chip--alta';
      case 'MEDIA': return 'm3-chip--media';
      case 'BAJA': return 'm3-chip--baja';
    }
  }

  getEstadoBadgeClass(estado: EstadoReporte): string {
    switch (estado) {
      case 'PENDIENTE': return 'm3-chip--pendiente';
      case 'EN_ATENCION': return 'm3-chip--atencion';
      case 'RESUELTO': return 'm3-chip--resuelto';
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

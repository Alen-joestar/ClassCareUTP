import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Prioridad } from '../../models/reporte.model';
import { ReporteService } from '../../services/reporte.service';

@Component({
  selector: 'app-reporte-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reporte-list.component.html',
  styleUrl: './reporte-list.component.scss'
})
export class ReporteListComponent {
  private readonly reporteService = inject(ReporteService);

  // Estado reactivo con Signals
  readonly searchQuery = signal<string>('');
  readonly selectedPrioridad = signal<string>('');

  // Fuente de datos compartida desde ReporteService
  readonly reportes = this.reporteService.reportes;

  // Lista filtrada reactiva calculada automáticamente
  readonly filteredReportes = computed(() => {
    const query = this.searchQuery().trim().toUpperCase();
    const prioridad = this.selectedPrioridad();

    return this.reportes().filter(reporte => {
      const matchesQuery = !query || reporte.aulaId.toUpperCase().includes(query) || reporte.descripcion.toUpperCase().includes(query);
      const matchesPrioridad = !prioridad || reporte.prioridad === prioridad;
      return matchesQuery && matchesPrioridad;
    });
  });

  // Métricas reactivas para el dashboard
  readonly totalIncidencias = computed(() => this.reportes().length);
  readonly totalAltas = computed(() => this.reportes().filter(r => r.prioridad === 'ALTA').length);
  readonly totalPendientes = computed(() => this.reportes().filter(r => r.estado === 'PENDIENTE').length);

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }

  onPrioridadChange(value: string): void {
    this.selectedPrioridad.set(value);
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.selectedPrioridad.set('');
  }

  getPrioridadBadgeClass(prioridad: Prioridad): string {
    switch (prioridad) {
      case 'ALTA': return 'badge--alta';
      case 'MEDIA': return 'badge--media';
      case 'BAJA': return 'badge--baja';
    }
  }

  getEstadoBadgeClass(estado: string): string {
    switch (estado) {
      case 'PENDIENTE': return 'badge--pendiente';
      case 'EN_ATENCION': return 'badge--atencion';
      case 'RESUELTO': return 'badge--resuelto';
      default: return '';
    }
  }
}

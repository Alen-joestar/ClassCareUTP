import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Reporte, Prioridad } from '../../models/reporte.model';

@Component({
  selector: 'app-reporte-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reporte-list.component.html',
  styleUrl: './reporte-list.component.scss'
})
export class ReporteListComponent {
  // Estado reactivo con Signals
  readonly searchQuery = signal<string>('');
  readonly selectedPrioridad = signal<string>('');

  // Datos iniciales de la Semana 11 (Preparados para Semana 14 con HttpClient)
  readonly reportes = signal<Reporte[]>([
    {
      id: 1,
      aulaId: 'A-101',
      tipoProblema: 'TECNOLOGICO',
      prioridad: 'ALTA',
      estado: 'PENDIENTE',
      descripcion: 'El proyector multimedia no emite señal HDMI ni enciende con el control remoto.',
      fechaRegistro: '2026-09-10T08:30:00'
    },
    {
      id: 2,
      aulaId: 'B-202',
      tipoProblema: 'ELECTRICO',
      prioridad: 'MEDIA',
      estado: 'EN_ATENCION',
      descripcion: 'Foco fluorescente parpadea constantemente en la fila delantera del aula.',
      fechaRegistro: '2026-09-09T14:15:00'
    },
    {
      id: 3,
      aulaId: 'C-305',
      tipoProblema: 'MOBILIARIO',
      prioridad: 'BAJA',
      estado: 'RESUELTO',
      descripcion: 'Silla ergonómica del docente con tornillo flojo en el soporte del respaldo.',
      fechaRegistro: '2026-09-08T11:00:00'
    }
  ]);

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

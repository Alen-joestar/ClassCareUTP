import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { EstadoReporte, Prioridad, TipoProblema } from '../../models/reporte.model';
import { ReporteService } from '../../services/reporte.service';

@Component({
  selector: 'app-reporte-list',
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    MatIconModule
  ],
  templateUrl: './reporte-list.component.html',
  styleUrl: './reporte-list.component.scss'
})
export class ReporteListComponent {
  private readonly reporteService = inject(ReporteService);

  // Estado reactivo de filtros con Signals
  readonly searchQuery = signal<string>('');
  readonly selectedPrioridad = signal<string>('');
  readonly selectedEstado = signal<string>('');

  // Fuente de datos compartida desde ReporteService
  readonly reportes = this.reporteService.reportes;

  // Lista filtrada reactiva calculada automáticamente
  readonly filteredReportes = computed(() => {
    const query = this.searchQuery().trim().toUpperCase();
    const prioridad = this.selectedPrioridad();
    const estado = this.selectedEstado();

    return this.reportes().filter(reporte => {
      const matchesQuery = !query || reporte.aulaId.toUpperCase().includes(query) || reporte.descripcion.toUpperCase().includes(query);
      const matchesPrioridad = !prioridad || reporte.prioridad === prioridad;
      const matchesEstado = !estado || reporte.estado === estado;
      return matchesQuery && matchesPrioridad && matchesEstado;
    });
  });

  // Métricas reactivas para el Hero Banner Marino Institucional
  readonly totalIncidencias = computed(() => this.reportes().length);
  readonly totalPendientes = computed(() => this.reportes().filter(r => r.estado === 'PENDIENTE').length);
  readonly totalEnAtencion = computed(() => this.reportes().filter(r => r.estado === 'EN_ATENCION').length);
  readonly totalResueltos = computed(() => this.reportes().filter(r => r.estado === 'RESUELTO').length);

  formatCount(count: number): string {
    return String(count).padStart(2, '0');
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }

  onPrioridadChange(value: string): void {
    this.selectedPrioridad.set(value);
  }

  filterByEstado(estado: string): void {
    this.selectedEstado.set(estado);
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.selectedPrioridad.set('');
    this.selectedEstado.set('');
  }

  getPasoEstado(estado: EstadoReporte): number {
    switch (estado) {
      case 'PENDIENTE': return 1;
      case 'EN_ATENCION': return 2;
      case 'RESUELTO': return 3;
    }
  }

  getEstadoLabel(estado: EstadoReporte): string {
    switch (estado) {
      case 'PENDIENTE': return 'PENDIENTE';
      case 'EN_ATENCION': return 'EN ATENCIÓN';
      case 'RESUELTO': return 'RESUELTO';
    }
  }

  getPrioridadLabel(prioridad: Prioridad): string {
    switch (prioridad) {
      case 'ALTA': return 'Prioridad Alta';
      case 'MEDIA': return 'Prioridad Media';
      case 'BAJA': return 'Prioridad Baja';
    }
  }

  getImpactoAula(prioridad: Prioridad, estado: EstadoReporte): string {
    if (estado === 'RESUELTO') {
      return 'Aula 100% operativa';
    }
    if (prioridad === 'ALTA') {
      return 'Inhabilita uso en clase';
    }
    return 'Aula operativa con obs.';
  }

  getCategoriaLabel(tipo: TipoProblema): string {
    switch (tipo) {
      case 'TECNOLOGICO': return 'Tecnológico';
      case 'ELECTRICO': return 'Eléctrico';
      case 'MOBILIARIO': return 'Mobiliario';
      case 'INFRAESTRUCTURA': return 'Infraestructura';
      case 'OTRO': return 'Otro';
    }
  }

  getCategoriaIcon(tipo: TipoProblema): string {
    switch (tipo) {
      case 'TECNOLOGICO': return 'videocam_off';
      case 'ELECTRICO': return 'bolt';
      case 'MOBILIARIO': return 'chair';
      case 'INFRAESTRUCTURA': return 'ac_unit';
      case 'OTRO': return 'build';
    }
  }
}

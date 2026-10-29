import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Prioridad, TipoProblema } from '../../models/reporte.model';
import { ReporteService } from '../../services/reporte.service';

@Component({
  selector: 'app-reporte-list',
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
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

  // Métricas reactivas para el dashboard M3
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
      case 'ALTA': return 'm3-chip--alta';
      case 'MEDIA': return 'm3-chip--media';
      case 'BAJA': return 'm3-chip--baja';
    }
  }

  getEstadoBadgeClass(estado: string): string {
    switch (estado) {
      case 'PENDIENTE': return 'm3-chip--pendiente';
      case 'EN_ATENCION': return 'm3-chip--atencion';
      case 'RESUELTO': return 'm3-chip--resuelto';
      default: return '';
    }
  }

  getCategoriaIcon(tipo: TipoProblema): string {
    switch (tipo) {
      case 'TECNOLOGICO': return 'devices';
      case 'ELECTRICO': return 'bolt';
      case 'MOBILIARIO': return 'chair';
      case 'INFRAESTRUCTURA': return 'domain';
      case 'OTRO': return 'build';
    }
  }
}

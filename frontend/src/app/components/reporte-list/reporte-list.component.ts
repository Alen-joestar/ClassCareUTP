import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { EstadoReporte, Prioridad, TipoProblema } from '../../models/reporte.model';
import { ReporteService } from '../../services/reporte.service';

export type OrdenReportes = 'RECIENTES' | 'PRIORIDAD_ALTA' | 'PENDIENTES_PRIMERO';

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

  // Estado reactivo de filtros y ordenamiento con Signals
  readonly searchQuery = signal<string>('');
  readonly selectedPrioridad = signal<string>('');
  readonly selectedCategoria = signal<string>('');
  readonly selectedEstado = signal<string>('');
  readonly sortBy = signal<OrdenReportes>('RECIENTES');

  // Fuente de datos compartida desde ReporteService
  readonly reportes = this.reporteService.reportes;
  readonly cargando = this.reporteService.cargando;
  readonly backendConectado = this.reporteService.backendConectado;

  // Lista filtrada y ordenada reactiva calculada automáticamente
  readonly filteredReportes = computed(() => {
    const query = this.searchQuery().trim().toUpperCase();
    const prioridad = this.selectedPrioridad();
    const categoria = this.selectedCategoria();
    const estado = this.selectedEstado();
    const orden = this.sortBy();

    const filtrados = this.reportes().filter(reporte => {
      const matchesQuery =
        !query ||
        reporte.aulaId.toUpperCase().includes(query) ||
        reporte.descripcion.toUpperCase().includes(query) ||
        (reporte.aulaUbicacion ?? '').toUpperCase().includes(query);
      const matchesPrioridad = !prioridad || reporte.prioridad === prioridad;
      const matchesCategoria = !categoria || reporte.tipoProblema === categoria;
      const matchesEstado = !estado || reporte.estado === estado;
      return matchesQuery && matchesPrioridad && matchesCategoria && matchesEstado;
    });

    const pesoPrioridad: Record<Prioridad, number> = { ALTA: 3, MEDIA: 2, BAJA: 1 };
    const pesoEstado: Record<EstadoReporte, number> = { PENDIENTE: 1, EN_ATENCION: 2, RESUELTO: 3 };

    return [...filtrados].sort((a, b) => {
      if (orden === 'PRIORIDAD_ALTA') {
        const diffPrio = pesoPrioridad[b.prioridad] - pesoPrioridad[a.prioridad];
        if (diffPrio !== 0) {
          return diffPrio;
        }
      }
      if (orden === 'PENDIENTES_PRIMERO') {
        const diffEstado = pesoEstado[a.estado] - pesoEstado[b.estado];
        if (diffEstado !== 0) {
          return diffEstado;
        }
      }
      return new Date(b.fechaRegistro).getTime() - new Date(a.fechaRegistro).getTime();
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

  onCategoriaChange(value: string): void {
    this.selectedCategoria.set(value);
  }

  onSortChange(value: OrdenReportes): void {
    this.sortBy.set(value);
  }

  filterByEstado(estado: string): void {
    this.selectedEstado.set(estado);
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.selectedPrioridad.set('');
    this.selectedCategoria.set('');
    this.selectedEstado.set('');
    this.sortBy.set('RECIENTES');
    this.reporteService.cargarReportes();
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

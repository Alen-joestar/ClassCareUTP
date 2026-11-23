import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EstadoReporte, Prioridad, TipoProblema } from '../../models/reporte.model';
import { AuthService } from '../../services/auth.service';
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
  protected readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  constructor() {
    this.route.queryParamMap.subscribe(params => {
      const aulaQuery = params.get('aula');
      if (aulaQuery) {
        this.searchQuery.set(aulaQuery.trim());
      }
    });
  }

  // Estado reactivo de filtros y ordenamiento con Signals
  readonly searchQuery = signal<string>('');
  readonly selectedPrioridad = signal<string>('');
  readonly selectedCategoria = signal<string>('');
  readonly selectedEstado = signal<string>('');
  readonly sortBy = signal<OrdenReportes>('RECIENTES');
  readonly soloMisReportes = signal<boolean>(false);
  readonly mostrarMenuFiltros = signal<boolean>(false);

  // Cantidad de filtros/ordenamientos activos dentro del menú desplegable
  readonly totalFiltrosActivos = computed(() => {
    let count = 0;
    if (this.selectedCategoria()) count++;
    if (this.selectedPrioridad()) count++;
    if (this.sortBy() !== 'RECIENTES') count++;
    if (this.soloMisReportes()) count++;
    return count;
  });

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
    const misReportes = this.soloMisReportes();
    const sesion = this.authService.sesion();
    const miNombre = (sesion?.nombreCompleto || '').trim().toUpperCase();
    const miUsername = (sesion?.username || '').trim().toUpperCase();

    const filtrados = this.reportes().filter(reporte => {
      const autorReporte = (reporte.reportadoPor || 'Comunidad Académica UTP').trim().toUpperCase();
      const matchesQuery =
        !query ||
        reporte.aulaId.toUpperCase().includes(query) ||
        reporte.descripcion.toUpperCase().includes(query) ||
        (reporte.aulaUbicacion ?? '').toUpperCase().includes(query) ||
        autorReporte.includes(query);
      const matchesPrioridad = !prioridad || reporte.prioridad === prioridad;
      const matchesCategoria = !categoria || reporte.tipoProblema === categoria;
      const matchesEstado = !estado || reporte.estado === estado;
      const matchesAutor =
        !misReportes ||
        (Boolean(miNombre) && autorReporte.includes(miNombre)) ||
        (Boolean(miUsername) && autorReporte.includes(miUsername));
      return matchesQuery && matchesPrioridad && matchesCategoria && matchesEstado && matchesAutor;
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

  toggleMenuFiltros(): void {
    this.mostrarMenuFiltros.update(v => !v);
  }

  cerrarMenuFiltros(): void {
    this.mostrarMenuFiltros.set(false);
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.selectedPrioridad.set('');
    this.selectedCategoria.set('');
    this.selectedEstado.set('');
    this.sortBy.set('RECIENTES');
    this.soloMisReportes.set(false);
    this.mostrarMenuFiltros.set(false);
    this.reporteService.cargarReportes();
    this.reporteService.cargarAulasSugeridas();
  }

  toggleMisReportes(): void {
    this.soloMisReportes.update(v => !v);
  }

  exportarReportesCsv(): void {
    const lista = this.filteredReportes();
    if (lista.length === 0 || typeof document === 'undefined') {
      return;
    }

    const cabeceras = [
      'ID',
      'Aula',
      'Ubicacion',
      'Categoria',
      'Prioridad',
      'Estado',
      'Reportado Por',
      'Fecha Registro',
      'Descripcion'
    ];

    const escapar = (val: string | number | undefined) => {
      const texto = String(val ?? '').replace(/"/g, '""');
      return `"${texto}"`;
    };

    const filas = lista.map(r =>
      [
        `#${this.formatCount(r.id)}`,
        r.aulaId,
        r.aulaUbicacion || 'Campus UTP',
        this.getCategoriaLabel(r.tipoProblema),
        this.getPrioridadLabel(r.prioridad),
        this.getEstadoLabel(r.estado),
        r.reportadoPor || 'Comunidad Académica UTP',
        r.fechaRegistro,
        r.descripcion
      ]
        .map(escapar)
        .join(';')
    );

    const contenidoCsv = '\uFEFF' + [cabeceras.join(';'), ...filas].join('\r\n');
    const blob = new Blob([contenidoCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `reportes-classcare-utp-${new Date().toISOString().slice(0, 10)}.csv`;
    enlace.click();
    URL.revokeObjectURL(url);
  }

  sincronizarConBackend(): void {
    this.reporteService.cargarReportes();
    this.reporteService.cargarAulasSugeridas();
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

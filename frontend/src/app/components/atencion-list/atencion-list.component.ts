import { Component, computed, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Atencion, EstadoAtencion, TipoMantenimiento } from '../../models/atencion.model';

@Component({
  selector: 'app-atencion-list',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    MatIconModule
  ],
  templateUrl: './atencion-list.component.html',
  styleUrl: './atencion-list.component.scss'
})
export class AtencionListComponent {
  // Estado reactivo de filtros con Signals
  readonly searchQuery = signal<string>('');
  readonly selectedEstado = signal<string>('');
  readonly selectedTecnico = signal<string>('');

  // Usuario técnico en sesión actual (Simulación técnica para pruebas de rol)
  readonly tecnicoLogueado = 'tecnico01';

  // Datos de la mesa de soporte técnico
  readonly atenciones = signal<Atencion[]>([
    {
      id: 1,
      reporteId: 1,
      tecnicoEncargado: 'tecnico01',
      estado: 'PENDIENTE',
      observaciones: 'Caso asignado para inspección de proyector multimedia en aula A-101.',
      fechaRegistro: '2026-09-10T09:00:00',
      fechaResolucion: null,
      aulaCodigo: 'A-101',
      tipoProblema: 'Tecnológico',
      prioridad: 'ALTA',
      tipoMantenimiento: 'CORRECTIVO',
      impactoAcademico: 'Requiere aula alterna'
    },
    {
      id: 2,
      reporteId: 2,
      tecnicoEncargado: 'tecnico02',
      estado: 'EN_ATENCION',
      observaciones: 'Técnico en sitio realizando reemplazo de luminaria fluorescente.',
      fechaRegistro: '2026-09-09T14:30:00',
      fechaResolucion: null,
      aulaCodigo: 'B-202',
      tipoProblema: 'Eléctrico',
      prioridad: 'MEDIA',
      tipoMantenimiento: 'CORRECTIVO',
      impactoAcademico: 'Clase en curso con luz natural'
    },
    {
      id: 3,
      reporteId: 3,
      tecnicoEncargado: 'tecnico01',
      estado: 'RESUELTO',
      observaciones: 'Soporte y tornillería de respaldo ajustados correctamente. Aula 100% operativa.',
      fechaRegistro: '2026-09-08T11:15:00',
      fechaResolucion: '2026-09-08T12:00:00',
      aulaCodigo: 'C-305',
      tipoProblema: 'Mobiliario',
      prioridad: 'BAJA',
      tipoMantenimiento: 'PREVENTIVO',
      impactoAcademico: 'Sin afectación académica'
    }
  ]);

  // Lista filtrada reactiva en tiempo real (por texto, estado y técnico asignado)
  readonly filteredAtenciones = computed(() => {
    const query = this.searchQuery().trim().toUpperCase();
    const estado = this.selectedEstado();
    const tecnico = this.selectedTecnico();

    return this.atenciones().filter(item => {
      const matchesQuery =
        !query ||
        item.tecnicoEncargado.toUpperCase().includes(query) ||
        (item.aulaCodigo && item.aulaCodigo.toUpperCase().includes(query)) ||
        (item.observaciones && item.observaciones.toUpperCase().includes(query)) ||
        String(item.id).includes(query) ||
        String(item.reporteId).includes(query);

      const matchesEstado = !estado || item.estado === estado;
      const matchesTecnico = !tecnico || item.tecnicoEncargado === tecnico;

      return matchesQuery && matchesEstado && matchesTecnico;
    });
  });

  // Métricas reactivas y KPIs operacionales
  readonly totalAtenciones = computed(() => this.atenciones().length);
  readonly totalPendientes = computed(() => this.atenciones().filter(a => a.estado === 'PENDIENTE').length);
  readonly totalEnAtencion = computed(() => this.atenciones().filter(a => a.estado === 'EN_ATENCION').length);
  readonly totalResueltos = computed(() => this.atenciones().filter(a => a.estado === 'RESUELTO').length);

  // KPI Gerencial: Tasa de Resolución porcentual
  readonly tasaResolucion = computed(() => {
    const total = this.totalAtenciones();
    if (total === 0) return 0;
    return Math.round((this.totalResueltos() / total) * 100);
  });

  // Lista de técnicos disponibles con carga activa
  readonly tecnicosDisponibles = computed(() => {
    const map = new Map<string, number>();
    for (const atencion of this.atenciones()) {
      const count = map.get(atencion.tecnicoEncargado) || 0;
      map.set(atencion.tecnicoEncargado, count + 1);
    }
    return Array.from(map.entries()).map(([tecnico, count]) => ({ tecnico, count }));
  });

  formatCount(count: number): string {
    return String(count).padStart(2, '0');
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }

  filterByEstado(estado: string): void {
    this.selectedEstado.update(current => (current === estado ? '' : estado));
  }

  filterByTecnico(tecnico: string): void {
    this.selectedTecnico.update(current => (current === tecnico ? '' : tecnico));
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.selectedEstado.set('');
    this.selectedTecnico.set('');
  }

  // Stepper de Ciclo de Vida: 1=Asignado, 2=En Proceso, 3=Certificado
  getPasoActivo(estado: EstadoAtencion): number {
    switch (estado) {
      case 'PENDIENTE': return 1;
      case 'EN_ATENCION': return 2;
      case 'RESUELTO': return 3;
    }
  }

  getEstadoLabel(estado: EstadoAtencion): string {
    switch (estado) {
      case 'PENDIENTE': return 'PENDIENTE';
      case 'EN_ATENCION': return 'EN ATENCIÓN';
      case 'RESUELTO': return 'RESUELTO';
    }
  }

  getEstadoIcon(estado: EstadoAtencion): string {
    switch (estado) {
      case 'PENDIENTE': return 'schedule';
      case 'EN_ATENCION': return 'engineering';
      case 'RESUELTO': return 'check_circle';
    }
  }

  getMantenimientoLabel(tipo?: TipoMantenimiento): string {
    return tipo === 'PREVENTIVO' ? 'Mant. Preventivo' : 'Mant. Correctivo';
  }
}

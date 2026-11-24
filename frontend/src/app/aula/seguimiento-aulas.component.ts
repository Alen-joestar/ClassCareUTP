import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { Atencion, EstadoAtencion } from '../models/atencion.model';
import { EstadoReporte, Reporte, TipoProblema } from '../models/reporte.model';
import { AtencionService } from '../services/atencion.service';
import { ReporteService } from '../services/reporte.service';
import { Aula } from './aula.model';
import { AulaService } from './aula.service';

type EstadoAula = 'Disponible' | 'Ocupada' | 'Mantenimiento';
type EstadoIncidencia = 'Pendiente' | 'En atención' | 'Solucionada';
type FiltroDisponibilidad = '' | 'disponible' | 'no-disponible';
type FiltroIncidencia = '' | 'sin-incidencias' | EstadoIncidencia;

interface IncidenciaAula {
  reporteId: number;
  descripcion: string;
  tipo: string;
  fechaReporte: string;
  estado: EstadoIncidencia;
  tecnico?: string;
  fechaResolucion?: string;
  solucion?: string;
}

interface AulaSeguimiento extends Aula {
  incidencias: IncidenciaAula[];
}

@Component({
  selector: 'app-seguimiento-aulas',
  standalone: true,
  imports: [DatePipe, FormsModule, MatIconModule, RouterLink],
  templateUrl: './seguimiento-aulas.component.html',
  styleUrl: './seguimiento-aulas.component.scss'
})
export class SeguimientoAulasComponent implements OnInit {
  private readonly aulaService = inject(AulaService);
  private readonly reporteService = inject(ReporteService);
  private readonly atencionService = inject(AtencionService);

  readonly busqueda = signal('');
  readonly estadoSeleccionado = signal<'' | EstadoAula>('');
  readonly disponibilidadSeleccionada = signal<FiltroDisponibilidad>('');
  readonly incidenciaSeleccionada = signal<FiltroIncidencia>('');
  readonly aulaSeleccionada = signal<AulaSeguimiento | null>(null);

  readonly cargando = computed(() =>
    this.aulaService.cargando() ||
    this.reporteService.cargando() ||
    this.atencionService.cargando()
  );
  readonly errorSincronizacion = computed(() =>
    this.aulaService.error() || this.atencionService.error()
  );
  readonly sincronizado = computed(() =>
    this.aulaService.origenDatos() === 'API' &&
    this.reporteService.backendConectado() &&
    this.atencionService.origenDatos() === 'API'
  );
  readonly estadoSincronizacion = computed(() => {
    if (this.cargando()) {
      return 'Sincronizando datos…';
    }
    return this.sincronizado()
      ? 'Sincronizado con la base de datos'
      : 'Datos locales · sin sincronización';
  });
  readonly aulas = computed(() => {
    const atencionesPorReporte = new Map(
      this.atencionService.atenciones().map(atencion => [atencion.reporteId, atencion])
    );
    const reportesPorAula = new Map<string, Reporte[]>();

    for (const reporte of this.reporteService.reportes()) {
      const codigo = this.normalizar(reporte.aulaId);
      const reportes = reportesPorAula.get(codigo) ?? [];
      reportes.push(reporte);
      reportesPorAula.set(codigo, reportes);
    }

    return this.aulaService.aulas().map(aula => ({
      ...aula,
      incidencias: (reportesPorAula.get(this.normalizar(aula.codigo)) ?? [])
        .map(reporte => this.crearIncidencia(reporte, atencionesPorReporte.get(reporte.id)))
        .sort((primera, segunda) =>
          segunda.fechaReporte.localeCompare(primera.fechaReporte)
        )
    }));
  });

  readonly aulasFiltradas = computed(() => {
    const texto = this.normalizar(this.busqueda());
    const estado = this.estadoSeleccionado();
    const disponibilidad = this.disponibilidadSeleccionada();
    const incidencia = this.incidenciaSeleccionada();

    return this.aulas().filter(aula => {
      const coincideTexto =
        !texto ||
        this.normalizar(aula.codigo).includes(texto) ||
        this.normalizar(aula.ubicacion).includes(texto);
      const coincideEstado =
        !estado || this.claseEstadoAula(aula.estado) === this.claseEstadoAula(estado);
      const estaDisponible = this.normalizar(aula.estado) === 'disponible';
      const coincideDisponibilidad =
        !disponibilidad ||
        (disponibilidad === 'disponible' ? estaDisponible : !estaDisponible);
      const estadoIncidencia = this.estadoAtencion(aula);
      const coincideIncidencia =
        !incidencia ||
        (incidencia === 'sin-incidencias'
          ? aula.incidencias.length === 0
          : estadoIncidencia === incidencia);

      return coincideTexto && coincideEstado && coincideDisponibilidad && coincideIncidencia;
    });
  });

  readonly totalAulas = computed(() => this.aulas().length);
  readonly aulasDisponibles = computed(() =>
    this.aulas().filter(aula => this.normalizar(aula.estado) === 'disponible').length
  );
  readonly aulasOcupadas = computed(() =>
    this.aulas().filter(aula => this.normalizar(aula.estado) === 'ocupada').length
  );
  readonly aulasConIncidenciasPendientes = computed(() =>
    this.aulas().filter(aula =>
      aula.incidencias.some(incidencia => incidencia.estado !== 'Solucionada')
    ).length
  );

  ngOnInit(): void {
    void this.aulaService.listar().catch(() => undefined);
  }

  actualizarDatos(): void {
    void this.aulaService.listar().catch(() => undefined);
    this.reporteService.cargarReportes();
    this.atencionService.cargarAtenciones().subscribe();
  }

  cambiarBusqueda(valor: string): void {
    this.busqueda.set(valor);
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.estadoSeleccionado.set('');
    this.disponibilidadSeleccionada.set('');
    this.incidenciaSeleccionada.set('');
  }

  abrirDetalles(aula: AulaSeguimiento): void {
    this.aulaSeleccionada.set(aula);
  }

  cerrarDetalles(): void {
    this.aulaSeleccionada.set(null);
  }

  estadoAtencion(aula: AulaSeguimiento): string {
    if (aula.incidencias.length === 0) {
      return 'Sin incidencias';
    }
    if (aula.incidencias.some(incidencia => incidencia.estado === 'Pendiente')) {
      return 'Pendiente';
    }
    if (aula.incidencias.some(incidencia => incidencia.estado === 'En atención')) {
      return 'En atención';
    }
    return 'Solucionada';
  }

  claseEstadoAula(estado: string): string {
    const normalizado = this.normalizar(estado);
    if (normalizado === 'en mantenimiento') {
      return 'mantenimiento';
    }
    return normalizado;
  }

  etiquetaEstadoAula(estado: string): string {
    const normalizado = this.claseEstadoAula(estado);
    if (normalizado === 'disponible') {
      return 'Disponible';
    }
    if (normalizado === 'ocupada') {
      return 'Ocupada';
    }
    if (normalizado === 'mantenimiento') {
      return 'Mantenimiento';
    }
    return estado;
  }

  claseEstadoIncidencia(estado: string): string {
    return this.normalizar(estado).replace(/ /g, '-');
  }

  private crearIncidencia(reporte: Reporte, atencion?: Atencion): IncidenciaAula {
    const estado = this.mapearEstadoIncidencia(atencion?.estado ?? reporte.estado);
    const observaciones = atencion?.observaciones?.trim();
    const solucion = estado === 'Solucionada' && observaciones
      ? this.extraerSolucion(observaciones)
      : undefined;

    return {
      reporteId: reporte.id,
      descripcion: reporte.descripcion,
      tipo: this.etiquetaTipoProblema(reporte.tipoProblema),
      fechaReporte: reporte.fechaRegistro,
      estado,
      tecnico: atencion?.tecnicoEncargado || undefined,
      fechaResolucion: atencion?.fechaResolucion || undefined,
      solucion
    };
  }

  private mapearEstadoIncidencia(estado: EstadoAtencion | EstadoReporte): EstadoIncidencia {
    switch (estado) {
      case 'EN_ATENCION':
        return 'En atención';
      case 'RESUELTO':
        return 'Solucionada';
      default:
        return 'Pendiente';
    }
  }

  private etiquetaTipoProblema(tipo: TipoProblema): string {
    switch (tipo) {
      case 'TECNOLOGICO':
        return 'Tecnológico';
      case 'ELECTRICO':
        return 'Eléctrico';
      case 'MOBILIARIO':
        return 'Mobiliario';
      case 'INFRAESTRUCTURA':
        return 'Infraestructura';
      case 'OTRO':
        return 'Otro';
    }
  }

  private extraerSolucion(observaciones: string): string {
    const coincidencia = observaciones.match(/\[Solución:\s*([^\]]+)\]/i);
    return coincidencia?.[1]?.trim() || observaciones;
  }

  private normalizar(valor: string): string {
    return valor
      .trim()
      .toLocaleLowerCase('es')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
}

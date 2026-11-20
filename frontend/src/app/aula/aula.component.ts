import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../services/auth.service';
import { Aula, AulaFormData } from './aula.model';
import { AulaService } from './aula.service';

const NUEVA_AULA: AulaFormData = {
  codigo: '',
  ubicacion: '',
  capacidad: 1,
  estado: 'Disponible'
};

const AULAS_POR_PAGINA = 8;

@Component({
  selector: 'app-aula',
  imports: [FormsModule, MatIconModule],
  templateUrl: './aula.component.html',
  styleUrl: './aula.component.scss'
})
export class AulaComponent implements OnInit {
  private readonly aulaService = inject(AulaService);
  private readonly authService = inject(AuthService);

  readonly aulas = signal<Aula[]>([]);
  readonly busqueda = signal('');
  readonly estadoSeleccionado = signal('');
  readonly capacidadMinima = signal('');
  readonly cargando = signal(false);
  readonly errorCarga = signal('');
  readonly mensaje = signal('');
  readonly formularioVisible = signal(false);
  readonly aulaAEliminar = signal<Aula | null>(null);
  readonly sesion = this.authService.sesion;
  readonly paginaActual = signal(1);
  readonly puedeGestionar = computed(() =>
    this.sesion()?.roles.some(rol => rol === 'ROLE_TECNICO' || rol === 'ROLE_ADMIN') ?? false
  );

  readonly aulasFiltradas = computed(() => {
    const query = this.normalizar(this.busqueda());
    const estado = this.normalizar(this.estadoSeleccionado());
    const capacidad = Number(this.capacidadMinima()) || 0;

    return this.aulas().filter(aula => {
      const coincideTexto =
        !query ||
        this.normalizar(aula.codigo).includes(query) ||
        this.normalizar(aula.ubicacion).includes(query);
      const coincideEstado = !estado || this.normalizar(aula.estado) === estado;
      return coincideTexto && coincideEstado && aula.capacidad >= capacidad;
    });
  });

  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.aulasFiltradas().length / AULAS_POR_PAGINA))
  );
  readonly paginaActualVisible = computed(() =>
    Math.min(this.paginaActual(), this.totalPaginas())
  );
  readonly paginasVisibles = computed(() => {
    const total = this.totalPaginas();
    const cantidad = Math.min(total, 5);
    const inicio = Math.max(
      1,
      Math.min(this.paginaActualVisible() - 2, total - cantidad + 1)
    );
    return Array.from({ length: cantidad }, (_, indice) => inicio + indice);
  });
  readonly aulasPaginadas = computed(() => {
    const inicio = (this.paginaActualVisible() - 1) * AULAS_POR_PAGINA;
    return this.aulasFiltradas().slice(inicio, inicio + AULAS_POR_PAGINA);
  });
  readonly primerResultado = computed(() =>
    this.aulasFiltradas().length === 0
      ? 0
      : (this.paginaActualVisible() - 1) * AULAS_POR_PAGINA + 1
  );
  readonly ultimoResultado = computed(() =>
    Math.min(this.paginaActualVisible() * AULAS_POR_PAGINA, this.aulasFiltradas().length)
  );

  readonly totalAulas = computed(() => this.aulas().length);
  readonly aulasDisponibles = computed(() =>
    this.aulas().filter(aula => this.normalizar(aula.estado) === 'disponible').length
  );
  readonly aulasOcupadas = computed(() =>
    this.aulas().filter(aula => this.normalizar(aula.estado) === 'ocupada').length
  );
  readonly aulasMantenimiento = computed(() =>
    this.aulas().filter(aula => this.esMantenimiento(aula.estado)).length
  );

  datosFormulario: AulaFormData = { ...NUEVA_AULA };
  errorFormulario = '';
  guardando = false;
  aulaEnEdicion: number | null = null;

  ngOnInit(): void {
    void this.cargarAulas();
  }

  async cargarAulas(): Promise<void> {
    this.cargando.set(true);
    this.errorCarga.set('');
    try {
      this.aulas.set(await this.aulaService.listar());
      this.ajustarPagina();
    } catch (error) {
      this.errorCarga.set(
        this.aulaService.mensajeError(error, 'No se pudieron cargar las aulas.')
      );
    } finally {
      this.cargando.set(false);
    }
  }

  restablecerFiltros(): void {
    this.busqueda.set('');
    this.estadoSeleccionado.set('');
    this.capacidadMinima.set('');
    this.paginaActual.set(1);
  }

  cambiarBusqueda(valor: string): void {
    this.busqueda.set(valor);
    this.paginaActual.set(1);
  }

  cambiarEstado(valor: string): void {
    this.estadoSeleccionado.set(valor);
    this.paginaActual.set(1);
  }

  cambiarCapacidadMinima(valor: string): void {
    this.capacidadMinima.set(valor);
    this.paginaActual.set(1);
  }

  irPagina(pagina: number): void {
    this.paginaActual.set(Math.max(1, Math.min(pagina, this.totalPaginas())));
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.formularioVisible.set(false);
    this.aulaEnEdicion = null;
    this.mensaje.set('La sesión se cerró correctamente.');
  }

  abrirAcceso(): void {
    this.authService.abrirPanel();
  }

  nuevaAula(): void {
    this.limpiarFormulario();
    this.formularioVisible.set(true);
  }

  editarAula(aula: Aula): void {
    this.aulaEnEdicion = aula.id;
    this.datosFormulario = {
      codigo: aula.codigo,
      ubicacion: aula.ubicacion,
      capacidad: aula.capacidad,
      estado: this.esMantenimiento(aula.estado) ? 'Mantenimiento' : aula.estado
    };
    this.errorFormulario = '';
    this.formularioVisible.set(true);
  }

  cancelarFormulario(): void {
    this.formularioVisible.set(false);
    this.limpiarFormulario();
  }

  async guardarAula(): Promise<void> {
    this.errorFormulario = '';
    this.guardando = true;
    const datos = {
      ...this.datosFormulario,
      codigo: this.datosFormulario.codigo.trim(),
      ubicacion: this.datosFormulario.ubicacion.trim()
    };

    try {
      if (this.aulaEnEdicion === null) {
        await this.aulaService.registrar(datos);
        this.mensaje.set('El aula se registró correctamente.');
      } else {
        await this.aulaService.actualizar(this.aulaEnEdicion, datos);
        this.mensaje.set('Los datos del aula se actualizaron correctamente.');
      }
      this.cancelarFormulario();
      await this.cargarAulas();
    } catch (error) {
      this.errorFormulario = this.aulaService.mensajeError(
        error,
        'No se pudieron guardar los datos del aula.'
      );
    } finally {
      this.guardando = false;
    }
  }

  confirmarEliminacion(aula: Aula): void {
    this.mensaje.set('');
    this.aulaAEliminar.set(aula);
  }

  async eliminarAula(): Promise<void> {
    const aula = this.aulaAEliminar();
    if (!aula) {
      return;
    }

    try {
      await this.aulaService.eliminar(aula.id);
      this.aulaAEliminar.set(null);
      this.mensaje.set(`El aula ${aula.codigo} se eliminó correctamente.`);
      await this.cargarAulas();
    } catch (error) {
      this.mensaje.set(
        this.aulaService.mensajeError(error, 'No se pudo eliminar el aula.')
      );
      this.aulaAEliminar.set(null);
    }
  }

  etiquetaEstado(estado: string): string {
    if (this.esMantenimiento(estado)) {
      return 'En mantenimiento';
    }
    const normalizado = this.normalizar(estado);
    if (normalizado === 'disponible') {
      return 'Disponible';
    }
    if (normalizado === 'ocupada') {
      return 'Ocupada';
    }
    return estado;
  }

  claveEstado(estado: string): string {
    return this.esMantenimiento(estado) ? 'mantenimiento' : this.normalizar(estado);
  }

  private limpiarFormulario(): void {
    this.datosFormulario = { ...NUEVA_AULA };
    this.aulaEnEdicion = null;
    this.errorFormulario = '';
  }

  private ajustarPagina(): void {
    this.paginaActual.set(Math.min(this.paginaActual(), this.totalPaginas()));
  }

  private esMantenimiento(estado: string): boolean {
    const normalizado = this.normalizar(estado);
    return normalizado === 'mantenimiento' || normalizado === 'en mantenimiento';
  }

  private normalizar(valor: string): string {
    return valor
      .trim()
      .toLocaleLowerCase('es')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
}

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
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
  imports: [FormsModule, MatIconModule, MatSnackBarModule, RouterLink],
  templateUrl: './aula.component.html',
  styleUrl: './aula.component.scss'
})
export class AulaComponent implements OnInit {
  private readonly aulaService = inject(AulaService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  readonly aulas = this.aulaService.aulas;
  readonly busqueda = signal('');
  readonly estadoSeleccionado = signal('');
  readonly capacidadMinima = signal<number | null>(null);
  readonly cargando = signal(false);
  readonly errorCarga = signal('');
  readonly mensaje = signal('');
  readonly tipoMensaje = signal<'exito' | 'error'>('exito');
  private mensajeTimer: ReturnType<typeof setTimeout> | null = null;
  readonly formularioVisible = signal(false);
  readonly aulaAEliminar = signal<Aula | null>(null);
  readonly sesion = this.authService.sesion;
  readonly paginaActual = signal(1);
  readonly puedeGestionar = computed(() =>
    this.sesion()?.roles.some(rol => rol === 'ROLE_TECNICO' || rol === 'ROLE_ADMIN') ?? false
  );
  readonly errorCapacidadMinima = computed(() => {
    const capacidad = this.capacidadMinima();
    if (capacidad === null) {
      return '';
    }

    return Number.isInteger(capacidad) && capacidad >= 0
      ? ''
      : 'La capacidad mínima debe ser un número entero igual o mayor que 0.';
  });

  readonly aulasFiltradas = computed(() => {
    const query = this.normalizar(this.busqueda());
    const estado = this.normalizar(this.estadoSeleccionado());
    const capacidad = this.errorCapacidadMinima()
      ? 0
      : this.capacidadMinima() ?? 0;

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

  formatCount(count: number): string {
    return String(count).padStart(2, '0');
  }

  datosFormulario: AulaFormData = { ...NUEVA_AULA };
  errorFormulario = '';
  guardando = false;
  aulaEnEdicion: number | null = null;

  ngOnInit(): void {
    void this.cargarAulas();
  }

  async cargarAulas(): Promise<void> {
    if (this.aulas().length === 0) {
      this.cargando.set(true);
    }
    this.errorCarga.set('');
    try {
      await this.aulaService.listar();
      this.ajustarPagina();
    } catch (error) {
      if (this.aulas().length === 0) {
        this.errorCarga.set(
          this.aulaService.mensajeError(error, 'No se pudieron cargar las aulas.')
        );
      }
    } finally {
      this.cargando.set(false);
    }
  }

  restablecerFiltros(): void {
    this.busqueda.set('');
    this.estadoSeleccionado.set('');
    this.capacidadMinima.set(null);
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

  cambiarCapacidadMinima(valor: number | null): void {
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
    this.mostrarNotificacion('La sesión se cerró correctamente.', 'exito');
  }

  abrirAcceso(): void {
    this.authService.abrirPanel();
  }

  cerrarMensaje(): void {
    if (this.mensajeTimer) {
      clearTimeout(this.mensajeTimer);
      this.mensajeTimer = null;
    }
    this.mensaje.set('');
  }

  private mostrarNotificacion(texto: string, _tipo: 'exito' | 'error' = 'exito'): void {
    this.snackBar.open(texto, 'Cerrar', {
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom'
    });
  }

  private notificarPermisoRequerido(accion: () => void): void {
    this.snackBar
      .open(
        'Esta operación requiere una cuenta de Soporte Técnico o Administrador.',
        'Cambiar a Técnico',
        { duration: 5000, horizontalPosition: 'end', verticalPosition: 'bottom' }
      )
      .onAction()
      .subscribe(() => {
        this.authService.loginRapido('tecnico').subscribe(() => accion());
      });
  }

  private desplazarAlFormulario(): void {
    if (typeof document === 'undefined') {
      return;
    }
    setTimeout(() => {
      const panel = document.getElementById('panel-formulario-aula');
      panel?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const inputCodigo = document.getElementById('aula-codigo-input') as HTMLInputElement | null;
      inputCodigo?.focus({ preventScroll: true });
    }, 50);
  }

  nuevaAula(): void {
    if (!this.puedeGestionar()) {
      this.notificarPermisoRequerido(() => this.nuevaAula());
      return;
    }
    this.limpiarFormulario();
    this.formularioVisible.set(true);
    this.desplazarAlFormulario();
  }

  editarAula(aula: Aula): void {
    if (!this.puedeGestionar()) {
      this.notificarPermisoRequerido(() => this.editarAula(aula));
      return;
    }
    this.aulaEnEdicion = aula.id;
    this.datosFormulario = {
      codigo: aula.codigo,
      ubicacion: aula.ubicacion,
      capacidad: aula.capacidad,
      estado: this.esMantenimiento(aula.estado) ? 'Mantenimiento' : aula.estado
    };
    this.errorFormulario = '';
    this.formularioVisible.set(true);
    this.desplazarAlFormulario();
  }

  cancelarFormulario(): void {
    this.formularioVisible.set(false);
    this.limpiarFormulario();
  }

  async guardarAula(): Promise<void> {
    if (!this.puedeGestionar()) {
      this.notificarPermisoRequerido(() => void this.guardarAula());
      return;
    }
    this.errorFormulario = '';
    const datos = {
      ...this.datosFormulario,
      codigo: this.datosFormulario.codigo.trim(),
      ubicacion: this.datosFormulario.ubicacion.trim(),
      capacidad: Number(this.datosFormulario.capacidad)
    };
    const errorValidacion = this.validarDatos(datos);
    if (errorValidacion) {
      this.errorFormulario = errorValidacion;
      return;
    }

    this.guardando = true;
    try {
      if (this.aulaEnEdicion === null) {
        await this.aulaService.registrar(datos);
        this.mostrarNotificacion(`Aula ${datos.codigo} registrada exitosamente`, 'exito');
      } else {
        await this.aulaService.actualizar(this.aulaEnEdicion, datos);
        this.mostrarNotificacion(`Datos del aula ${datos.codigo} actualizados correctamente`, 'exito');
      }
      this.cancelarFormulario();
      await this.cargarAulas();
    } catch (error) {
      const msg = this.aulaService.mensajeError(
        error,
        'No se pudieron guardar los datos del aula.'
      );
      this.errorFormulario = msg;
      this.mostrarNotificacion(msg, 'error');
    } finally {
      this.guardando = false;
    }
  }

  confirmarEliminacion(aula: Aula): void {
    if (!this.puedeGestionar()) {
      this.notificarPermisoRequerido(() => this.confirmarEliminacion(aula));
      return;
    }
    this.cerrarMensaje();
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
      this.mostrarNotificacion(`El aula ${aula.codigo} se eliminó correctamente.`, 'exito');
      await this.cargarAulas();
    } catch (error) {
      this.mostrarNotificacion(
        this.aulaService.mensajeError(error, 'No se pudo eliminar el aula.'),
        'error'
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

  private validarDatos(datos: AulaFormData): string | null {
    if (!datos.codigo) {
      return 'Ingrese el código del aula; no puede contener solo espacios.';
    }
    if (datos.codigo.length > 30) {
      return 'El código del aula no puede superar 30 caracteres.';
    }
    if (!datos.ubicacion) {
      return 'Ingrese la ubicación del aula; no puede contener solo espacios.';
    }
    if (datos.ubicacion.length > 120) {
      return 'La ubicación no puede superar 120 caracteres.';
    }

    const capacidad = Number(datos.capacidad);
    if (!Number.isInteger(capacidad) || capacidad < 1 || capacidad > 200) {
      return 'La capacidad debe ser un número entero entre 1 y 200.';
    }

    const estado = this.normalizar(datos.estado);
    if (!['disponible', 'ocupada', 'mantenimiento'].includes(estado)) {
      return 'Seleccione un estado válido: Disponible, Ocupada o Mantenimiento.';
    }
    return null;
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

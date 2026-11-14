
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Aula, AulaFormData } from './aula.model';
import { AulaService } from './aula.service';

const NUEVA_AULA: AulaFormData = {
  codigo: '',
  ubicacion: '',
  capacidad: 1,
  estado: 'Disponible'
};

@Component({
  selector: 'app-aula',
  imports: [FormsModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './aula.component.html',
  styleUrl: './aula.component.scss'
})
export class AulaComponent implements OnInit {
  private readonly aulaService = inject(AulaService);

  readonly aulas = signal<Aula[]>([]);
  readonly busqueda = signal('');
  readonly estadoSeleccionado = signal('');
  readonly capacidadMinima = signal('');
  readonly cargando = signal(false);
  readonly errorCarga = signal('');
  readonly mensaje = signal('');
  readonly loginVisible = signal(false);
  readonly formularioVisible = signal(false);
  readonly aulaAEliminar = signal<Aula | null>(null);

  readonly sesion = this.aulaService.session;

  readonly puedeGestionar = computed(() =>
    this.sesion()?.roles.some(
      rol => rol === 'ROLE_TECNICO' || rol === 'ROLE_ADMIN'
    ) ?? false
  );

  // Formulario reactivo para registrar y editar aulas.
  readonly aulaForm = new FormGroup({
    codigo: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(30),
        Validators.pattern(/\S/)
      ]
    }),
    ubicacion: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(120),
        Validators.pattern(/\S/)
      ]
    }),
    capacidad: new FormControl(1, {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.min(1),
        Validators.max(200)
      ]
    }),
    estado: new FormControl('Disponible', {
      nonNullable: true,
      validators: [Validators.required]
    })
  });

  readonly aulasFiltradas = computed(() => {
    const query = this.normalizar(this.busqueda());
    const estado = this.normalizar(this.estadoSeleccionado());
    const capacidad = Number(this.capacidadMinima()) || 0;

    return this.aulas().filter(aula => {
      const coincideTexto =
        !query ||
        this.normalizar(aula.codigo).includes(query) ||
        this.normalizar(aula.ubicacion).includes(query);

      const coincideEstado =
        !estado || this.normalizar(aula.estado) === estado;

      return coincideTexto && coincideEstado && aula.capacidad >= capacidad;
    });
  });

  readonly totalAulas = computed(() => this.aulas().length);

  readonly aulasDisponibles = computed(() =>
    this.aulas().filter(
      aula => this.normalizar(aula.estado) === 'disponible'
    ).length
  );

  readonly aulasOcupadas = computed(() =>
    this.aulas().filter(
      aula => this.normalizar(aula.estado) === 'ocupada'
    ).length
  );

  readonly aulasMantenimiento = computed(() =>
    this.aulas().filter(aula => this.esMantenimiento(aula.estado)).length
  );

  usuario = '';
  contrasena = '';
  errorLogin = '';
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
  }

  abrirAcceso(): void {
    this.usuario = '';
    this.contrasena = '';
    this.errorLogin = '';
    this.loginVisible.set(true);
  }

  cerrarAcceso(): void {
    this.loginVisible.set(false);
  }

  async iniciarSesion(): Promise<void> {
    this.errorLogin = '';

    try {
      const sesion = await this.aulaService.iniciarSesion(
        this.usuario.trim(),
        this.contrasena
      );

      if (
        sesion.roles.some(
          rol => rol === 'ROLE_TECNICO' || rol === 'ROLE_ADMIN'
        )
      ) {
        this.loginVisible.set(false);
        this.mensaje.set(
          `Bienvenido, ${sesion.username}. Ya puede gestionar las aulas.`
        );
      } else {
        this.errorLogin =
          'Su cuenta inició sesión, pero no tiene permisos para gestionar aulas.';
      }
    } catch (error) {
      this.errorLogin = this.aulaService.mensajeError(
        error,
        'No se pudo iniciar sesión.'
      );
    }
  }

  cerrarSesion(): void {
    this.aulaService.cerrarSesion();
    this.formularioVisible.set(false);
    this.limpiarFormulario();
    this.mensaje.set('La sesión se cerró correctamente.');
  }

  nuevaAula(): void {
    this.limpiarFormulario();
    this.formularioVisible.set(true);
  }

  editarAula(aula: Aula): void {
    this.aulaEnEdicion = aula.id;

    this.aulaForm.setValue({
      codigo: aula.codigo,
      ubicacion: aula.ubicacion,
      capacidad: aula.capacidad,
      estado: this.esMantenimiento(aula.estado)
        ? 'Mantenimiento'
        : aula.estado
    });

    this.aulaForm.markAsPristine();
    this.aulaForm.markAsUntouched();

    this.errorFormulario = '';
    this.formularioVisible.set(true);
  }

  cancelarFormulario(): void {
    this.formularioVisible.set(false);
    this.limpiarFormulario();
  }

  async guardarAula(): Promise<void> {
    this.errorFormulario = '';

    if (this.aulaForm.invalid) {
      this.aulaForm.markAllAsTouched();
      return;
    }

    this.guardando = true;

    const valores = this.aulaForm.getRawValue();

    const datos: AulaFormData = {
      ...valores,
      codigo: valores.codigo.trim(),
      ubicacion: valores.ubicacion.trim()
    };

    try {
      if (this.aulaEnEdicion === null) {
        await this.aulaService.registrar(datos);
        this.mensaje.set('El aula se registró correctamente.');
      } else {
        await this.aulaService.actualizar(this.aulaEnEdicion, datos);
        this.mensaje.set(
          'Los datos del aula se actualizaron correctamente.'
        );
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
      this.mensaje.set(
        `El aula ${aula.codigo} se eliminó correctamente.`
      );
      await this.cargarAulas();
    } catch (error) {
      this.mensaje.set(
        this.aulaService.mensajeError(
          error,
          'No se pudo eliminar el aula.'
        )
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
    return this.esMantenimiento(estado)
      ? 'mantenimiento'
      : this.normalizar(estado);
  }

  private limpiarFormulario(): void {
    this.aulaForm.reset(NUEVA_AULA);
    this.aulaEnEdicion = null;
    this.errorFormulario = '';
  }

  private esMantenimiento(estado: string): boolean {
    const normalizado = this.normalizar(estado);

    return (
      normalizado === 'mantenimiento' ||
      normalizado === 'en mantenimiento'
    );
  }

  private normalizar(valor: string): string {
    return valor
      .trim()
      .toLocaleLowerCase('es')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
}

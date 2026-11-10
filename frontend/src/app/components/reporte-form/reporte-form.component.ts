import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { AulaDisponible, Prioridad, TipoProblema } from '../../models/reporte.model';
import { ReporteService } from '../../services/reporte.service';

/**
 * Validador Nivel 1: Exige formato real de código de aula universitaria:
 * Prefijo de Pabellón (A, B, C, D, E) o LAB seguido de guion, piso (1-9) y número de 2 dígitos (ej. A-101, LAB-302).
 */
function codigoAulaCampusValidator(): ValidatorFn {
  const regex = /^(?:[A-Ea-e]|LAB|lab)-[1-9]\d{2}$/;
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = (control.value ?? '').trim();
    if (!raw) {
      return null; // Lo maneja Validators.required
    }
    return regex.test(raw) ? null : { formatoAulaCampus: true };
  };
}

/**
 * Validador Nivel 1: Evita bypass por espacios en blanco y exige al menos
 * 10 caracteres reales, mínimo 2 palabras con letras y sin caracteres repetidos sin sentido.
 */
function diagnosticoRealValidator(): ValidatorFn {
  const minDosPalabrasConLetras = /[A-Za-zÁÉÍÓÚáéíóúÑñ]{2,}\s+[A-Za-zÁÉÍÓÚáéíóúÑñ]{2,}/;
  const caracteresRepetidos = /(.)\1{5,}/;

  return (control: AbstractControl): ValidationErrors | null => {
    const raw = (control.value ?? '');
    const trimmed = raw.trim();

    if (!raw) {
      return null; // Lo maneja Validators.required
    }
    if (trimmed.length === 0) {
      return { soloEspacios: true };
    }
    if (trimmed.length < 10) {
      return { minlengthReal: { requiredLength: 10, actualLength: trimmed.length } };
    }
    if (!minDosPalabrasConLetras.test(trimmed) || caracteresRepetidos.test(trimmed)) {
      return { diagnosticoIncoherente: true };
    }
    return null;
  };
}

@Component({
  selector: 'app-reporte-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './reporte-form.component.html',
  styleUrl: './reporte-form.component.scss'
})
export class ReporteFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly reporteService = inject(ReporteService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  // Corrección #4: Aulas sugeridas sincronizadas con GET /api/aulas desde ReporteService
  readonly aulasSugeridas = this.reporteService.aulasSugeridas;

  readonly categorias: { valor: TipoProblema; label: string; icono: string }[] = [
    { valor: 'TECNOLOGICO', label: 'Tecnológico', icono: 'videocam_off' },
    { valor: 'ELECTRICO', label: 'Eléctrico', icono: 'bolt' },
    { valor: 'MOBILIARIO', label: 'Mobiliario', icono: 'chair' },
    { valor: 'INFRAESTRUCTURA', label: 'Infraestructura', icono: 'ac_unit' },
    { valor: 'OTRO', label: 'Otro', icono: 'build' }
  ];

  readonly prioridades: { valor: Prioridad; label: string; impacto: string }[] = [
    { valor: 'ALTA', label: 'Prioridad Alta', impacto: 'Inhabilita uso en clase' },
    { valor: 'MEDIA', label: 'Prioridad Media', impacto: 'Aula operativa con obs.' },
    { valor: 'BAJA', label: 'Prioridad Baja', impacto: 'Mantenimiento preventivo' }
  ];

  // Formulario Reactivo con Validaciones Nivel 1 y Nivel 2
  readonly reporteForm = this.fb.nonNullable.group(
    {
      aulaId: [
        '',
        [
          Validators.required,
          Validators.maxLength(12),
          codigoAulaCampusValidator()
        ]
      ],
      aulaUbicacion: [
        'Se asigna automáticamente según el código de aula',
        [Validators.required]
      ],
      tipoProblema: ['TECNOLOGICO' as TipoProblema, [Validators.required]],
      prioridad: ['ALTA' as Prioridad, [Validators.required]],
      descripcion: [
        '',
        [
          Validators.required,
          Validators.maxLength(255),
          diagnosticoRealValidator()
        ]
      ]
    },
    {
      validators: [this.reporteDuplicadoValidator()]
    }
  );

  constructor() {
    this.reporteService.cargarAulasSugeridas();

    // Nivel 2: Autocompletado automático de Pabellón y Piso según el código del aula
    this.f.aulaId.valueChanges.subscribe(valor => {
      const ubicacionCalculada = this.deducirUbicacionDesdeCodigo(valor);
      this.f.aulaUbicacion.setValue(ubicacionCalculada, { emitEvent: false });
    });
  }

  get f() {
    return this.reporteForm.controls;
  }

  /**
   * Validador Nivel 2 (a nivel de FormGroup):
   * Impide registrar un reporte si ya existe uno PENDIENTE o EN_ATENCION
   * para la misma aula y la misma categoría técnica.
   */
  private reporteDuplicadoValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const aulaId = group.get('aulaId')?.value ?? '';
      const tipo = group.get('tipoProblema')?.value as TipoProblema;
      if (!aulaId || !tipo) {
        return null;
      }

      const duplicado = this.reporteService.buscarDuplicadoActivo(aulaId, tipo);
      if (duplicado) {
        return {
          reporteDuplicado: {
            id: duplicado.id,
            aulaId: duplicado.aulaId,
            estado: duplicado.estado
          }
        };
      }
      return null;
    };
  }

  /**
   * Deduce automáticamente el Pabellón y Piso a partir del código (ej. B-204 -> Pabellón B • Piso 2)
   * o toma la ubicación oficial registrada en GET /api/aulas si coincide.
   */
  deducirUbicacionDesdeCodigo(codigoRaw: string): string {
    const limpio = codigoRaw.trim().toUpperCase();
    const aulaRegistrada = this.aulasSugeridas().find(a => a.codigo.toUpperCase() === limpio);
    if (aulaRegistrada?.ubicacion) {
      return aulaRegistrada.ubicacion;
    }

    const match = limpio.match(/^([A-E]|LAB)-([1-9])\d{2}$/);
    if (!match) {
      return 'Ingresa un código válido (ej. A-101, LAB-302)';
    }
    const prefijo = match[1];
    const piso = match[2];
    const pabellon = prefijo === 'LAB' ? 'Pabellón C (Laboratorios)' : `Pabellón ${prefijo}`;
    return `${pabellon} • Piso ${piso}`;
  }

  seleccionarAulaRapida(aula: AulaDisponible): void {
    this.f.aulaId.setValue(aula.codigo);
    this.f.aulaId.markAsDirty();
    this.f.aulaId.markAsTouched();
  }

  seleccionarCategoria(tipo: TipoProblema): void {
    this.f.tipoProblema.setValue(tipo);
    this.f.tipoProblema.markAsDirty();
  }

  seleccionarPrioridad(prioridad: Prioridad): void {
    this.f.prioridad.setValue(prioridad);
    this.f.prioridad.markAsDirty();
  }

  limpiarFormulario(): void {
    this.reporteForm.reset({
      aulaId: '',
      aulaUbicacion: 'Ingresa un código válido (ej. A-101, LAB-302)',
      tipoProblema: 'TECNOLOGICO',
      prioridad: 'ALTA',
      descripcion: ''
    });
  }

  onSubmit(): void {
    if (this.reporteForm.invalid) {
      this.reporteForm.markAllAsTouched();
      return;
    }

    // Corrección #2: Suscripción real al POST /api/reportes con manejo de errores 404/400 de GlobalExceptionHandler
    this.reporteService.crearReporte(this.reporteForm.getRawValue()).subscribe({
      next: creado => {
        const numOrden = String(creado.id).padStart(2, '0');
        this.snackBar
          .open(
            `Reporte #${numOrden} (${creado.aulaId}) registrado exitosamente`,
            'Ver detalle',
            { duration: 4000, horizontalPosition: 'end', verticalPosition: 'bottom' }
          )
          .onAction()
          .subscribe(() => {
            this.router.navigate(['/reportes', creado.id]);
          });

        this.router.navigate(['/reportes']);
      },
      error: (err: HttpErrorResponse) => {
        const mensajeBackend =
          err?.error?.message ||
          `No se pudo registrar el reporte (${err.status}): Verifica que el aula exista en el sistema.`;
        this.snackBar.open(mensajeBackend, 'Cerrar', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'bottom'
        });
      }
    });
  }

  getCaracteresReales(): number {
    return this.f.descripcion.value.trim().length;
  }

  formatCount(count: number): string {
    return String(count).padStart(2, '0');
  }

  getCategoriaActual() {
    const actual = this.f.tipoProblema.value;
    return this.categorias.find(c => c.valor === actual) ?? this.categorias[0];
  }

  getPrioridadActual() {
    const actual = this.f.prioridad.value;
    return this.prioridades.find(p => p.valor === actual) ?? this.prioridades[0];
  }
}

import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Prioridad, TipoProblema } from '../../models/reporte.model';
import { ReporteService } from '../../services/reporte.service';

interface AulaSugerida {
  codigo: string;
  ubicacion: string;
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

  readonly aulasSugeridas: AulaSugerida[] = [
    { codigo: 'A-101', ubicacion: 'Pabellón A • Piso 1' },
    { codigo: 'LAB-302', ubicacion: 'Pabellón C • Piso 3' },
    { codigo: 'B-204', ubicacion: 'Pabellón B • Piso 2' },
    { codigo: 'A-305', ubicacion: 'Pabellón A • Piso 3' },
    { codigo: 'D-401', ubicacion: 'Pabellón D • Piso 4' }
  ];

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

  // Formulario Reactivo tipado y con validaciones en tiempo real (Semana 13)
  readonly reporteForm = this.fb.nonNullable.group({
    aulaId: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(12),
        Validators.pattern(/^[A-Za-z0-9-]+$/)
      ]
    ],
    aulaUbicacion: [
      'Pabellón A • Piso 1',
      [Validators.required, Validators.minLength(5), Validators.maxLength(60)]
    ],
    tipoProblema: ['TECNOLOGICO' as TipoProblema, [Validators.required]],
    prioridad: ['ALTA' as Prioridad, [Validators.required]],
    descripcion: [
      '',
      [Validators.required, Validators.minLength(10), Validators.maxLength(255)]
    ]
  });

  get f() {
    return this.reporteForm.controls;
  }

  seleccionarAulaRapida(aula: AulaSugerida): void {
    this.reporteForm.patchValue({
      aulaId: aula.codigo,
      aulaUbicacion: aula.ubicacion
    });
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
      aulaUbicacion: 'Pabellón A • Piso 1',
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

    const creado = this.reporteService.crearReporte(this.reporteForm.getRawValue());
    const numOrden = String(creado.id).padStart(2, '0');

    this.snackBar.open(
      `Expediente #${numOrden} (${creado.aulaId}) registrado exitosamente`,
      'Ver detalle',
      { duration: 4000, horizontalPosition: 'end', verticalPosition: 'bottom' }
    ).onAction().subscribe(() => {
      this.router.navigate(['/reportes', creado.id]);
    });

    this.router.navigate(['/reportes']);
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

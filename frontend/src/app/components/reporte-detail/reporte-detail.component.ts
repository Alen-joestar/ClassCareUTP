import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EstadoReporte, Prioridad, TipoProblema } from '../../models/reporte.model';
import { AtencionService } from '../../services/atencion.service';
import { AuthService } from '../../services/auth.service';
import { ReporteService } from '../../services/reporte.service';

@Component({
  selector: 'app-reporte-detail',
  imports: [
    DatePipe,
    RouterLink,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './reporte-detail.component.html',
  styleUrl: './reporte-detail.component.scss'
})
export class ReporteDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly reporteService = inject(ReporteService);
  private readonly atencionService = inject(AtencionService);
  protected readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  readonly reporteId = signal<number | null>(null);
  readonly confirmandoEliminacion = signal<boolean>(false);

  // Reporte reactivo calculado a partir del parámetro de ruta :id y del servicio
  readonly reporte = computed(() => {
    const id = this.reporteId();
    if (id === null || Number.isNaN(id)) {
      return undefined;
    }
    return this.reporteService.obtenerPorId(id);
  });

  // Orden de atención técnica vinculada a este reporte (en caso de haber sido asignada en Atenciones)
  readonly atencionVinculada = computed(() => {
    const id = this.reporteId();
    if (id === null || Number.isNaN(id)) {
      return undefined;
    }
    return this.atencionService.atenciones().find(a => a.reporteId === id);
  });

  imprimirActaReporte(): void {
    if (typeof window !== 'undefined') {
      const tituloOriginal = document.title;
      document.title = ' ';
      window.print();
      document.title = tituloOriginal;
    }
  }

  getEstadoFormalActa(estado: EstadoReporte): string {
    switch (estado) {
      case 'PENDIENTE':
        return 'Pendiente de Intervención Técnica';
      case 'EN_ATENCION':
        return 'En Intervención Técnica en Sitio';
      case 'RESUELTO':
        return 'Resuelto y Certificado (Ambiente Operativo)';
    }
  }

  obtenerSolicitanteFormal(autor?: string): string {
    const limpio = (autor || '').trim();
    if (!limpio || limpio.toLowerCase() === 'alumno') {
      return 'Docente de Turno — Comunidad Académica UTP';
    }
    if (
      limpio.toLowerCase().includes('admin') ||
      limpio.toLowerCase() === 'administrador'
    ) {
      return 'Ing. Ricardo Salazar Vega (Coordinación de Infraestructura)';
    }
    if (
      limpio.toLowerCase() === 'tecnico' ||
      limpio.toLowerCase() === 'tecnico01' ||
      limpio.toLowerCase() === 'soporte técnico utp'
    ) {
      return 'Ing. Carlos Mendoza (Especialista de Soporte Técnico)';
    }
    return limpio;
  }

  obtenerEspecialistaFormal(tecnico?: string): string {
    const limpio = (tecnico || '').trim();
    if (!limpio) {
      return 'Por asignar en Unidad de Mantenimiento';
    }
    if (
      limpio.toLowerCase().includes('admin') ||
      limpio.toLowerCase() === 'administrador'
    ) {
      return 'Ing. Ricardo Salazar Vega';
    }
    if (
      limpio.toLowerCase() === 'tecnico' ||
      limpio.toLowerCase() === 'tecnico01' ||
      limpio.toLowerCase() === 'soporte técnico utp'
    ) {
      return 'Ing. Carlos Mendoza';
    }
    if (limpio.toLowerCase() === 'tecnico02') {
      return 'Ing. Ana Torres';
    }
    if (limpio.toLowerCase() === 'soporte_redes') {
      return 'Ing. Elena Gómez';
    }
    return limpio;
  }

  constructor() {
    this.route.paramMap.subscribe(params => {
      const rawId = params.get('id');
      const numericId = rawId ? Number(rawId) : null;
      this.reporteId.set(numericId);
      this.confirmandoEliminacion.set(false);

      if (numericId !== null && !Number.isNaN(numericId)) {
        this.reporteService.sincronizarPorId(numericId).subscribe();
      }
    });
  }

  formatCount(count: number): string {
    return String(count).padStart(2, '0');
  }

  irAEditarReporte(): void {
    const actual = this.reporte();
    if (!actual) {
      return;
    }

    if (actual.estado === 'RESUELTO') {
      this.snackBar.open(
        `El Reporte #${this.formatCount(actual.id)} ya está resuelto y cerrado; no admite ediciones.`,
        'Cerrar',
        { duration: 4000, horizontalPosition: 'end', verticalPosition: 'bottom' }
      );
      return;
    }

    if (!this.authService.puedeActualizarReportes()) {
      this.snackBar
        .open(
          'Inicia sesión como Especialista Técnico o Administrador para editar este expediente.',
          'Iniciar sesión',
          { duration: 5000, horizontalPosition: 'end', verticalPosition: 'bottom' }
        )
        .onAction()
        .subscribe(() => {
          this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
        });
      return;
    }

    this.router.navigate(['/reportes', actual.id, 'editar']);
  }

  solicitarEliminacion(): void {
    if (!this.authService.puedeEliminarReportes()) {
      this.snackBar
        .open(
          'Solo un Administrador de Infraestructura puede eliminar expedientes del sistema.',
          'Iniciar sesión',
          { duration: 5000, horizontalPosition: 'end', verticalPosition: 'bottom' }
        )
        .onAction()
        .subscribe(() => {
          this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
        });
      return;
    }
    this.confirmandoEliminacion.set(true);
  }

  cancelarEliminacion(): void {
    this.confirmandoEliminacion.set(false);
  }

  confirmarEliminacion(): void {
    const actual = this.reporte();
    if (!actual) {
      return;
    }

    this.reporteService.eliminarReporte(actual.id).subscribe({
      next: () => {
        this.snackBar.open(
          `Reporte #${this.formatCount(actual.id)} (${actual.aulaId}) eliminado permanentemente`,
          'Cerrar',
          { duration: 4000, horizontalPosition: 'end', verticalPosition: 'bottom' }
        );
        this.router.navigate(['/reportes']);
      },
      error: (err: HttpErrorResponse) => {
        const msg =
          err?.error?.message ||
          'No se pudo eliminar el reporte. Verifica tus permisos de administrador.';
        this.snackBar.open(msg, 'Cerrar', {
          duration: 4500,
          horizontalPosition: 'end',
          verticalPosition: 'bottom'
        });
      }
    });
  }

  cambiarEstado(nuevoEstado: EstadoReporte): void {
    const actual = this.reporte();
    if (!actual || actual.estado === nuevoEstado) {
      return;
    }

    if (!this.authService.puedeActualizarReportes()) {
      this.snackBar
        .open(
          'Se requiere una cuenta de Soporte Técnico o Administrador para actualizar el estado del reporte.',
          'Iniciar sesión',
          { duration: 5000, horizontalPosition: 'end', verticalPosition: 'bottom' }
        )
        .onAction()
        .subscribe(() => {
          this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
        });
      return;
    }

    // Máquina de estados progresiva realista (PENDIENTE -> EN_ATENCION -> RESUELTO)
    if (actual.estado === 'RESUELTO') {
      this.snackBar.open(
        `El Reporte #${this.formatCount(actual.id)} ya fue resuelto y cerrado; no puede retroceder a etapas anteriores.`,
        'Cerrar',
        { duration: 4000, horizontalPosition: 'end', verticalPosition: 'bottom' }
      );
      return;
    }

    if (actual.estado === 'EN_ATENCION' && nuevoEstado === 'PENDIENTE') {
      this.snackBar.open(
        'El soporte técnico ya está interviniendo el aula (Etapa 2); el siguiente paso es resolver y liberar el aula (Etapa 3).',
        'Cerrar',
        { duration: 4000, horizontalPosition: 'end', verticalPosition: 'bottom' }
      );
      return;
    }

    if (actual.estado === 'PENDIENTE' && nuevoEstado === 'RESUELTO') {
      this.snackBar
        .open(
          'Flujo progresivo: Primero debes iniciar la Etapa 2 (En Intervención Técnica) antes de cerrar el reporte.',
          'Iniciar Etapa 2',
          { duration: 5000, horizontalPosition: 'end', verticalPosition: 'bottom' }
        )
        .onAction()
        .subscribe(() => {
          this.cambiarEstado('EN_ATENCION');
        });
      return;
    }

    this.reporteService.actualizarEstado(actual.id, nuevoEstado).subscribe({
      next: () => {
        this.snackBar.open(
          `Reporte #${this.formatCount(actual.id)} (${actual.aulaId}) actualizado a ${this.getEstadoLabel(nuevoEstado)}`,
          'Cerrar',
          { duration: 3500, horizontalPosition: 'end', verticalPosition: 'bottom' }
        );
      },
      error: (err: HttpErrorResponse) => {
        const serverMsg = err?.error?.message;
        if (err.status === 404) {
          this.snackBar.open(
            serverMsg || `El reporte #${actual.id} no existe en la base de datos del servidor (404).`,
            'Cerrar',
            { duration: 4500, horizontalPosition: 'end', verticalPosition: 'bottom' }
          );
          return;
        }
        if (err.status === 400) {
          this.snackBar.open(
            serverMsg || 'Solicitud inválida al intentar actualizar el reporte (400).',
            'Cerrar',
            { duration: 4500, horizontalPosition: 'end', verticalPosition: 'bottom' }
          );
          return;
        }
        this.snackBar.open(
          serverMsg || 'Error de autorización JWT (401/403) al intentar actualizar el reporte en el servidor.',
          'Cerrar',
          { duration: 4500, horizontalPosition: 'end', verticalPosition: 'bottom' }
        );
      }
    });
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

  getCategoriaLabel(tipo: TipoProblema): string {
    switch (tipo) {
      case 'TECNOLOGICO': return 'Tecnológico';
      case 'ELECTRICO': return 'Eléctrico';
      case 'MOBILIARIO': return 'Mobiliario';
      case 'INFRAESTRUCTURA': return 'Infraestructura';
      case 'OTRO': return 'Otro';
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
}

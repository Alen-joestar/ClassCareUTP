import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EstadoReporte, Prioridad, TipoProblema } from '../../models/reporte.model';
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

  solicitarEliminacion(): void {
    if (!this.authService.puedeEliminarReportes()) {
      this.snackBar
        .open(
          'Acceso restringido (403): Solo el rol ADMIN con JWT puede eliminar reportes del sistema.',
          'Entrar como Admin',
          { duration: 5000, horizontalPosition: 'end', verticalPosition: 'bottom' }
        )
        .onAction()
        .subscribe(() => {
          this.authService.loginRapido('admin').subscribe(() => {
            this.confirmandoEliminacion.set(true);
          });
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
          `Reporte #${this.formatCount(actual.id)} (${actual.aulaId}) eliminado permanentemente [JWT Admin]`,
          'Cerrar',
          { duration: 4000, horizontalPosition: 'end', verticalPosition: 'bottom' }
        );
        this.router.navigate(['/reportes']);
      },
      error: (err: HttpErrorResponse) => {
        const msg =
          err?.error?.message ||
          `No se pudo eliminar el reporte (${err.status}): Requiere privilegios ADMIN.`;
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

    // Validación RBAC + JWT coherente con SecurityConfig.java (PUT /api/reportes/** requiere TECNICO o ADMIN)
    if (!this.authService.puedeActualizarReportes()) {
      this.snackBar
        .open(
          'Acceso denegado (401/403): Se requiere sesión JWT con rol TECNICO o ADMIN para actualizar estados.',
          'Entrar como Técnico',
          { duration: 5000, horizontalPosition: 'end', verticalPosition: 'bottom' }
        )
        .onAction()
        .subscribe(() => {
          this.authService.loginRapido('tecnico').subscribe(() => {
            this.cambiarEstado(nuevoEstado);
          });
        });
      return;
    }

    this.reporteService.actualizarEstado(actual.id, nuevoEstado).subscribe({
      next: () => {
        this.snackBar.open(
          `Reporte #${this.formatCount(actual.id)} (${actual.aulaId}) actualizado a ${this.getEstadoLabel(nuevoEstado)} [JWT Bearer]`,
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

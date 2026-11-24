import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Atencion, EstadoAtencion, ReportePendienteAsignacion, TipoMantenimiento } from '../../models/atencion.model';
import { AtencionService } from '../../services/atencion.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-atencion-list',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    MatIconModule,
    MatSnackBarModule,
    RouterLink
  ],
  templateUrl: './atencion-list.component.html',
  styleUrl: './atencion-list.component.scss'
})
export class AtencionListComponent {
  readonly atencionService = inject(AtencionService);
  readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  constructor() {
    this.route.queryParamMap.subscribe(params => {
      const reporteIdParam = params.get('reporte');
      if (reporteIdParam) {
        this.searchQuery.set(reporteIdParam.trim());
      }
    });
  }

  // Estado reactivo de filtros con Signals
  readonly searchQuery = signal<string>('');
  readonly selectedEstado = signal<string>('');
  readonly selectedTecnico = signal<string>('');
  readonly mostrarMenuTecnico = signal<boolean>(false);

  // Notificaciones y retroalimentación para el usuario
  readonly mensajeExito = signal<string | null>(null);
  readonly mensajeAlerta = signal<string | null>(null);

  // Modal de Resolución Técnica (Semana 13)
  readonly mostrarModalResolucion = signal<boolean>(false);
  readonly atencionSeleccionada = signal<Atencion | null>(null);
  readonly resolucionObservaciones = signal<string>('');
  readonly resolucionTipoSolucion = signal<string>('Reemplazo de componente');
  readonly resolucionRepuesto = signal<string>('');
  readonly resolucionConfirmacion = signal<boolean>(false);
  readonly errorResolucion = signal<string | null>(null);

  // Modal de Nueva Orden de Atención Técnica (Semana 13)
  readonly mostrarModalNueva = signal<boolean>(false);
  readonly nuevoReporteId = signal<number | null>(null);
  readonly nuevoAulaCodigo = signal<string>('A-101');
  readonly nuevoTecnico = signal<string>('tecnico01');
  readonly nuevoTipoMantenimiento = signal<TipoMantenimiento>('CORRECTIVO');
  readonly nuevaPrioridad = signal<'ALTA' | 'MEDIA' | 'BAJA'>('MEDIA');
  readonly nuevasObservaciones = signal<string>('');
  readonly errorNueva = signal<string | null>(null);

  // Atenciones obtenidas reactivamente desde el servicio (Semana 14)
  readonly atenciones = this.atencionService.atenciones;
  readonly reportesPendientes = this.atencionService.reportesPendientes;
  readonly cargando = this.atencionService.cargando;

  // Usuario técnico en sesión actual (obtenido dinámicamente desde AuthService / JWT)
  readonly tecnicoLogueado = computed(() => {
    const sesion = this.authService.sesion();
    if (!sesion) return 'tecnico01';
    return sesion.nombreCompleto || sesion.username;
  });

  // Opciones de técnicos para el modal de Derivar / Nueva Atención (combina BD + técnicos base)
  readonly opcionesTecnicosModal = computed(() => {
    const registrados = this.authService.tecnicosRegistrados();
    const mapa = new Map<string, string>();

    for (const t of registrados) {
      const clave = t.nombreCompleto || t.username;
      const etiqueta = `${t.nombreCompleto} (@${t.username} • ${t.especialidad || 'Soporte Técnico'})`;
      mapa.set(clave, etiqueta);
    }

    for (const a of this.atenciones()) {
      if (a.tecnicoEncargado && !mapa.has(a.tecnicoEncargado)) {
        mapa.set(a.tecnicoEncargado, `${a.tecnicoEncargado} (Especialista en Turno)`);
      }
    }

    return Array.from(mapa.entries()).map(([valor, etiqueta]) => ({ valor, etiqueta }));
  });

  // Permisos según rol RBAC (ROLE_TECNICO o ROLE_ADMIN)
  readonly puedeGestionar = computed(() => {
    return this.authService.puedeActualizarReportes();
  });

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

  // Lista de técnicos disponibles con carga activa (incluye técnicos registrados en BD)
  readonly tecnicosDisponibles = computed(() => {
    const map = new Map<string, number>();
    for (const t of this.authService.tecnicosRegistrados()) {
      const nombre = t.nombreCompleto || t.username;
      if (!map.has(nombre)) {
        map.set(nombre, 0);
      }
    }
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
    this.selectedTecnico.set(tecnico);
    this.mostrarMenuTecnico.set(false);
  }

  toggleMenuTecnico(): void {
    this.mostrarMenuTecnico.update(v => !v);
  }

  cerrarMenuTecnico(): void {
    this.mostrarMenuTecnico.set(false);
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.selectedEstado.set('');
    this.selectedTecnico.set('');
    this.mostrarMenuTecnico.set(false);
  }

  // --- Acciones de Cambio de Estado (Semana 13 y 14) ---

  iniciarAtencion(atencion: Atencion): void {
    if (!this.puedeGestionar()) {
      this.mostrarAlerta('Acceso denegado: debes autenticarte como personal técnico o administrador en la barra superior.');
      return;
    }

    const usuario = this.tecnicoLogueado();
    this.atencionService.iniciarAtencion(atencion.id, usuario).subscribe({
      next: () => {
        this.mostrarExito(`Orden #${atencion.id} iniciada con éxito. El caso pasó a estado EN ATENCIÓN.`);
      },
      error: (err) => {
        this.mostrarAlerta(`Error al iniciar atención: ${err.message || 'Verifica los permisos en el servidor.'}`);
      }
    });
  }

  abrirModalResolucion(atencion: Atencion): void {
    if (!this.puedeGestionar()) {
      this.mostrarAlerta('Acceso denegado: solo el personal técnico autorizado puede registrar resoluciones.');
      return;
    }

    this.atencionSeleccionada.set(atencion);
    this.resolucionObservaciones.set('');
    this.resolucionTipoSolucion.set('Reemplazo de componente');
    this.resolucionRepuesto.set('');
    this.resolucionConfirmacion.set(false);
    this.errorResolucion.set(null);
    this.mostrarModalResolucion.set(true);
  }

  cerrarModalResolucion(): void {
    this.mostrarModalResolucion.set(false);
    this.atencionSeleccionada.set(null);
    this.errorResolucion.set(null);
  }

  guardarResolucion(): void {
    const atencion = this.atencionSeleccionada();
    if (!atencion) return;

    const obs = this.resolucionObservaciones().trim();
    if (!obs || obs.length < 10) {
      this.errorResolucion.set('El diagnóstico técnico es obligatorio y debe tener al menos 10 caracteres.');
      return;
    }

    if (!this.resolucionConfirmacion()) {
      this.errorResolucion.set('Debes marcar la casilla certificando la operatividad del aula.');
      return;
    }

    const detalle = `${this.resolucionTipoSolucion()}${this.resolucionRepuesto() ? ' - Repuesto: ' + this.resolucionRepuesto().trim() : ''}`;
    const usuario = this.tecnicoLogueado();

    this.atencionService.resolverAtencion(atencion.id, obs, detalle, usuario).subscribe({
      next: () => {
        this.cerrarModalResolucion();
        this.mostrarExito(`Orden #${atencion.id} resuelta y certificada correctamente. ¡Aula 100% operativa!`);
      },
      error: (err) => {
        this.errorResolucion.set(`No se pudo resolver la atención: ${err.message || 'Error en el servidor.'}`);
      }
    });
  }

  // --- Acciones de Triaje Rápido (Bandeja de Entrada de Reportes) ---

  tomarReporte(rep: ReportePendienteAsignacion): void {
    if (!this.puedeGestionar()) {
      this.mostrarAlerta('Acceso denegado: debes tener rol Técnico o Admin para asignarte reportes.');
      return;
    }

    const usuario = this.tecnicoLogueado();
    this.atencionService.autoAsignarReporte(rep, usuario).subscribe({
      next: (nueva) => {
        this.mostrarExito(`Orden #${nueva.id} generada y asignada a ${usuario} para el Aula ${nueva.aulaCodigo}.`);
      },
      error: (err) => {
        this.mostrarAlerta(`Error al asignar reporte: ${err.message || 'Verifica el servidor.'}`);
      }
    });
  }

  abrirModalAsignarReporte(rep: ReportePendienteAsignacion): void {
    if (!this.puedeGestionar()) {
      this.mostrarAlerta('Acceso denegado: solo personal técnico o administradores pueden asignar reportes.');
      return;
    }

    this.nuevoReporteId.set(rep.id);
    this.nuevoAulaCodigo.set(rep.aulaId);
    this.nuevoTecnico.set(this.tecnicoLogueado());
    this.nuevoTipoMantenimiento.set('CORRECTIVO');
    const p = (['ALTA', 'MEDIA', 'BAJA'].includes(rep.prioridad) ? rep.prioridad : 'MEDIA') as 'ALTA' | 'MEDIA' | 'BAJA';
    this.nuevaPrioridad.set(p);
    this.nuevasObservaciones.set(rep.descripcion);
    this.errorNueva.set(null);
    this.mostrarModalNueva.set(true);
  }

  abrirModalNueva(): void {
    if (!this.puedeGestionar()) {
      this.mostrarAlerta('Acceso denegado: solo personal técnico o administradores pueden crear órdenes de atención.');
      return;
    }

    this.nuevoReporteId.set(null);
    this.nuevoAulaCodigo.set('A-101');
    this.nuevoTecnico.set(this.tecnicoLogueado());
    this.nuevoTipoMantenimiento.set('CORRECTIVO');
    this.nuevaPrioridad.set('MEDIA');
    this.nuevasObservaciones.set('');
    this.errorNueva.set(null);
    this.mostrarModalNueva.set(true);
  }

  cerrarModalNueva(): void {
    this.mostrarModalNueva.set(false);
    this.errorNueva.set(null);
  }

  crearNuevaAtencion(): void {
    const repId = this.nuevoReporteId();
    if (!repId || repId <= 0) {
      this.errorNueva.set('Debes ingresar un número válido de Reporte / Ticket de origen.');
      return;
    }

    const tecnico = this.nuevoTecnico().trim();
    if (!tecnico) {
      this.errorNueva.set('Debes asignar un técnico responsable para el caso.');
      return;
    }

    this.atencionService.crearAtencion({
      reporteId: repId,
      tecnicoEncargado: tecnico,
      aulaCodigo: this.nuevoAulaCodigo(),
      prioridad: this.nuevaPrioridad(),
      tipoMantenimiento: this.nuevoTipoMantenimiento(),
      observaciones: this.nuevasObservaciones().trim() || 'Orden técnica creada manualmente.',
      impactoAcademico: 'Atención prioritaria asignada en campus'
    }).subscribe({
      next: (nueva) => {
        this.cerrarModalNueva();
        this.mostrarExito(`Nueva Orden #${nueva.id} para Aula ${nueva.aulaCodigo} generada con éxito.`);
      },
      error: (err) => {
        this.errorNueva.set(`No se pudo generar la orden: ${err.message || 'Error de validación.'}`);
      }
    });
  }

  cerrarMensaje(): void {
    this.mensajeExito.set(null);
    this.mensajeAlerta.set(null);
  }

  private mostrarExito(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom'
    });
  }

  private mostrarAlerta(mensaje: string): void {
    this.snackBar
      .open(mensaje, 'Iniciar sesión', {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'bottom'
      })
      .onAction()
      .subscribe(() => {
        this.router.navigate(['/login'], { queryParams: { returnUrl: '/atenciones' } });
      });
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

  // --- Modal de Ficha Técnica / Acta de Conformidad (Opción 2) ---
  readonly mostrarModalFicha = signal<boolean>(false);
  readonly atencionFicha = signal<Atencion | null>(null);

  abrirModalFicha(atencion: Atencion): void {
    this.atencionFicha.set(atencion);
    this.mostrarModalFicha.set(true);
  }

  cerrarModalFicha(): void {
    this.mostrarModalFicha.set(false);
    this.atencionFicha.set(null);
  }

  imprimirFicha(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  // --- Indicador de Tiempo de Atención (SLA) y Nivel de Urgencia (Opción 3) ---
  getNivelUrgencia(atencion: Atencion): { label: string; icono: string; clase: string } {
    const prio = atencion.prioridad;
    if (prio === 'ALTA') {
      return { label: 'CRÍTICA / ALTA', icono: 'priority_high', clase: 'urgencia-alta' };
    }
    if (prio === 'BAJA') {
      return { label: 'PREVENTIVO / BAJA', icono: 'check_circle', clase: 'urgencia-baja' };
    }
    return { label: 'PRIORIDAD MEDIA', icono: 'warning_amber', clase: 'urgencia-media' };
  }

  calcularSLA(atencion: Atencion): { texto: string; badge: string; nivel: 'en_tiempo' | 'alerta' | 'resuelto' } {
    if (atencion.estado === 'RESUELTO') {
      const tiempo = this.calcularTiempoResolucion(atencion);
      return {
        texto: `Resuelto en ${tiempo}`,
        badge: 'SLA CUMPLIDO',
        nivel: 'resuelto'
      };
    }

    const reg = new Date(atencion.fechaRegistro).getTime();
    const ahora = Date.now();
    const difMin = Math.max(1, Math.round((ahora - reg) / 60000));

    // Helpers para formatear tiempo de forma compacta
    const formatearTiempo = (minutos: number): string => {
      if (minutos < 60) return `${minutos}m`;
      const dias = Math.floor(minutos / 1440);
      const horas = Math.floor((minutos % 1440) / 60);
      const mins = minutos % 60;
      if (dias > 0) return horas > 0 ? `${dias}d ${horas}h` : `${dias}d`;
      return mins > 0 ? `${horas}h ${mins}m` : `${horas}h`;
    };

    if (atencion.estado === 'EN_ATENCION') {
      const texto = `En sitio: ${formatearTiempo(difMin)}`;
      if (difMin <= 180) {
        return { texto, badge: 'EN CURSO', nivel: 'en_tiempo' };
      }
      const dias = Math.floor(difMin / 1440);
      const badge = dias > 0 ? `SLA +${dias}d` : 'SLA >3h';
      return { texto, badge, nivel: 'alerta' };
    }

    // PENDIENTE
    if (difMin <= 45) {
      return { texto: `Espera: ${formatearTiempo(difMin)}`, badge: 'EN PLAZO', nivel: 'en_tiempo' };
    }
    if (difMin <= 480) {
      return { texto: `Espera: ${formatearTiempo(difMin)}`, badge: '¡ATENDER!', nivel: 'alerta' };
    }
    // Más de 8h → resaltar con días
    const dias = Math.floor(difMin / 1440);
    const badge = dias > 0 ? `CRÍTICO • ${dias}d` : 'CRÍTICO';
    return { texto: `Espera: ${formatearTiempo(difMin)}`, badge, nivel: 'alerta' };
  }

  calcularTiempoResolucion(atencion: Atencion): string {
    if (!atencion.fechaResolucion) {
      return '45 minutos';
    }
    const reg = new Date(atencion.fechaRegistro).getTime();
    const res = new Date(atencion.fechaResolucion).getTime();
    const difMin = Math.max(1, Math.round((res - reg) / 60000));

    if (difMin < 60) {
      return `${difMin} min`;
    }
    const horas = Math.floor(difMin / 60);
    const min = difMin % 60;
    return min > 0 ? `${horas}h ${min}m` : `${horas}h`;
  }

  generarCodigoActa(atencion: Atencion): string {
    return `ACTA-UTP-${new Date().getFullYear()}-${String(atencion.id).padStart(4, '0')}`;
  }
}

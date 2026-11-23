import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PerfilDemo, RolRegistro, UsuarioPerfil } from '../../models/auth.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    MatIconModule,
    MatSnackBarModule,
    RouterLink
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);

  readonly modoActivo = signal<'login' | 'registro'>('login');
  readonly returnUrl = signal<string>('/reportes');

  // Solo un Administrador autenticado puede asignar roles de Técnico o Admin y ver el directorio
  readonly esAdmin = this.authService.puedeEliminarReportes;

  // Selector de perfiles de demostración oculto por defecto
  readonly mostrarAccesosDemo = signal<boolean>(false);

  // Campos de Inicio de Sesión
  readonly loginUsername = signal<string>('');
  readonly loginPassword = signal<string>('');
  readonly mostrarPasswordLogin = signal<boolean>(false);
  readonly cargandoLogin = signal<boolean>(false);
  readonly errorLogin = signal<string | null>(null);

  // Campos de Registro de Nuevo Usuario
  readonly regNombreCompleto = signal<string>('');
  readonly regUsername = signal<string>('');
  readonly regCorreo = signal<string>('');
  readonly regPassword = signal<string>('');
  readonly regRol = signal<RolRegistro>('ALUMNO');
  readonly regEspecialidad = signal<string>('Ingeniería de Sistemas e Informática');
  readonly mostrarPasswordReg = signal<boolean>(false);
  readonly cargandoRegistro = signal<boolean>(false);
  readonly errorRegistro = signal<string | null>(null);

  readonly usuariosCampus = this.authService.usuariosRegistrados;

  readonly totalTecnicos = computed(() =>
    this.usuariosCampus().filter(u => u.rol === 'TECNICO').length || this.authService.tecnicosRegistrados().length
  );

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const tab = params.get('modo');
      if (tab === 'registro') {
        this.cambiarModo('registro');
      } else if (tab === 'login') {
        this.cambiarModo('login');
      }
      const next = params.get('returnUrl');
      if (next) {
        this.returnUrl.set(next);
      }
    });

    this.authService.cargarUsuarios().subscribe();
    this.authService.cargarTecnicos().subscribe();
  }

  cambiarModo(modo: 'login' | 'registro'): void {
    this.modoActivo.set(modo);
    this.errorLogin.set(null);
    this.errorRegistro.set(null);
    if (modo === 'registro') {
      if (this.esAdmin()) {
        this.regRol.set('TECNICO');
        this.regEspecialidad.set('Audiovisual y Multimedia');
      } else {
        this.regRol.set('ALUMNO');
        this.regEspecialidad.set('Ingeniería de Sistemas e Informática');
      }
    }
  }

  toggleAccesosDemo(): void {
    this.mostrarAccesosDemo.update(v => !v);
  }

  autocompletarCorreoDesdeUsername(username: string): void {
    this.regUsername.set(username);
    const limpio = username.trim().toLowerCase().replace(/\s+/g, '');
    if (limpio && (!this.regCorreo() || this.regCorreo().endsWith('@utp.edu.pe'))) {
      this.regCorreo.set(`${limpio}@utp.edu.pe`);
    }
  }

  seleccionarRolRegistro(rol: RolRegistro): void {
    if (!this.esAdmin()) {
      this.regRol.set('ALUMNO');
      return;
    }
    this.regRol.set(rol);
    if (rol === 'TECNICO') {
      this.regEspecialidad.set('Soporte Técnico de Campus');
    } else if (rol === 'ADMIN') {
      this.regEspecialidad.set('Dirección de Infraestructura');
    } else {
      this.regEspecialidad.set('Comunidad Académica UTP');
    }
  }

  iniciarSesion(): void {
    const username = this.loginUsername().trim();
    const password = this.loginPassword().trim();

    if (!username || !password) {
      this.errorLogin.set('Ingresa tu usuario institucional y contraseña.');
      return;
    }

    this.cargandoLogin.set(true);
    this.errorLogin.set(null);

    this.authService.login({ username, password }).subscribe({
      next: sesion => {
        this.cargandoLogin.set(false);
        this.snackBar.open(
          `Bienvenido, ${sesion.nombreCompleto || sesion.username}`,
          'OK',
          { duration: 3500, horizontalPosition: 'end', verticalPosition: 'bottom' }
        );
        this.router.navigateByUrl(this.returnUrl());
      },
      error: () => {
        this.cargandoLogin.set(false);
        this.errorLogin.set(
          'El usuario o la contraseña ingresados no son correctos. Verifica tus datos e inténtalo nuevamente.'
        );
      }
    });
  }

  registrarNuevoUsuario(): void {
    const nombreCompleto = this.regNombreCompleto().trim();
    const username = this.regUsername().trim().toLowerCase();
    const correo = this.regCorreo().trim().toLowerCase() || `${username}@utp.edu.pe`;
    const password = this.regPassword().trim();
    // Gobernanza de roles: el auto-registro público siempre asigna ALUMNO. Solo un ADMIN puede dar de alta TECNICO o ADMIN.
    const rol: RolRegistro = this.esAdmin() ? this.regRol() : 'ALUMNO';
    const especialidad = this.regEspecialidad().trim() || 'Comunidad Académica UTP';

    if (nombreCompleto.length < 3) {
      this.errorRegistro.set('Ingresa tu nombre y apellido completo (mínimo 3 caracteres).');
      return;
    }
    if (username.length < 3 || /\s/.test(username)) {
      this.errorRegistro.set('El usuario debe tener al menos 3 caracteres y no contener espacios.');
      return;
    }
    if (!correo.includes('@')) {
      this.errorRegistro.set('Ingresa un correo electrónico institucional válido.');
      return;
    }
    if (password.length < 4) {
      this.errorRegistro.set('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    this.cargandoRegistro.set(true);
    this.errorRegistro.set(null);

    this.authService
      .registrarUsuario({
        username,
        nombreCompleto,
        correo,
        password,
        rol,
        especialidad
      })
      .subscribe({
        next: sesion => {
          this.cargandoRegistro.set(false);
          this.snackBar.open(
            `Cuenta registrada correctamente: ${sesion.nombreCompleto} (@${sesion.username})`,
            'Continuar',
            { duration: 4000, horizontalPosition: 'end', verticalPosition: 'bottom' }
          );
          this.regNombreCompleto.set('');
          this.regUsername.set('');
          this.regCorreo.set('');
          this.regPassword.set('');
          this.router.navigateByUrl(rol === 'TECNICO' ? '/atenciones' : this.returnUrl());
        },
        error: err => {
          this.cargandoRegistro.set(false);
          const backendMsg = err?.error?.message || err?.error?.detail;
          this.errorRegistro.set(
            backendMsg || 'No se pudo completar el registro. Verifica que el usuario o correo no estén en uso.'
          );
        }
      });
  }

  accesoRapidoDemo(perfil: PerfilDemo): void {
    this.errorLogin.set(null);
    this.authService.loginRapido(perfil).subscribe({
      next: sesion => {
        this.snackBar.open(
          `Sesión iniciada como ${sesion.nombreCompleto || sesion.username}`,
          'OK',
          { duration: 3000, horizontalPosition: 'end', verticalPosition: 'bottom' }
        );
        this.router.navigateByUrl(this.returnUrl());
      }
    });
  }

  cargarUsuarioEnFormulario(username: string): void {
    this.modoActivo.set('login');
    this.loginUsername.set(username);
    this.loginPassword.set('');
    this.errorLogin.set(null);
  }

  alternarTurnoUsuario(usuario: UsuarioPerfil): void {
    if (!this.esAdmin() || usuario.username === 'admin') {
      return;
    }
    const nuevoEstado = !usuario.activo;
    this.authService.cambiarDisponibilidadUsuario(usuario.id, nuevoEstado).subscribe({
      next: actualizado => {
        const etiquetaEstado = actualizado.activo ? 'En Turno (Habilitado)' : 'Fuera de Turno (Pausado)';
        this.snackBar.open(
          `${actualizado.nombreCompleto}: ${etiquetaEstado}`,
          'OK',
          { duration: 3200, horizontalPosition: 'end', verticalPosition: 'bottom' }
        );
      }
    });
  }

  obtenerEtiquetaRol(roles: string[]): string {
    if (roles.includes('ROLE_ADMIN')) return 'Administrador';
    if (roles.includes('ROLE_TECNICO')) return 'Soporte Técnico';
    return 'Docente / Estudiante';
  }
}

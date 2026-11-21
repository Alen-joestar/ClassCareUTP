import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PerfilDemo, RolRegistro } from '../../models/auth.model';
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
  readonly regRol = signal<RolRegistro>('TECNICO');
  readonly regEspecialidad = signal<string>('Audiovisual y Multimedia');
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
        this.modoActivo.set('registro');
      } else if (tab === 'login') {
        this.modoActivo.set('login');
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
  }

  autocompletarCorreoDesdeUsername(username: string): void {
    this.regUsername.set(username);
    const limpio = username.trim().toLowerCase().replace(/\s+/g, '');
    if (limpio && (!this.regCorreo() || this.regCorreo().endsWith('@utp.edu.pe'))) {
      this.regCorreo.set(`${limpio}@utp.edu.pe`);
    }
  }

  seleccionarRolRegistro(rol: RolRegistro): void {
    this.regRol.set(rol);
    if (rol === 'TECNICO' && !this.regEspecialidad()) {
      this.regEspecialidad.set('Soporte Técnico de Campus');
    } else if (rol === 'ADMIN') {
      this.regEspecialidad.set('Dirección de Infraestructura');
    } else if (rol === 'ALUMNO') {
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
          `Bienvenido, ${sesion.nombreCompleto || sesion.username} (${this.obtenerEtiquetaRol(sesion.roles)})`,
          'OK',
          { duration: 3500, horizontalPosition: 'end', verticalPosition: 'bottom' }
        );
        this.router.navigateByUrl(this.returnUrl());
      },
      error: () => {
        this.cargandoLogin.set(false);
        this.errorLogin.set(
          'Credenciales incorrectas (HTTP 401). Verifica tu usuario y contraseña o usa una cuenta registrada.'
        );
      }
    });
  }

  registrarNuevoUsuario(): void {
    const nombreCompleto = this.regNombreCompleto().trim();
    const username = this.regUsername().trim().toLowerCase();
    const correo = this.regCorreo().trim().toLowerCase() || `${username}@utp.edu.pe`;
    const password = this.regPassword().trim();
    const rol = this.regRol();
    const especialidad = this.regEspecialidad().trim();

    if (nombreCompleto.length < 3) {
      this.errorRegistro.set('Ingresa el nombre y apellido completo (mínimo 3 caracteres).');
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
            `Cuenta creada y autenticada: ${sesion.nombreCompleto} (@${sesion.username})`,
            'Ir al Campus',
            { duration: 4200, horizontalPosition: 'end', verticalPosition: 'bottom' }
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
            backendMsg || 'No se pudo registrar el usuario. Verifica que el usuario o correo no estén duplicados.'
          );
        }
      });
  }

  accesoRapidoDemo(perfil: PerfilDemo): void {
    this.errorLogin.set(null);
    this.authService.loginRapido(perfil).subscribe({
      next: sesion => {
        this.snackBar.open(
          `Sesión activa como ${sesion.nombreCompleto || sesion.username} (${this.obtenerEtiquetaRol(sesion.roles)})`,
          'OK',
          { duration: 3200, horizontalPosition: 'end', verticalPosition: 'bottom' }
        );
      }
    });
  }

  cargarUsuarioEnFormulario(username: string): void {
    this.modoActivo.set('login');
    this.loginUsername.set(username);
    if (username === 'admin') {
      this.loginPassword.set('admin123');
    } else if (username === 'alumno') {
      this.loginPassword.set('alumno123');
    } else {
      this.loginPassword.set('tecnico123');
    }
    this.errorLogin.set(null);
  }

  obtenerEtiquetaRol(roles: string[]): string {
    if (roles.includes('ROLE_ADMIN')) return 'Administrador';
    if (roles.includes('ROLE_TECNICO')) return 'Soporte Técnico';
    return 'Alumno / Docente';
  }
}

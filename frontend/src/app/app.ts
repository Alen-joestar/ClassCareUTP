import { Component, DOCUMENT, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { PerfilDemo } from './models/auth.model';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly document = inject(DOCUMENT);
  protected readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly title = signal('ClassCare Campus');
  protected readonly isDarkMode = signal(false);

  constructor() {
    const savedMode = typeof localStorage !== 'undefined' ? localStorage.getItem('classcare-theme') : null;
    if (savedMode === 'dark') {
      this.isDarkMode.set(true);
      this.document.body.setAttribute('data-mode', 'dark');
    } else {
      this.document.body.setAttribute('data-mode', 'light');
    }
  }

  /**
   * Alterna entre los perfiles JWT configurados en SecurityConfig.java
   * (tecnico -> admin -> alumno -> público sin token) ejecutando POST /api/auth/login.
   */
  alternarSesionJwt(): void {
    const actual = this.authService.sesion();
    let siguientePerfil: PerfilDemo | 'logout';

    if (!actual) {
      siguientePerfil = 'tecnico';
    } else if (actual.username === 'tecnico') {
      siguientePerfil = 'admin';
    } else if (actual.username === 'admin') {
      siguientePerfil = 'alumno';
    } else {
      siguientePerfil = 'logout';
    }

    if (siguientePerfil === 'logout') {
      this.authService.logout();
      this.snackBar.open(
        'Sesión cerrada: Peticiones HTTP se enviarán sin cabecera Authorization Bearer.',
        'Cerrar',
        { duration: 3500, horizontalPosition: 'end', verticalPosition: 'bottom' }
      );
      return;
    }

    this.authService.loginRapido(siguientePerfil).subscribe(sesion => {
      this.snackBar.open(
        `Sesión JWT activa: ${sesion.username} (${sesion.roles.join(', ')}) • Bearer Token listo`,
        'Cerrar',
        { duration: 3500, horizontalPosition: 'end', verticalPosition: 'bottom' }
      );
    });
  }

  toggleDarkMode(): void {
    const nextDark = !this.isDarkMode();
    this.isDarkMode.set(nextDark);
    const mode = nextDark ? 'dark' : 'light';
    this.document.body.setAttribute('data-mode', mode);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('classcare-theme', mode);
    }
  }
}

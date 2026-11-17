import { Component, DOCUMENT, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
    FormsModule,
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
  protected readonly mostrarPanelJwt = signal(false);

  protected readonly loginUsername = signal('tecnico');
  protected readonly loginPassword = signal('tecnico123');
  protected readonly errorLogin = signal<string | null>(null);

  constructor() {
    const savedMode = typeof localStorage !== 'undefined' ? localStorage.getItem('classcare-theme') : null;
    if (savedMode === 'dark') {
      this.isDarkMode.set(true);
      this.document.body.setAttribute('data-mode', 'dark');
    } else {
      this.document.body.setAttribute('data-mode', 'light');
    }
  }

  togglePanelJwt(): void {
    this.errorLogin.set(null);
    this.mostrarPanelJwt.update(v => !v);
  }

  cerrarPanelJwt(): void {
    this.mostrarPanelJwt.set(false);
  }

  iniciarSesionManual(): void {
    const username = this.loginUsername().trim();
    const password = this.loginPassword().trim();
    if (!username || !password) {
      this.errorLogin.set('Ingresa usuario y contraseña.');
      return;
    }

    this.errorLogin.set(null);
    this.authService.login({ username, password }).subscribe({
      next: sesion => {
        this.mostrarPanelJwt.set(false);
        this.snackBar.open(
          `Autenticado en /api/auth/login como ${sesion.username} (${sesion.roles.join(', ')})`,
          'Cerrar',
          { duration: 3500, horizontalPosition: 'end', verticalPosition: 'bottom' }
        );
      },
      error: () => {
        this.errorLogin.set('Credenciales inválidas (401). Prueba: tecnico/tecnico123 o admin/admin123.');
      }
    });
  }

  seleccionarPerfilRapido(perfil: PerfilDemo): void {
    this.errorLogin.set(null);
    this.authService.loginRapido(perfil).subscribe(sesion => {
      this.loginUsername.set(sesion.username);
      this.loginPassword.set(`${sesion.username}123`);
      this.mostrarPanelJwt.set(false);
      this.snackBar.open(
        `Sesión JWT activa: ${sesion.username} (${sesion.roles.join(', ')}) • Bearer Token listo`,
        'Cerrar',
        { duration: 3500, horizontalPosition: 'end', verticalPosition: 'bottom' }
      );
    });
  }

  cerrarSesionJwt(): void {
    this.authService.logout();
    this.mostrarPanelJwt.set(false);
    this.snackBar.open(
      'Sesión cerrada: Peticiones HTTP se enviarán sin cabecera Authorization Bearer.',
      'Cerrar',
      { duration: 3500, horizontalPosition: 'end', verticalPosition: 'bottom' }
    );
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

import { Component, DOCUMENT, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly document = inject(DOCUMENT);

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

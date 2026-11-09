import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Aula, AulaAuthSession, AulaFormData } from './aula.model';

const SESSION_KEY = 'classcareSesion';

@Injectable({ providedIn: 'root' })
export class AulaService {
  private readonly sessionState = signal<AulaAuthSession | null>(this.readSession());
  readonly session = this.sessionState.asReadonly();

  constructor(private readonly http: HttpClient) {}

  async listar(): Promise<Aula[]> {
    const aulas = await firstValueFrom(this.http.get<Aula[]>('/api/aulas'));
    if (!Array.isArray(aulas)) {
      throw new Error('La respuesta de la API no contiene una lista de aulas válida.');
    }
    return aulas;
  }

  async iniciarSesion(username: string, password: string): Promise<AulaAuthSession> {
    const response = await firstValueFrom(
      this.http.post<AulaAuthSession>('/api/auth/login', { username, password })
    );
    if (!response.token || !Array.isArray(response.roles)) {
      throw new Error('El servidor no devolvió una sesión válida.');
    }

    this.sessionState.set(response);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(response));
    }
    return response;
  }

  async registrar(datos: AulaFormData): Promise<Aula> {
    return firstValueFrom(
      this.http.post<Aula>('/api/aulas', datos, { headers: this.authHeaders() })
    );
  }

  async actualizar(id: number, datos: AulaFormData): Promise<Aula> {
    return firstValueFrom(
      this.http.put<Aula>(`/api/aulas/${encodeURIComponent(id)}`, datos, {
        headers: this.authHeaders()
      })
    );
  }

  async eliminar(id: number): Promise<void> {
    await firstValueFrom(
      this.http.delete<void>(`/api/aulas/${encodeURIComponent(id)}`, {
        headers: this.authHeaders()
      })
    );
  }

  cerrarSesion(): void {
    this.sessionState.set(null);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }

  mensajeError(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as { message?: string; detail?: string; error?: string } | string;
      if (typeof body === 'string' && body.trim()) {
        return body;
      }
      if (body && typeof body === 'object') {
        return body.message || body.detail || body.error || fallback;
      }
      if (error.status === 0) {
        return 'No se pudo conectar con el servidor. Verifique que Spring Boot esté activo.';
      }
    }
    return error instanceof Error ? error.message : fallback;
  }

  private authHeaders(): HttpHeaders {
    const session = this.sessionState();
    if (!session?.token) {
      throw new Error('Inicie sesión con una cuenta técnica para gestionar las aulas.');
    }
    return new HttpHeaders({
      Authorization: `${session.tipo || 'Bearer'} ${session.token}`
    });
  }

  private readSession(): AulaAuthSession | null {
    if (typeof sessionStorage === 'undefined') {
      return null;
    }

    const storedSession = sessionStorage.getItem(SESSION_KEY);
    if (!storedSession) {
      return null;
    }

    try {
      const session: unknown = JSON.parse(storedSession);
      if (
        session &&
        typeof session === 'object' &&
        'token' in session &&
        typeof session.token === 'string' &&
        'roles' in session &&
        Array.isArray(session.roles)
      ) {
        return session as AulaAuthSession;
      }
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }

    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

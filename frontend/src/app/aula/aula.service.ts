import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Aula, AulaFormData } from './aula.model';

@Injectable({ providedIn: 'root' })
export class AulaService {
  constructor(private readonly http: HttpClient) {}

  async listar(): Promise<Aula[]> {
    const aulas = await firstValueFrom(this.http.get<Aula[]>('/api/aulas'));
    if (!Array.isArray(aulas)) {
      throw new Error('La respuesta de la API no contiene una lista de aulas válida.');
    }
    return aulas;
  }

  async registrar(datos: AulaFormData): Promise<Aula> {
    return firstValueFrom(this.http.post<Aula>('/api/aulas', datos));
  }

  async actualizar(id: number, datos: AulaFormData): Promise<Aula> {
    return firstValueFrom(this.http.put<Aula>(`/api/aulas/${encodeURIComponent(id)}`, datos));
  }

  async eliminar(id: number): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`/api/aulas/${encodeURIComponent(id)}`));
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
}

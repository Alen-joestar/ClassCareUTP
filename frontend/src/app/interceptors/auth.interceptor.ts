import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor funcional HTTP (Angular v22 - Semana 14).
 * Intercepta todas las peticiones salientes hacia /api/ e inyecta automáticamente
 * la cabecera Authorization: Bearer <token> si existe una sesión JWT activa.
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // No adjuntar el token en el endpoint público de login (/api/auth/login)
  const esRutaApi = req.url.startsWith('/api/') || req.url.includes('/api/');
  const esRutaAuth = req.url.includes('/api/auth/login');

  if (token && esRutaApi && !esRutaAuth) {
    const peticionAutenticada = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(peticionAutenticada);
  }

  return next(req);
};

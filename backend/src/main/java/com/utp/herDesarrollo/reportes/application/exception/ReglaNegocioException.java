package com.utp.herDesarrollo.reportes.application.exception;

/**
 * Excepción lanzada cuando se violan reglas de negocio o validaciones de dominio.
 */
public class ReglaNegocioException extends RuntimeException {
    public ReglaNegocioException(String mensaje) {
        super(mensaje);
    }
}

package com.utp.herDesarrollo.reportes.application.exception;

/**
 * Excepción lanzada cuando no se encuentra un recurso solicitado en el sistema.
 */
public class RecursoNoEncontradoException extends RuntimeException {
    public RecursoNoEncontradoException(String mensaje) {
        super(mensaje);
    }
}

package com.utp.herDesarrollo.security.dto;

/**
 * DTO para el registro de un nuevo usuario en ClassCare Campus.
 */
public record RegistroUsuarioDTO(
        String username,
        String nombreCompleto,
        String correo,
        String password,
        String rol,
        String especialidad
) {
}

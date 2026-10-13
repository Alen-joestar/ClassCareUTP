package com.utp.herDesarrollo.security.dto;

/**
 * DTO para la solicitud de inicio de sesión.
 */
public record LoginRequestDTO(
        String username,
        String password
) {
}

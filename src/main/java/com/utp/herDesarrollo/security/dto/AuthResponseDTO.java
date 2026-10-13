package com.utp.herDesarrollo.security.dto;

import java.util.List;

/**
 * DTO que encapsula el token JWT emitido junto con los roles del usuario autenticado.
 */
public record AuthResponseDTO(
        String token,
        String tipo,
        String username,
        List<String> roles
) {
    public AuthResponseDTO(String token, String username, List<String> roles) {
        this(token, "Bearer", username, roles);
    }
}

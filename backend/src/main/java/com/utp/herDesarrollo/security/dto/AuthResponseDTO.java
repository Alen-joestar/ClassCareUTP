package com.utp.herDesarrollo.security.dto;

import java.util.List;

/**
 * DTO que encapsula el token JWT emitido junto con el perfil y roles del usuario autenticado.
 */
public record AuthResponseDTO(
        String token,
        String tipo,
        String username,
        String nombreCompleto,
        String correo,
        String especialidad,
        List<String> roles
) {
    public AuthResponseDTO(String token, String username, List<String> roles) {
        this(token, "Bearer", username, username, username + "@utp.edu.pe", null, roles);
    }

    public AuthResponseDTO(
            String token,
            String username,
            String nombreCompleto,
            String correo,
            String especialidad,
            List<String> roles) {
        this(token, "Bearer", username, nombreCompleto, correo, especialidad, roles);
    }
}

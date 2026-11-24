package com.utp.herDesarrollo.security.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO con la información pública de perfil de un usuario registrado (sin exponer su contraseña).
 */
public record UsuarioPerfilDTO(
        Long id,
        String username,
        String nombreCompleto,
        String correo,
        String rol,
        List<String> roles,
        String especialidad,
        boolean activo,
        LocalDateTime fechaRegistro
) {
}

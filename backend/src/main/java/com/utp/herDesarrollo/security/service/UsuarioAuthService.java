package com.utp.herDesarrollo.security.service;

import com.utp.herDesarrollo.reportes.application.exception.ReglaNegocioException;
import com.utp.herDesarrollo.security.dto.RegistroUsuarioDTO;
import com.utp.herDesarrollo.security.dto.UsuarioPerfilDTO;
import com.utp.herDesarrollo.security.model.RolUsuario;
import com.utp.herDesarrollo.security.model.Usuario;
import com.utp.herDesarrollo.security.repository.UsuarioRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Servicio de autenticación y gestión de usuarios persistidos en base de datos (JPA).
 * Implementa UserDetailsService para integrarse con Spring Security y AuthenticationManager.
 */
@Service
public class UsuarioAuthService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final String passwordTecnico;
    private final String passwordAdmin;

    public UsuarioAuthService(
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.security.tecnico.password:tecnico123}") String passwordTecnico,
            @Value("${app.security.admin.password:admin123}") String passwordAdmin) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.passwordTecnico = passwordTecnico;
        this.passwordAdmin = passwordAdmin;
    }

    @PostConstruct
    @Transactional
    public void asegurarUsuariosBase() {
        sembrarSiNoExiste(
                "tecnico",
                "Soporte Técnico UTP",
                "tecnico@utp.edu.pe",
                passwordTecnico,
                RolUsuario.TECNICO,
                "Soporte Integral de Campus"
        );
        sembrarSiNoExiste(
                "admin",
                "Administrador General UTP",
                "admin@utp.edu.pe",
                passwordAdmin,
                RolUsuario.ADMIN,
                "Dirección de Infraestructura"
        );
        sembrarSiNoExiste(
                "alumno",
                "Estudiante / Docente UTP",
                "alumno@utp.edu.pe",
                "alumno123",
                RolUsuario.ALUMNO,
                "Comunidad Académica"
        );
        sembrarSiNoExiste(
                "cmendoza",
                "Carlos Mendoza",
                "cmendoza@utp.edu.pe",
                passwordTecnico,
                RolUsuario.TECNICO,
                "Audiovisual y Proyección"
        );
        sembrarSiNoExiste(
                "atorres",
                "Ana Torres",
                "atorres@utp.edu.pe",
                passwordTecnico,
                RolUsuario.TECNICO,
                "Instalaciones Eléctricas"
        );
        sembrarSiNoExiste(
                "lvargas",
                "Luis Vargas",
                "lvargas@utp.edu.pe",
                passwordTecnico,
                RolUsuario.TECNICO,
                "Climatización e Infraestructura"
        );
        sembrarSiNoExiste(
                "egomez",
                "Elena Gómez",
                "egomez@utp.edu.pe",
                passwordTecnico,
                RolUsuario.TECNICO,
                "Redes y Conectividad"
        );
    }

    private void sembrarSiNoExiste(
            String username,
            String nombreCompleto,
            String correo,
            String rawPassword,
            RolUsuario rol,
            String especialidad) {
        if (!usuarioRepository.existsByUsernameIgnoreCase(username)) {
            Usuario nuevo = new Usuario(
                    username,
                    nombreCompleto,
                    correo,
                    passwordEncoder.encode(rawPassword),
                    rol,
                    especialidad
            );
            usuarioRepository.save(nuevo);
        }
    }

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        if (usuarioRepository.count() == 0) {
            asegurarUsuariosBase();
        }
        Usuario usuario = usuarioRepository.findByUsernameIgnoreCase(username.trim())
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + username));

        if (!usuario.isActivo()) {
            throw new UsernameNotFoundException("La cuenta de usuario se encuentra inactiva: " + username);
        }

        return User.builder()
                .username(usuario.getUsername())
                .password(usuario.getPassword())
                .roles(usuario.getRol().name())
                .build();
    }

    @Transactional(readOnly = true)
    public Optional<Usuario> buscarPorUsername(String username) {
        if (username == null || username.isBlank()) {
            return Optional.empty();
        }
        return usuarioRepository.findByUsernameIgnoreCase(username.trim());
    }

    @Transactional
    public Usuario registrarUsuario(RegistroUsuarioDTO dto) {
        if (usuarioRepository.count() == 0) {
            asegurarUsuariosBase();
        }

        if (dto == null || dto.username() == null || dto.username().trim().isEmpty()) {
            throw new ReglaNegocioException("El nombre de usuario es obligatorio.");
        }
        String username = dto.username().trim().toLowerCase();
        if (username.length() < 3) {
            throw new ReglaNegocioException("El nombre de usuario debe tener al menos 3 caracteres.");
        }
        if (usuarioRepository.existsByUsernameIgnoreCase(username)) {
            throw new ReglaNegocioException("El nombre de usuario '" + username + "' ya está registrado.");
        }

        if (dto.nombreCompleto() == null || dto.nombreCompleto().trim().length() < 3) {
            throw new ReglaNegocioException("El nombre completo debe tener al menos 3 caracteres.");
        }
        String nombreCompleto = dto.nombreCompleto().trim();

        if (dto.password() == null || dto.password().trim().length() < 4) {
            throw new ReglaNegocioException("La contraseña debe tener al menos 4 caracteres.");
        }

        String correo = (dto.correo() != null && !dto.correo().trim().isEmpty())
                ? dto.correo().trim().toLowerCase()
                : username + "@utp.edu.pe";

        if (usuarioRepository.existsByCorreoIgnoreCase(correo)) {
            throw new ReglaNegocioException("El correo institucional '" + correo + "' ya está registrado.");
        }

        RolUsuario rol = resolverRol(dto.rol());
        String especialidad = (dto.especialidad() != null && !dto.especialidad().trim().isEmpty())
                ? dto.especialidad().trim()
                : switch (rol) {
                    case ADMIN -> "Gestión de Infraestructura";
                    case TECNICO -> "Soporte Técnico de Campus";
                    case ALUMNO -> "Comunidad Académica UTP";
                };

        Usuario nuevo = new Usuario(
                username,
                nombreCompleto,
                correo,
                passwordEncoder.encode(dto.password().trim()),
                rol,
                especialidad
        );

        return usuarioRepository.save(nuevo);
    }

    @Transactional
    public List<UsuarioPerfilDTO> listarTodos() {
        if (usuarioRepository.count() == 0) {
            asegurarUsuariosBase();
        }
        return usuarioRepository.findAllByOrderByFechaRegistroDesc().stream()
                .map(this::mapearAPerfilDTO)
                .toList();
    }

    @Transactional
    public List<UsuarioPerfilDTO> listarTecnicosActivos() {
        if (usuarioRepository.count() == 0) {
            asegurarUsuariosBase();
        }
        return usuarioRepository.findByRolAndActivoTrueOrderByNombreCompletoAsc(RolUsuario.TECNICO).stream()
                .map(this::mapearAPerfilDTO)
                .toList();
    }

    public UsuarioPerfilDTO mapearAPerfilDTO(Usuario u) {
        String roleAuthority = "ROLE_" + u.getRol().name();
        return new UsuarioPerfilDTO(
                u.getId(),
                u.getUsername(),
                u.getNombreCompleto(),
                u.getCorreo(),
                u.getRol().name(),
                List.of(roleAuthority),
                u.getEspecialidad(),
                u.isActivo(),
                u.getFechaRegistro()
        );
    }

    private RolUsuario resolverRol(String rolTexto) {
        if (rolTexto == null || rolTexto.isBlank()) {
            return RolUsuario.ALUMNO;
        }
        String normalizado = rolTexto.trim().toUpperCase().replace("ROLE_", "");
        return switch (normalizado) {
            case "ADMIN", "ADMINISTRADOR" -> RolUsuario.ADMIN;
            case "TECNICO", "SOPORTE" -> RolUsuario.TECNICO;
            default -> RolUsuario.ALUMNO;
        };
    }
}

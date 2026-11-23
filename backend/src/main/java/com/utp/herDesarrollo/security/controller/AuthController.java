package com.utp.herDesarrollo.security.controller;

import com.utp.herDesarrollo.security.dto.AuthResponseDTO;
import com.utp.herDesarrollo.security.dto.LoginRequestDTO;
import com.utp.herDesarrollo.security.dto.RegistroUsuarioDTO;
import com.utp.herDesarrollo.security.dto.UsuarioPerfilDTO;
import com.utp.herDesarrollo.security.jwt.JwtTokenProvider;
import com.utp.herDesarrollo.security.model.Usuario;
import com.utp.herDesarrollo.security.service.UsuarioAuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador de autenticación y gestión de cuentas institucionales ClassCare Campus.
 * Expone endpoints para inicio de sesión JWT, registro de nuevos usuarios y consulta de técnicos.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UsuarioAuthService usuarioAuthService;

    public AuthController(
            AuthenticationManager authenticationManager,
            JwtTokenProvider jwtTokenProvider,
            UsuarioAuthService usuarioAuthService) {
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
        this.usuarioAuthService = usuarioAuthService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@RequestBody LoginRequestDTO request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );

        String token = jwtTokenProvider.generateToken(authentication);
        List<String> roles = authentication.getAuthorities().stream()
                .map(authority -> authority.getAuthority())
                .toList();

        return usuarioAuthService.buscarPorUsername(authentication.getName())
                .map(u -> ResponseEntity.ok(new AuthResponseDTO(
                        token,
                        u.getUsername(),
                        u.getNombreCompleto(),
                        u.getCorreo(),
                        u.getEspecialidad(),
                        roles
                )))
                .orElseGet(() -> ResponseEntity.ok(new AuthResponseDTO(
                        token,
                        authentication.getName(),
                        roles
                )));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDTO> registrar(@RequestBody RegistroUsuarioDTO request) {
        Usuario creado = usuarioAuthService.registrarUsuario(request);
        List<String> roles = List.of("ROLE_" + creado.getRol().name());
        String token = jwtTokenProvider.generateToken(creado.getUsername(), roles);

        AuthResponseDTO response = new AuthResponseDTO(
                token,
                creado.getUsername(),
                creado.getNombreCompleto(),
                creado.getCorreo(),
                creado.getEspecialidad(),
                roles
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/tecnicos")
    public ResponseEntity<List<UsuarioPerfilDTO>> listarTecnicos() {
        return ResponseEntity.ok(usuarioAuthService.listarTecnicosActivos());
    }

    @GetMapping("/usuarios")
    public ResponseEntity<List<UsuarioPerfilDTO>> listarUsuarios() {
        return ResponseEntity.ok(usuarioAuthService.listarTodos());
    }

    @PatchMapping("/usuarios/{id}/estado")
    public ResponseEntity<UsuarioPerfilDTO> cambiarEstadoUsuario(
            @PathVariable Long id,
            @RequestBody(required = false) java.util.Map<String, Boolean> body) {
        Boolean activo = (body != null && body.containsKey("activo")) ? body.get("activo") : null;
        return ResponseEntity.ok(usuarioAuthService.cambiarEstadoDisponibilidad(id, activo));
    }

    @GetMapping("/me")
    public ResponseEntity<UsuarioPerfilDTO> obtenerPerfilActual(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return usuarioAuthService.buscarPorUsername(authentication.getName())
                .map(usuarioAuthService::mapearAPerfilDTO)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }
}

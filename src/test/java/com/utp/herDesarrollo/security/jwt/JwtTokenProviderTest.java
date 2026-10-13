package com.utp.herDesarrollo.security.jwt;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Pruebas Unitarias - JwtTokenProvider (Semana 9)")
class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;
    private final String secret = "ClaveSecretaSuperSeguraParaPruebasUnitariasJwtClassCareCampus2026!";
    private final long expirationMs = 3600000; // 1 hora

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider(secret, expirationMs);
    }

    @Test
    @DisplayName("Debe generar token válido y validar su firma correctamente")
    void debeGenerarYValidarToken() {
        String token = jwtTokenProvider.generateToken("tecnico", List.of("ROLE_TECNICO"));

        assertNotNull(token);
        assertFalse(token.isBlank());
        assertTrue(jwtTokenProvider.validateToken(token));
    }

    @Test
    @DisplayName("Debe extraer el nombre de usuario (subject) del token")
    void debeExtraerUsernameDelToken() {
        String token = jwtTokenProvider.generateToken("admin", List.of("ROLE_ADMIN"));

        String username = jwtTokenProvider.getUsernameFromToken(token);

        assertEquals("admin", username);
    }

    @Test
    @DisplayName("Debe extraer los roles y autoridades del token")
    void debeExtraerAutoridadesDelToken() {
        String token = jwtTokenProvider.generateToken("tecnico", List.of("ROLE_TECNICO", "ROLE_ADMIN"));

        List<GrantedAuthority> authorities = jwtTokenProvider.getAuthoritiesFromToken(token);

        assertEquals(2, authorities.size());
        assertTrue(authorities.stream().anyMatch(a -> a.getAuthority().equals("ROLE_TECNICO")));
        assertTrue(authorities.stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")));
    }

    @Test
    @DisplayName("Debe retornar false al validar un token adulterado o corrupto")
    void debeRechazarTokenInvalido() {
        String token = jwtTokenProvider.generateToken("tecnico", List.of("ROLE_TECNICO"));
        String tokenAdulterado = token + "xyzCorrupto";

        assertFalse(jwtTokenProvider.validateToken(tokenAdulterado));
        assertFalse(jwtTokenProvider.validateToken(""));
        assertFalse(jwtTokenProvider.validateToken(null));
    }

    @Test
    @DisplayName("Debe retornar false al validar un token expirado")
    void debeRechazarTokenExpirado() {
        // Provider con expiración de -1000 ms (ya expirado)
        JwtTokenProvider providerExpirado = new JwtTokenProvider(secret, -1000);
        String tokenExpirado = providerExpirado.generateToken("alumno", List.of("ROLE_ALUMNO"));

        assertFalse(jwtTokenProvider.validateToken(tokenExpirado));
    }
}

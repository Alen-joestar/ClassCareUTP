package com.utp.herDesarrollo.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Pruebas de Integración de Políticas CORS y Manejo Estandarizado de Errores (Semana 16).
 */
@SpringBootTest
@DisplayName("Semana 16 - Políticas CORS (Angular localhost:4200) y Manejo Global de Errores")
class CorsAndErrorHandlingIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();
    }

    @Test
    @DisplayName("CORS Preflight OPTIONS /api/reportes - Debe autorizar origen http://localhost:4200, métodos PUT/DELETE y cabecera Authorization")
    void preflightCorsDesdeAngularLocalhost4200DebeSerAutorizado() throws Exception {
        mockMvc.perform(options("/api/reportes/1")
                        .header("Origin", "http://localhost:4200")
                        .header("Access-Control-Request-Method", "PUT")
                        .header("Access-Control-Request-Headers", "Authorization, Content-Type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:4200"))
                .andExpect(header().string("Access-Control-Allow-Methods", containsString("PUT")))
                .andExpect(header().string("Access-Control-Allow-Headers", containsString("Authorization")))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
    }

    @Test
    @DisplayName("CORS GET /api/reportes - Debe incluir cabecera Access-Control-Allow-Origin para cliente Angular")
    void getReportesConOriginAngularDebeRetornarCabeceraCors() throws Exception {
        mockMvc.perform(get("/api/reportes")
                        .header("Origin", "http://localhost:4200"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:4200"));
    }

    @Test
    @DisplayName("CORS Preflight OPTIONS - Debe rechazar orígenes externos no autorizados (HTTP 403 Forbidden)")
    void preflightCorsDesdeOrigenNoAutorizadoDebeSerRechazado() throws Exception {
        mockMvc.perform(options("/api/reportes")
                        .header("Origin", "http://dominio-externo-no-autorizado.com")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Depuración de Errores - Parámetro de ruta con tipo inválido retorna HTTP 400 Bad Request estructurado con CORS")
    void parametroDeRutaInvalidoDebeRetornarError400EstructuradoConCors() throws Exception {
        mockMvc.perform(get("/api/reportes/id-invalido")
                        .header("Origin", "http://localhost:4200"))
                .andExpect(status().isBadRequest())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:4200"))
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.message", containsString("formato inválido")))
                .andExpect(jsonPath("$.path", is("/api/reportes/id-invalido")));
    }

    @Test
    @DisplayName("Depuración de Errores - Reporte inexistente retorna HTTP 404 Not Found estructurado con CORS")
    void reporteInexistenteDebeRetornarError404EstructuradoConCors() throws Exception {
        mockMvc.perform(get("/api/reportes/999999")
                        .header("Origin", "http://localhost:4200")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:4200"))
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.error", is("Not Found")))
                .andExpect(jsonPath("$.path", is("/api/reportes/999999")));
    }
}

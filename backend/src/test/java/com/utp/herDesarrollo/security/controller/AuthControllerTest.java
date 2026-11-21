package com.utp.herDesarrollo.security.controller;

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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@DisplayName("Pruebas REST - AuthController para autenticación, registro de usuarios y expedición JWT")
class AuthControllerTest {

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
    @DisplayName("POST /api/auth/login - Credenciales válidas retornan 200 OK y token JWT")
    void debeAutenticarYRetornarTokenJWT() throws Exception {
        String json = """
                {
                    "username": "tecnico",
                    "password": "tecnico123"
                }
                """;

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.tipo", is("Bearer")))
                .andExpect(jsonPath("$.username", is("tecnico")))
                .andExpect(jsonPath("$.roles", hasItem("ROLE_TECNICO")));
    }

    @Test
    @DisplayName("POST /api/auth/login - Credenciales inválidas rechazan la autenticación")
    void debeRechazarCredencialesInvalidas() throws Exception {
        String json = """
                {
                    "username": "tecnico",
                    "password": "passwordIncorrecto"
                }
                """;

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)))
                .andExpect(jsonPath("$.error", is("Unauthorized")));
    }

    @Test
    @DisplayName("POST /api/auth/register - Debe crear un nuevo usuario técnico y permitir iniciar sesión con él")
    void debeRegistrarNuevoUsuarioYAutenticar() throws Exception {
        String registroJson = """
                {
                    "username": "jramirez",
                    "nombreCompleto": "Jorge Ramírez",
                    "correo": "jramirez@utp.edu.pe",
                    "password": "utp2026",
                    "rol": "TECNICO",
                    "especialidad": "Soporte de Laboratorios"
                }
                """;

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registroJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.username", is("jramirez")))
                .andExpect(jsonPath("$.nombreCompleto", is("Jorge Ramírez")))
                .andExpect(jsonPath("$.roles", hasItem("ROLE_TECNICO")));

        String loginJson = """
                {
                    "username": "jramirez",
                    "password": "utp2026"
                }
                """;

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.nombreCompleto", is("Jorge Ramírez")))
                .andExpect(jsonPath("$.roles", hasItem("ROLE_TECNICO")));
    }

    @Test
    @DisplayName("GET /api/auth/tecnicos - Debe listar los especialistas técnicos registrados")
    void debeListarTecnicosRegistrados() throws Exception {
        mockMvc.perform(get("/api/auth/tecnicos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", not(empty())))
                .andExpect(jsonPath("$[*].username", hasItem("tecnico")));
    }
}

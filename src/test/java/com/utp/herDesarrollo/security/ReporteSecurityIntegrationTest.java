package com.utp.herDesarrollo.security;

import com.utp.herDesarrollo.reportes.application.dto.ActualizarReporteDTO;
import com.utp.herDesarrollo.reportes.application.dto.CrearReporteDTO;
import com.utp.herDesarrollo.reportes.application.dto.ReporteResponseDTO;
import com.utp.herDesarrollo.reportes.application.service.ReporteService;
import com.utp.herDesarrollo.reportes.domain.model.EstadoReporte;
import com.utp.herDesarrollo.reportes.domain.model.Prioridad;
import com.utp.herDesarrollo.reportes.domain.model.TipoProblema;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.utp.herDesarrollo.security.jwt.JwtTokenProvider;

@SpringBootTest
@DisplayName("Pruebas de Integración de Seguridad - Spring Security, RBAC y JWT (Semanas 8 y 9)")
class ReporteSecurityIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private MockMvc mockMvc;

    @MockitoBean
    private ReporteService reporteService;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();
    }

    private ReporteResponseDTO crearRespuestaEjemplo(Long id, EstadoReporte estado) {
        return new ReporteResponseDTO(
                id,
                "A-101",
                TipoProblema.TECNOLOGICO,
                "Falla de equipo",
                Prioridad.ALTA,
                estado,
                LocalDateTime.now()
        );
    }

    @Test
    @DisplayName("GET /api/reportes - Debe ser público y permitir acceso anónimo (HTTP 200 OK)")
    void getReportesDebeSerPublico() throws Exception {
        when(reporteService.listarTodos()).thenReturn(List.of(crearRespuestaEjemplo(1L, EstadoReporte.PENDIENTE)));

        mockMvc.perform(get("/api/reportes"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/reportes - Debe permitir registrar incidencia de forma anónima (HTTP 201 Created)")
    void postReportesDebeSerPublico() throws Exception {
        String json = """
                {
                    "aulaId": "A-101",
                    "tipoProblema": "TECNOLOGICO",
                    "descripcion": "Proyector no enciende",
                    "prioridad": "ALTA"
                }
                """;

        when(reporteService.crearReporte(any(CrearReporteDTO.class)))
                .thenReturn(crearRespuestaEjemplo(1L, EstadoReporte.PENDIENTE));

        mockMvc.perform(post("/api/reportes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("PUT /api/reportes/{id} - Debe rechazar actualización sin credenciales (HTTP 401 Unauthorized)")
    void putReportesSinAutenticacionDebeRetornar401() throws Exception {
        String json = """
                {
                    "descripcion": "Atendido",
                    "tipoProblema": "TECNOLOGICO",
                    "prioridad": "ALTA",
                    "estado": "RESUELTO"
                }
                """;

        mockMvc.perform(put("/api/reportes/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "alumno", roles = {"ALUMNO"})
    @DisplayName("PUT /api/reportes/{id} - Debe denegar acceso a rol no autorizado como ALUMNO (HTTP 403 Forbidden)")
    void putReportesConRolAlumnoDebeRetornar403() throws Exception {
        String json = """
                {
                    "descripcion": "Intento de cierre",
                    "tipoProblema": "TECNOLOGICO",
                    "prioridad": "ALTA",
                    "estado": "RESUELTO"
                }
                """;

        mockMvc.perform(put("/api/reportes/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "tecnico", roles = {"TECNICO"})
    @DisplayName("PUT /api/reportes/{id} - Debe permitir acceso a rol TECNICO (HTTP 200 OK)")
    void putReportesConRolTecnicoDebePermitirAcceso() throws Exception {
        String json = """
                {
                    "descripcion": "Revisado por soporte",
                    "tipoProblema": "TECNOLOGICO",
                    "prioridad": "MEDIA",
                    "estado": "EN_ATENCION"
                }
                """;

        when(reporteService.actualizarReporte(eq(1L), any(ActualizarReporteDTO.class)))
                .thenReturn(crearRespuestaEjemplo(1L, EstadoReporte.EN_ATENCION));

        mockMvc.perform(put("/api/reportes/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    @DisplayName("PUT /api/reportes/{id} - Debe permitir acceso a rol ADMIN (HTTP 200 OK)")
    void putReportesConRolAdminDebePermitirAcceso() throws Exception {
        String json = """
                {
                    "descripcion": "Incidencia resuelta",
                    "tipoProblema": "TECNOLOGICO",
                    "prioridad": "BAJA",
                    "estado": "RESUELTO"
                }
                """;

        when(reporteService.actualizarReporte(eq(1L), any(ActualizarReporteDTO.class)))
                .thenReturn(crearRespuestaEjemplo(1L, EstadoReporte.RESUELTO));

        mockMvc.perform(put("/api/reportes/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("PUT /api/reportes/{id} - Debe permitir acceso mediante cabecera Authorization con token JWT válido de TECNICO (HTTP 200 OK)")
    void putReportesConTokenJwtBearerValidoDebePermitirAcceso() throws Exception {
        String token = jwtTokenProvider.generateToken("tecnico", List.of("ROLE_TECNICO"));
        String json = """
                {
                    "descripcion": "Atendido con token JWT",
                    "tipoProblema": "TECNOLOGICO",
                    "prioridad": "MEDIA",
                    "estado": "EN_ATENCION"
                }
                """;

        when(reporteService.actualizarReporte(eq(1L), any(ActualizarReporteDTO.class)))
                .thenReturn(crearRespuestaEjemplo(1L, EstadoReporte.EN_ATENCION));

        mockMvc.perform(put("/api/reportes/1")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("PUT /api/reportes/{id} - Debe rechazar acceso mediante token JWT con rol no autorizado ALUMNO (HTTP 403 Forbidden)")
    void putReportesConTokenJwtAlumnoDebeRetornar403() throws Exception {
        String token = jwtTokenProvider.generateToken("alumno", List.of("ROLE_ALUMNO"));
        String json = """
                {
                    "descripcion": "Intento de cierre con token alumno",
                    "tipoProblema": "TECNOLOGICO",
                    "prioridad": "ALTA",
                    "estado": "RESUELTO"
                }
                """;

        mockMvc.perform(put("/api/reportes/1")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("PUT /api/reportes/{id} - Debe rechazar acceso mediante token JWT inválido o adulterado (HTTP 401 Unauthorized)")
    void putReportesConTokenJwtInvalidoDebeRetornar401() throws Exception {
        String json = """
                {
                    "descripcion": "Intento con token corrupto",
                    "tipoProblema": "TECNOLOGICO",
                    "prioridad": "ALTA",
                    "estado": "RESUELTO"
                }
                """;

        mockMvc.perform(put("/api/reportes/1")
                        .header("Authorization", "Bearer tokenInvalidoFalso123")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isUnauthorized());
    }
}

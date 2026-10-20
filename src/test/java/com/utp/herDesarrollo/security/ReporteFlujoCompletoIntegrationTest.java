package com.utp.herDesarrollo.security;

import com.jayway.jsonpath.JsonPath;
import com.utp.herDesarrollo.aulas.model.Aula;
import com.utp.herDesarrollo.aulas.repository.AulaRepository;
import com.utp.herDesarrollo.reportes.domain.model.EstadoReporte;
import com.utp.herDesarrollo.reportes.domain.model.Prioridad;
import com.utp.herDesarrollo.reportes.domain.model.Reporte;
import com.utp.herDesarrollo.reportes.domain.repository.ReporteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.util.Optional;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Pruebas integrales de flujo completo (End-to-End) para el Módulo de Reportes.
 * Semana 10:
 * Valida de extremo a extremo:
 * 1. Acceso público a consulta y registro en PostgreSQL / H2.
 * 2. Bloqueo de mutación no autenticada y por roles insuficientes (ALUMNO).
 * 3. Autenticación técnica mediante POST /api/auth/login para emisión de token JWT.
 * 4. Actualización exitosa portando cabecera Authorization: Bearer <token>.
 * 5. Consistencia de la persistencia relacional con consultas JPQL avanzadas.
 */
@SpringBootTest
@Transactional
@DisplayName("Pruebas Integrales de Seguridad, JPA y JWT - Flujo Completo (Semana 10)")
class ReporteFlujoCompletoIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private ReporteRepository reporteRepository;

    @Autowired
    private AulaRepository aulaRepository;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        if (!aulaRepository.existsByCodigo("LAB-102")) {
            aulaRepository.save(new Aula(null, "LAB-102", "Pabellón Laboratorios", 30, "Disponible"));
        }
        if (!aulaRepository.existsByCodigo("P-301")) {
            aulaRepository.save(new Aula(null, "P-301", "Pabellón Principal", 40, "Disponible"));
        }
    }

    @Test
    @DisplayName("Debe ejecutar flujo integral: Registro público -> Intento no autorizado (401/403) -> Login JWT -> Resolución técnica -> Persistencia JPA")
    void debeEjecutarFlujoCompletoDeSeguridadPersistenciaYResolucionConJwt() throws Exception {
        // -------------------------------------------------------------
        // PASO 1: Consulta pública inicial de reportes
        // -------------------------------------------------------------
        mockMvc.perform(get("/api/reportes"))
                .andExpect(status().isOk());

        // -------------------------------------------------------------
        // PASO 2: Registro público de nueva incidencia sin credenciales
        // -------------------------------------------------------------
        String nuevoReporteJson = """
                {
                    "aulaId": "LAB-102",
                    "tipoProblema": "TECNOLOGICO",
                    "descripcion": "Computadora docente no enciende",
                    "prioridad": "ALTA"
                }
                """;

        MvcResult createResult = mockMvc.perform(post("/api/reportes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(nuevoReporteJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.aulaId", is("LAB-102")))
                .andExpect(jsonPath("$.estado", is("PENDIENTE")))
                .andReturn();

        Number reporteIdNum = JsonPath.read(createResult.getResponse().getContentAsString(), "$.id");
        Long reporteId = reporteIdNum.longValue();

        // Validar persistencia real en el repositorio JPA
        Optional<Reporte> reporteGuardado = reporteRepository.findById(reporteId);
        assertTrue(reporteGuardado.isPresent());
        assertEquals(EstadoReporte.PENDIENTE, reporteGuardado.get().getEstado());
        assertEquals("LAB-102", reporteGuardado.get().getAulaId());

        // -------------------------------------------------------------
        // PASO 3: Intento de actualización sin cabecera de autenticación (debe retornar 401)
        // -------------------------------------------------------------
        String intentoModificacionJson = """
                {
                    "descripcion": "Intento no autorizado de cierre",
                    "tipoProblema": "TECNOLOGICO",
                    "prioridad": "ALTA",
                    "estado": "RESUELTO"
                }
                """;

        mockMvc.perform(put("/api/reportes/" + reporteId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(intentoModificacionJson))
                .andExpect(status().isUnauthorized());

        // -------------------------------------------------------------
        // PASO 4: Intento de actualización con token de rol no autorizado ALUMNO (debe retornar 403)
        // -------------------------------------------------------------
        String loginAlumnoJson = """
                {
                    "username": "alumno",
                    "password": "alumno123"
                }
                """;

        MvcResult loginAlumnoResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginAlumnoJson))
                .andExpect(status().isOk())
                .andReturn();

        String tokenAlumno = JsonPath.read(loginAlumnoResult.getResponse().getContentAsString(), "$.token");
        assertNotNull(tokenAlumno);

        mockMvc.perform(put("/api/reportes/" + reporteId)
                        .header("Authorization", "Bearer " + tokenAlumno)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(intentoModificacionJson))
                .andExpect(status().isForbidden());

        // -------------------------------------------------------------
        // PASO 5: Autenticación del personal técnico para expedición de JWT
        // -------------------------------------------------------------
        String loginTecnicoJson = """
                {
                    "username": "tecnico",
                    "password": "tecnico123"
                }
                """;

        MvcResult loginTecnicoResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginTecnicoJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.tipo", is("Bearer")))
                .andReturn();

        String tokenTecnico = JsonPath.read(loginTecnicoResult.getResponse().getContentAsString(), "$.token");
        assertNotNull(tokenTecnico);

        // -------------------------------------------------------------
        // PASO 6: Modificación autorizada portando cabecera Authorization: Bearer <token>
        // -------------------------------------------------------------
        String actualizacionValidaJson = """
                {
                    "descripcion": "Fuente de poder reemplazada y equipo operativo",
                    "tipoProblema": "TECNOLOGICO",
                    "prioridad": "MEDIA",
                    "estado": "RESUELTO"
                }
                """;

        mockMvc.perform(put("/api/reportes/" + reporteId)
                        .header("Authorization", "Bearer " + tokenTecnico)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(actualizacionValidaJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(reporteId.intValue())))
                .andExpect(jsonPath("$.estado", is("RESUELTO")))
                .andExpect(jsonPath("$.descripcion", is("Fuente de poder reemplazada y equipo operativo")));

        // Validar que el cambio se consolidó en la base de datos
        Reporte reporteActualizado = reporteRepository.findById(reporteId).orElseThrow();
        assertEquals(EstadoReporte.RESUELTO, reporteActualizado.getEstado());
        assertEquals(Prioridad.MEDIA, reporteActualizado.getPrioridad());

        // -------------------------------------------------------------
        // PASO 7: Filtrado JPQL avanzado para verificar persistencia de estado
        // -------------------------------------------------------------
        mockMvc.perform(get("/api/reportes")
                        .param("aulaId", "lab-102")
                        .param("prioridad", "MEDIA"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[0].aulaId", is("LAB-102")))
                .andExpect(jsonPath("$[0].estado", is("RESUELTO")));
    }

    @Test
    @DisplayName("Debe permitir actualización de incidencia por rol ADMIN con token JWT")
    void debePermitirModificacionPorAdminConJwt() throws Exception {
        Aula aulaP301 = aulaRepository.findByCodigo("P-301").orElseThrow();
        Reporte nuevo = reporteRepository.save(new Reporte(
                aulaP301,
                com.utp.herDesarrollo.reportes.domain.model.TipoProblema.MOBILIARIO,
                "Silla rota",
                Prioridad.BAJA,
                EstadoReporte.PENDIENTE,
                java.time.LocalDateTime.now()
        ));

        String loginAdminJson = """
                {
                    "username": "admin",
                    "password": "admin123"
                }
                """;

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginAdminJson))
                .andExpect(status().isOk())
                .andReturn();

        String tokenAdmin = JsonPath.read(loginResult.getResponse().getContentAsString(), "$.token");

        String updateJson = """
                {
                    "descripcion": "Mobiliario reparado por supervisión",
                    "tipoProblema": "MOBILIARIO",
                    "prioridad": "BAJA",
                    "estado": "RESUELTO"
                }
                """;

        mockMvc.perform(put("/api/reportes/" + nuevo.getId())
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado", is("RESUELTO")));
    }

    @Test
    @DisplayName("Debe rechazar actualización con cabecera Authorization malformada o token espurio (HTTP 401)")
    void debeRechazarTokenMalformado() throws Exception {
        String updateJson = """
                {
                    "descripcion": "Intento corrupto",
                    "tipoProblema": "TECNOLOGICO",
                    "prioridad": "ALTA",
                    "estado": "RESUELTO"
                }
                """;

        mockMvc.perform(put("/api/reportes/1")
                        .header("Authorization", "Bearer tokenCompletamenteInvalido12345")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateJson))
                .andExpect(status().isUnauthorized());
    }
}

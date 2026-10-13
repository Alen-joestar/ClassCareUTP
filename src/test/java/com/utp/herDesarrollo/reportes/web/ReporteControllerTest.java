package com.utp.herDesarrollo.reportes.web;

import com.utp.herDesarrollo.reportes.application.dto.ActualizarReporteDTO;
import com.utp.herDesarrollo.reportes.application.dto.CrearReporteDTO;
import com.utp.herDesarrollo.reportes.application.dto.ReporteResponseDTO;
import com.utp.herDesarrollo.reportes.application.exception.RecursoNoEncontradoException;
import com.utp.herDesarrollo.reportes.application.exception.ReglaNegocioException;
import com.utp.herDesarrollo.reportes.application.service.ReporteService;
import com.utp.herDesarrollo.reportes.domain.model.EstadoReporte;
import com.utp.herDesarrollo.reportes.domain.model.Prioridad;
import com.utp.herDesarrollo.reportes.domain.model.TipoProblema;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Pruebas REST - ReporteController con MockMvc (TDD)")
class ReporteControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ReporteService reporteService;

    @InjectMocks
    private ReporteController reporteController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(reporteController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    private ReporteResponseDTO crearRespuestaEjemplo(Long id, String aulaId, String descripcion, EstadoReporte estado) {
        return new ReporteResponseDTO(
                id,
                aulaId,
                TipoProblema.TECNOLOGICO,
                descripcion,
                Prioridad.ALTA,
                estado,
                LocalDateTime.now()
        );
    }

    @Test
    @DisplayName("GET /api/reportes - Debe retornar lista de incidencias y HTTP 200 OK")
    void debeListarTodosLosReportesYRetornar200() throws Exception {
        List<ReporteResponseDTO> lista = List.of(
                crearRespuestaEjemplo(1L, "A-101", "Proyector no enciende", EstadoReporte.PENDIENTE),
                crearRespuestaEjemplo(2L, "B-202", "Foco parpadea", EstadoReporte.EN_ATENCION)
        );

        when(reporteService.listarTodos()).thenReturn(lista);

        mockMvc.perform(get("/api/reportes"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id", is(1)))
                .andExpect(jsonPath("$[0].aulaId", is("A-101")))
                .andExpect(jsonPath("$[1].id", is(2)))
                .andExpect(jsonPath("$[1].aulaId", is("B-202")));
    }

    @Test
    @DisplayName("GET /api/reportes/{id} - Debe retornar reporte por ID y HTTP 200 OK")
    void debeBuscarReportePorIdYRetornar200() throws Exception {
        ReporteResponseDTO reporte = crearRespuestaEjemplo(1L, "A-101", "Proyector no enciende", EstadoReporte.PENDIENTE);

        when(reporteService.buscarPorId(1L)).thenReturn(reporte);

        mockMvc.perform(get("/api/reportes/1"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.aulaId", is("A-101")))
                .andExpect(jsonPath("$.descripcion", is("Proyector no enciende")))
                .andExpect(jsonPath("$.estado", is("PENDIENTE")));
    }

    @Test
    @DisplayName("GET /api/reportes/{id} - Debe retornar HTTP 404 Not Found cuando el reporte no existe")
    void debeRetornar404CuandoIdNoExiste() throws Exception {
        when(reporteService.buscarPorId(999L)).thenThrow(new RecursoNoEncontradoException("No se encontró el reporte con ID: 999"));

        mockMvc.perform(get("/api/reportes/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.error", is("Not Found")))
                .andExpect(jsonPath("$.message", containsString("No se encontró el reporte con ID: 999")));
    }

    @Test
    @DisplayName("GET /api/reportes/aula/{aulaId} - Debe retornar incidencias filtradas por aula y HTTP 200 OK")
    void debeListarPorAulaYRetornar200() throws Exception {
        List<ReporteResponseDTO> lista = List.of(
                crearRespuestaEjemplo(1L, "A-101", "Proyector no enciende", EstadoReporte.PENDIENTE)
        );

        when(reporteService.listarPorAulaId("A-101")).thenReturn(lista);

        mockMvc.perform(get("/api/reportes/aula/A-101"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].aulaId", is("A-101")));
    }

    @Test
    @DisplayName("POST /api/reportes - Debe registrar incidencia y retornar HTTP 201 Created")
    void debeCrearReporteYRetornar201() throws Exception {
        String requestJson = """
                {
                    "aulaId": "A-101",
                    "tipoProblema": "TECNOLOGICO",
                    "descripcion": "Proyector no enciende",
                    "prioridad": "ALTA"
                }
                """;
        ReporteResponseDTO responseDTO = crearRespuestaEjemplo(1L, "A-101", "Proyector no enciende", EstadoReporte.PENDIENTE);

        when(reporteService.crearReporte(any(CrearReporteDTO.class))).thenReturn(responseDTO);

        mockMvc.perform(post("/api/reportes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.aulaId", is("A-101")))
                .andExpect(jsonPath("$.estado", is("PENDIENTE")));
    }

    @Test
    @DisplayName("POST /api/reportes - Debe retornar HTTP 400 Bad Request ante datos inválidos")
    void debeRetornar400CuandoHayErrorDeValidacion() throws Exception {
        String invalidJson = """
                {
                    "aulaId": "",
                    "tipoProblema": "TECNOLOGICO",
                    "descripcion": "",
                    "prioridad": null
                }
                """;
        when(reporteService.crearReporte(any(CrearReporteDTO.class)))
                .thenThrow(new ReglaNegocioException("El código o identificador del aula es obligatorio"));

        mockMvc.perform(post("/api/reportes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.error", is("Bad Request")))
                .andExpect(jsonPath("$.message", containsString("El código o identificador del aula es obligatorio")));
    }

    @Test
    @DisplayName("PUT /api/reportes/{id} - Debe actualizar estado/detalles y retornar HTTP 200 OK")
    void debeActualizarReporteYRetornar200() throws Exception {
        String updateJson = """
                {
                    "descripcion": "Proyector reemplazado",
                    "tipoProblema": "TECNOLOGICO",
                    "prioridad": "MEDIA",
                    "estado": "RESUELTO"
                }
                """;
        ReporteResponseDTO updatedResponse = crearRespuestaEjemplo(1L, "A-101", "Proyector reemplazado", EstadoReporte.RESUELTO);

        when(reporteService.actualizarReporte(eq(1L), any(ActualizarReporteDTO.class))).thenReturn(updatedResponse);

        mockMvc.perform(put("/api/reportes/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.descripcion", is("Proyector reemplazado")))
                .andExpect(jsonPath("$.estado", is("RESUELTO")));
    }

    @Test
    @DisplayName("GET /api/reportes?aulaId=A-101&prioridad=ALTA - Debe retornar incidencias filtradas y HTTP 200 OK")
    void debeListarConFiltrosQueryParamsYRetornar200() throws Exception {
        List<ReporteResponseDTO> lista = List.of(
                crearRespuestaEjemplo(1L, "A-101", "Proyector no enciende", EstadoReporte.PENDIENTE)
        );

        when(reporteService.listarConFiltros("A-101", Prioridad.ALTA)).thenReturn(lista);

        mockMvc.perform(get("/api/reportes")
                        .param("aulaId", "A-101")
                        .param("prioridad", "ALTA"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].aulaId", is("A-101")))
                .andExpect(jsonPath("$[0].prioridad", is("ALTA")));
    }

    @Test
    @DisplayName("GET /api/reportes?prioridad=ALTA - Debe retornar incidencias filtradas solo por prioridad y HTTP 200 OK")
    void debeListarConFiltroPrioridadYRetornar200() throws Exception {
        List<ReporteResponseDTO> lista = List.of(
                crearRespuestaEjemplo(1L, "B-202", "Foco roto", EstadoReporte.PENDIENTE)
        );

        when(reporteService.listarConFiltros(null, Prioridad.ALTA)).thenReturn(lista);

        mockMvc.perform(get("/api/reportes")
                        .param("prioridad", "ALTA"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].aulaId", is("B-202")));
    }
}

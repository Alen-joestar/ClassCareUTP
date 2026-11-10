package com.utp.herDesarrollo.atenciones.web;

import com.utp.herDesarrollo.atenciones.controller.AtencionController;
import com.utp.herDesarrollo.atenciones.dto.AtencionResponseDTO;
import com.utp.herDesarrollo.atenciones.dto.CrearAtencionDTO;
import com.utp.herDesarrollo.atenciones.dto.ActualizarEstadoAtencionDTO;
import com.utp.herDesarrollo.atenciones.exception.AtencionNoEncontradaException;
import com.utp.herDesarrollo.atenciones.exception.ReglaNegocioAtencionException;
import com.utp.herDesarrollo.atenciones.model.EstadoAtencion;
import com.utp.herDesarrollo.atenciones.service.AtencionService;
import com.utp.herDesarrollo.reportes.web.GlobalExceptionHandler;
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
@DisplayName("Pruebas REST - AtencionController con MockMvc")
class AtencionControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AtencionService atencionService;

    @InjectMocks
    private AtencionController atencionController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(atencionController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    private AtencionResponseDTO respuestaEjemplo(Long id, Long reporteId,
                                                  String tecnico, EstadoAtencion estado) {
        return new AtencionResponseDTO(id, reporteId, tecnico, estado,
                "Observación de prueba", LocalDateTime.now(), null);
    }

    @Test
    @DisplayName("GET /api/atenciones - Debe retornar lista y HTTP 200 OK")
    void debeListarTodasLasAtenciones() throws Exception {
        List<AtencionResponseDTO> lista = List.of(
                respuestaEjemplo(1L, 10L, "tecnico01", EstadoAtencion.PENDIENTE),
                respuestaEjemplo(2L, 11L, "tecnico02", EstadoAtencion.EN_ATENCION)
        );

        when(atencionService.listarTodas()).thenReturn(lista);

        mockMvc.perform(get("/api/atenciones"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id", is(1)))
                .andExpect(jsonPath("$[0].tecnicoEncargado", is("tecnico01")))
                .andExpect(jsonPath("$[1].estado", is("EN_ATENCION")));
    }

    @Test
    @DisplayName("GET /api/atenciones?estado=PENDIENTE - Debe filtrar por estado y HTTP 200 OK")
    void debeListarAtencionesFiltradaPorEstado() throws Exception {
        List<AtencionResponseDTO> lista = List.of(
                respuestaEjemplo(1L, 10L, "tecnico01", EstadoAtencion.PENDIENTE)
        );

        when(atencionService.listarPorEstado(EstadoAtencion.PENDIENTE)).thenReturn(lista);

        mockMvc.perform(get("/api/atenciones").param("estado", "PENDIENTE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].estado", is("PENDIENTE")));
    }

    @Test
    @DisplayName("GET /api/atenciones/{id} - Debe retornar atención por ID y HTTP 200 OK")
    void debeBuscarAtencionPorId() throws Exception {
        when(atencionService.buscarPorId(1L))
                .thenReturn(respuestaEjemplo(1L, 10L, "tecnico01", EstadoAtencion.PENDIENTE));

        mockMvc.perform(get("/api/atenciones/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.estado", is("PENDIENTE")));
    }

    @Test
    @DisplayName("GET /api/atenciones/{id} - Debe retornar HTTP 404 si la atención no existe")
    void debeRetornar404SiAtencionNoExiste() throws Exception {
        when(atencionService.buscarPorId(999L))
                .thenThrow(new AtencionNoEncontradaException("No se encontró la atención con ID: 999"));

        mockMvc.perform(get("/api/atenciones/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.message", containsString("No se encontró la atención con ID: 999")));
    }

    @Test
    @DisplayName("GET /api/atenciones/reporte/{reporteId} - Debe retornar atenciones por reporte y HTTP 200 OK")
    void debeListarAtencionesPorReporte() throws Exception {
        List<AtencionResponseDTO> lista = List.of(
                respuestaEjemplo(1L, 10L, "tecnico01", EstadoAtencion.PENDIENTE)
        );

        when(atencionService.listarPorReporte(10L)).thenReturn(lista);

        mockMvc.perform(get("/api/atenciones/reporte/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].reporteId", is(10)));
    }

    @Test
    @DisplayName("POST /api/atenciones - Debe registrar atención y retornar HTTP 201 Created")
    void debeCrearAtencionYRetornar201() throws Exception {
        String requestJson = """
                {
                    "reporteId": 10,
                    "tecnicoEncargado": "tecnico01",
                    "observaciones": "Caso recibido"
                }
                """;

        when(atencionService.crearAtencion(any(CrearAtencionDTO.class)))
                .thenReturn(respuestaEjemplo(1L, 10L, "tecnico01", EstadoAtencion.PENDIENTE));

        mockMvc.perform(post("/api/atenciones")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.estado", is("PENDIENTE")))
                .andExpect(jsonPath("$.tecnicoEncargado", is("tecnico01")));
    }

    @Test
    @DisplayName("POST /api/atenciones - Debe retornar HTTP 400 si el técnico está vacío")
    void debeRetornar400SiTecnicoEstaVacio() throws Exception {
        String requestJson = """
                {
                    "reporteId": 10,
                    "tecnicoEncargado": ""
                }
                """;

        when(atencionService.crearAtencion(any(CrearAtencionDTO.class)))
                .thenThrow(new ReglaNegocioAtencionException("El nombre del técnico encargado es obligatorio"));

        mockMvc.perform(post("/api/atenciones")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.message", containsString("técnico encargado es obligatorio")));
    }

    @Test
    @DisplayName("PUT /api/atenciones/{id}/estado - Debe actualizar estado y retornar HTTP 200 OK")
    void debeActualizarEstadoYRetornar200() throws Exception {
        String updateJson = """
                {
                    "nuevoEstado": "EN_ATENCION",
                    "observaciones": "Técnico en sitio",
                    "solicitadoPor": "tecnico01"
                }
                """;

        when(atencionService.actualizarEstado(eq(1L), any(ActualizarEstadoAtencionDTO.class)))
                .thenReturn(respuestaEjemplo(1L, 10L, "tecnico01", EstadoAtencion.EN_ATENCION));

        mockMvc.perform(put("/api/atenciones/1/estado")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.estado", is("EN_ATENCION")));
    }

    @Test
    @DisplayName("PUT /api/atenciones/{id}/estado - Debe retornar HTTP 400 ante transición inválida")
    void debeRetornar400AnteTransicionInvalida() throws Exception {
        String updateJson = """
                {
                    "nuevoEstado": "RESUELTO",
                    "solicitadoPor": "tecnico01"
                }
                """;

        when(atencionService.actualizarEstado(eq(1L), any(ActualizarEstadoAtencionDTO.class)))
                .thenThrow(new ReglaNegocioAtencionException(
                        "Transición inválida: no se puede pasar de 'PENDIENTE' a 'RESUELTO'"));

        mockMvc.perform(put("/api/atenciones/1/estado")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.message", containsString("Transición inválida")));
    }
}

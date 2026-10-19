package com.utp.herDesarrollo.atenciones.service;

import com.utp.herDesarrollo.atenciones.dto.ActualizarEstadoAtencionDTO;
import com.utp.herDesarrollo.atenciones.dto.AtencionResponseDTO;
import com.utp.herDesarrollo.atenciones.dto.CrearAtencionDTO;
import com.utp.herDesarrollo.atenciones.exception.AtencionNoEncontradaException;
import com.utp.herDesarrollo.atenciones.exception.ReglaNegocioAtencionException;
import com.utp.herDesarrollo.atenciones.model.Atencion;
import com.utp.herDesarrollo.atenciones.model.EstadoAtencion;
import com.utp.herDesarrollo.atenciones.repository.AtencionRepository;
import com.utp.herDesarrollo.reportes.application.exception.RecursoNoEncontradoException;
import com.utp.herDesarrollo.reportes.domain.model.EstadoReporte;
import com.utp.herDesarrollo.reportes.domain.model.Reporte;
import com.utp.herDesarrollo.reportes.domain.repository.ReporteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Pruebas unitarias - AtencionServiceImpl")
class AtencionServiceImplTest {

    @Mock
    private AtencionRepository atencionRepository;

    @Mock
    private ReporteRepository reporteRepository;

    @InjectMocks
    private AtencionServiceImpl service;

    private Reporte reporteEjemplo;
    private Atencion atencionEjemplo;

    @BeforeEach
    void setUp() {
        reporteEjemplo = new Reporte();
        reporteEjemplo.setId(1L);

        atencionEjemplo = new Atencion(
                reporteEjemplo, "tecnico01", EstadoAtencion.PENDIENTE,
                "Caso registrado", LocalDateTime.now()
        );
        atencionEjemplo.setId(10L);
    }

    @Test
    @DisplayName("Debe crear atención con estado PENDIENTE cuando los datos son válidos")
    void debeCrearAtencionConEstadoPendiente() {
        CrearAtencionDTO dto = new CrearAtencionDTO(1L, "tecnico01", "Caso registrado");

        when(reporteRepository.findById(1L)).thenReturn(Optional.of(reporteEjemplo));
        when(atencionRepository.countByReporte_IdAndEstadoNot(1L, EstadoAtencion.RESUELTO)).thenReturn(0L);
        when(atencionRepository.save(any(Atencion.class))).thenReturn(atencionEjemplo);

        AtencionResponseDTO resultado = service.crearAtencion(dto);

        assertNotNull(resultado);
        assertEquals(EstadoAtencion.PENDIENTE, resultado.getEstado());
        assertEquals("tecnico01", resultado.getTecnicoEncargado());
        verify(atencionRepository, times(1)).save(any(Atencion.class));
    }

    @Test
    @DisplayName("Debe lanzar excepción si el reporte no existe al crear atención")
    void debeLanzarExcepcionSiReporteNoExiste() {
        CrearAtencionDTO dto = new CrearAtencionDTO(99L, "tecnico01", null);

        when(reporteRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RecursoNoEncontradoException.class, () -> service.crearAtencion(dto));
        verify(atencionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Debe rechazar crear atención si el reporte ya tiene una atención activa")
    void debeRechazarAtencionDuplicadaActiva() {
        CrearAtencionDTO dto = new CrearAtencionDTO(1L, "tecnico01", null);

        when(reporteRepository.findById(1L)).thenReturn(Optional.of(reporteEjemplo));
        when(atencionRepository.countByReporte_IdAndEstadoNot(1L, EstadoAtencion.RESUELTO)).thenReturn(1L);

        assertThrows(ReglaNegocioAtencionException.class, () -> service.crearAtencion(dto));
    }

    @Test
    @DisplayName("Debe lanzar excepción si el técnico encargado está vacío")
    void debeLanzarExcepcionSiTecnicoEstaVacio() {
        CrearAtencionDTO dto = new CrearAtencionDTO(1L, "   ", null);

        assertThrows(ReglaNegocioAtencionException.class, () -> service.crearAtencion(dto));
    }

    @Test
    @DisplayName("Debe listar todas las atenciones registradas")
    void debeListarTodasLasAtenciones() {
        when(atencionRepository.findAll()).thenReturn(List.of(atencionEjemplo));

        List<AtencionResponseDTO> resultado = service.listarTodas();

        assertEquals(1, resultado.size());
    }

    @Test
    @DisplayName("Debe filtrar atenciones por estado PENDIENTE")
    void debeListarPorEstadoPendiente() {
        when(atencionRepository.findByEstado(EstadoAtencion.PENDIENTE))
                .thenReturn(List.of(atencionEjemplo));

        List<AtencionResponseDTO> resultado = service.listarPorEstado(EstadoAtencion.PENDIENTE);

        assertEquals(1, resultado.size());
        assertEquals(EstadoAtencion.PENDIENTE, resultado.get(0).getEstado());
    }

    @Test
    @DisplayName("Debe transicionar correctamente de PENDIENTE a EN_ATENCION")
    void debeTransicionarDePendienteAEnAtencion() {
        ActualizarEstadoAtencionDTO dto = new ActualizarEstadoAtencionDTO(
                EstadoAtencion.EN_ATENCION, "Técnico revisando el equipo", "tecnico01"
        );

        Atencion actualizada = new Atencion(reporteEjemplo, "tecnico01",
                EstadoAtencion.EN_ATENCION, "Técnico revisando el equipo", LocalDateTime.now());
        actualizada.setId(10L);

        when(atencionRepository.findById(10L)).thenReturn(Optional.of(atencionEjemplo));
        when(atencionRepository.save(any(Atencion.class))).thenReturn(actualizada);

        AtencionResponseDTO resultado = service.actualizarEstado(10L, dto);

        assertEquals(EstadoAtencion.EN_ATENCION, resultado.getEstado());
    }

    @Test
    @DisplayName("Debe transicionar correctamente de EN_ATENCION a RESUELTO y registrar fecha de resolución")
    void debeTransicionarDeEnAtencionAResuelto() {
        atencionEjemplo.setEstado(EstadoAtencion.EN_ATENCION);
        ActualizarEstadoAtencionDTO dto = new ActualizarEstadoAtencionDTO(
                EstadoAtencion.RESUELTO, "Equipo reemplazado", "tecnico01"
        );

        Atencion resuelta = new Atencion(reporteEjemplo, "tecnico01",
                EstadoAtencion.RESUELTO, "Equipo reemplazado", LocalDateTime.now());
        resuelta.setId(10L);
        resuelta.setFechaResolucion(LocalDateTime.now());

        when(atencionRepository.findById(10L)).thenReturn(Optional.of(atencionEjemplo));
        when(atencionRepository.save(any(Atencion.class))).thenReturn(resuelta);

        AtencionResponseDTO resultado = service.actualizarEstado(10L, dto);

        assertEquals(EstadoAtencion.RESUELTO, resultado.getEstado());
        assertNotNull(resultado.getFechaResolucion());
    }

    @Test
    @DisplayName("Debe rechazar transición inválida de PENDIENTE directo a RESUELTO")
    void debeRechazarTransicionInvalidaDePendienteAResuelto() {
        ActualizarEstadoAtencionDTO dto = new ActualizarEstadoAtencionDTO(
                EstadoAtencion.RESUELTO, null, "tecnico01"
        );

        when(atencionRepository.findById(10L)).thenReturn(Optional.of(atencionEjemplo));

        assertThrows(ReglaNegocioAtencionException.class,
                () -> service.actualizarEstado(10L, dto));
    }

    @Test
    @DisplayName("Debe rechazar actualización de estado si el técnico no es el encargado")
    void debeRechazarActualizacionDeTecnicoNoAutorizado() {
        ActualizarEstadoAtencionDTO dto = new ActualizarEstadoAtencionDTO(
                EstadoAtencion.EN_ATENCION, null, "otroTecnico"
        );

        when(atencionRepository.findById(10L)).thenReturn(Optional.of(atencionEjemplo));

        assertThrows(ReglaNegocioAtencionException.class,
                () -> service.actualizarEstado(10L, dto));
    }

    @Test
    @DisplayName("Debe lanzar excepción si la atención a actualizar no existe")
    void debeLanzarExcepcionSiAtencionNoExiste() {
        ActualizarEstadoAtencionDTO dto = new ActualizarEstadoAtencionDTO(
                EstadoAtencion.EN_ATENCION, null, "tecnico01"
        );

        when(atencionRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(AtencionNoEncontradaException.class,
                () -> service.actualizarEstado(999L, dto));
    }

    @Test
    @DisplayName("Debe lanzar excepción si buscar atención por ID no existe")
    void debeLanzarExcepcionAlBuscarIdInexistente() {
        when(atencionRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(AtencionNoEncontradaException.class, () -> service.buscarPorId(999L));
    }
}

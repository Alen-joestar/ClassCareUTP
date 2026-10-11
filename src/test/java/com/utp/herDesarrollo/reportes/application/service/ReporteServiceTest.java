package com.utp.herDesarrollo.reportes.application.service;

import com.utp.herDesarrollo.reportes.application.dto.ActualizarReporteDTO;
import com.utp.herDesarrollo.reportes.application.dto.CrearReporteDTO;
import com.utp.herDesarrollo.reportes.application.dto.ReporteResponseDTO;
import com.utp.herDesarrollo.reportes.application.exception.RecursoNoEncontradoException;
import com.utp.herDesarrollo.reportes.application.exception.ReglaNegocioException;
import com.utp.herDesarrollo.reportes.application.service.impl.ReporteServiceImpl;
import com.utp.herDesarrollo.reportes.domain.model.EstadoReporte;
import com.utp.herDesarrollo.reportes.domain.model.Prioridad;
import com.utp.herDesarrollo.reportes.domain.model.Reporte;
import com.utp.herDesarrollo.reportes.domain.model.TipoProblema;
import com.utp.herDesarrollo.reportes.domain.repository.ReporteRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
@DisplayName("Pruebas Unitarias - ReporteService (TDD)")
class ReporteServiceTest {

    @Mock
    private ReporteRepository reporteRepository;

    @InjectMocks
    private ReporteServiceImpl reporteService;

    private CrearReporteDTO crearDTOValido() {
        return new CrearReporteDTO("A-101", TipoProblema.TECNOLOGICO, "Proyector apagado", Prioridad.ALTA);
    }

    @Test
    @DisplayName("Debe crear reporte con estado PENDIENTE y fecha actual por defecto")
    void debeCrearReporteConEstadoPendienteYFechaActual() {
        CrearReporteDTO dto = crearDTOValido();
        Reporte reporteSimulado = new Reporte(
                1L,
                "A-101",
                TipoProblema.TECNOLOGICO,
                "Proyector apagado",
                Prioridad.ALTA,
                EstadoReporte.PENDIENTE,
                LocalDateTime.now()
        );

        when(reporteRepository.save(any(Reporte.class))).thenReturn(reporteSimulado);

        ReporteResponseDTO respuesta = reporteService.crearReporte(dto);

        assertNotNull(respuesta);
        assertEquals(1L, respuesta.getId());
        assertEquals("A-101", respuesta.getAulaId());
        assertEquals(EstadoReporte.PENDIENTE, respuesta.getEstado());
        assertNotNull(respuesta.getFechaRegistro());

        ArgumentCaptor<Reporte> captor = ArgumentCaptor.forClass(Reporte.class);
        verify(reporteRepository).save(captor.capture());
        Reporte reporteEnviado = captor.getValue();
        assertEquals(EstadoReporte.PENDIENTE, reporteEnviado.getEstado());
        assertNotNull(reporteEnviado.getFechaRegistro());
    }

    @Test
    @DisplayName("Debe lanzar ReglaNegocioException si faltan datos requeridos al crear reporte")
    void debeLanzarExcepcionCuandoCamposSonInvalidos() {
        CrearReporteDTO dtoSinAula = new CrearReporteDTO("", TipoProblema.TECNOLOGICO, "Falla", Prioridad.MEDIA);
        assertThrows(ReglaNegocioException.class, () -> reporteService.crearReporte(dtoSinAula));

        CrearReporteDTO dtoSinDescripcion = new CrearReporteDTO("A-101", TipoProblema.TECNOLOGICO, "   ", Prioridad.MEDIA);
        assertThrows(ReglaNegocioException.class, () -> reporteService.crearReporte(dtoSinDescripcion));

        CrearReporteDTO dtoSinTipo = new CrearReporteDTO("A-101", null, "Falla", Prioridad.MEDIA);
        assertThrows(ReglaNegocioException.class, () -> reporteService.crearReporte(dtoSinTipo));

        assertThrows(ReglaNegocioException.class, () -> reporteService.crearReporte(null));
        verify(reporteRepository, never()).save(any());
    }

    @Test
    @DisplayName("Debe listar todos los reportes transformados a DTO")
    void debeListarTodosLosReportes() {
        List<Reporte> listaMock = List.of(
                new Reporte(1L, "A-101", TipoProblema.ELECTRICO, "Foco", Prioridad.BAJA, EstadoReporte.PENDIENTE, LocalDateTime.now()),
                new Reporte(2L, "B-201", TipoProblema.MOBILIARIO, "Silla", Prioridad.MEDIA, EstadoReporte.EN_ATENCION, LocalDateTime.now())
        );
        when(reporteRepository.findAll()).thenReturn(listaMock);

        List<ReporteResponseDTO> resultado = reporteService.listarTodos();

        assertEquals(2, resultado.size());
        assertEquals("A-101", resultado.get(0).getAulaId());
        assertEquals("B-201", resultado.get(1).getAulaId());
        verify(reporteRepository).findAll();
    }

    @Test
    @DisplayName("Debe buscar por ID y retornar DTO cuando existe")
    void debeBuscarPorIdExitosamente() {
        Reporte reporteMock = new Reporte(10L, "C-301", TipoProblema.INFRAESTRUCTURA, "Ventana rota", Prioridad.ALTA, EstadoReporte.PENDIENTE, LocalDateTime.now());
        when(reporteRepository.findById(10L)).thenReturn(Optional.of(reporteMock));

        ReporteResponseDTO resultado = reporteService.buscarPorId(10L);

        assertNotNull(resultado);
        assertEquals(10L, resultado.getId());
        assertEquals("C-301", resultado.getAulaId());
        assertEquals(TipoProblema.INFRAESTRUCTURA, resultado.getTipoProblema());
    }

    @Test
    @DisplayName("Debe lanzar RecursoNoEncontradoException cuando el ID no existe")
    void debeLanzarExcepcionCuandoIdNoExiste() {
        when(reporteRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RecursoNoEncontradoException.class, () -> reporteService.buscarPorId(99L));
    }

    @Test
    @DisplayName("Debe listar reportes filtrados por aulaId")
    void debeListarReportesPorAulaId() {
        List<Reporte> mockList = List.of(
                new Reporte(1L, "LAB-1", TipoProblema.TECNOLOGICO, "Mouse dañado", Prioridad.BAJA, EstadoReporte.PENDIENTE, LocalDateTime.now())
        );
        when(reporteRepository.findByAulaId("LAB-1")).thenReturn(mockList);

        List<ReporteResponseDTO> resultado = reporteService.listarPorAulaId("LAB-1");

        assertEquals(1, resultado.size());
        assertEquals("LAB-1", resultado.get(0).getAulaId());
        verify(reporteRepository).findByAulaId("LAB-1");
    }

    @Test
    @DisplayName("Debe actualizar estado y detalles de un reporte existente")
    void debeActualizarReporteExistente() {
        Reporte existente = new Reporte(1L, "A-101", TipoProblema.ELECTRICO, "Luz quemada", Prioridad.BAJA, EstadoReporte.PENDIENTE, LocalDateTime.now());
        when(reporteRepository.findById(1L)).thenReturn(Optional.of(existente));
        when(reporteRepository.save(any(Reporte.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ActualizarReporteDTO dtoActualizar = new ActualizarReporteDTO(
                "Luz cambiada por reflector LED",
                TipoProblema.ELECTRICO,
                Prioridad.MEDIA,
                EstadoReporte.RESUELTO
        );

        ReporteResponseDTO actualizado = reporteService.actualizarReporte(1L, dtoActualizar);

        assertEquals("Luz cambiada por reflector LED", actualizado.getDescripcion());
        assertEquals(EstadoReporte.RESUELTO, actualizado.getEstado());
        assertEquals(Prioridad.MEDIA, actualizado.getPrioridad());
        verify(reporteRepository).save(existente);
    }

    @Test
    @DisplayName("Debe lanzar RecursoNoEncontradoException al intentar actualizar un ID inexistente")
    void debeLanzarExcepcionAlActualizarReporteInexistente() {
        when(reporteRepository.findById(404L)).thenReturn(Optional.empty());

        ActualizarReporteDTO dto = new ActualizarReporteDTO("algo", TipoProblema.OTRO, Prioridad.BAJA, EstadoReporte.RESUELTO);
        assertThrows(RecursoNoEncontradoException.class, () -> reporteService.actualizarReporte(404L, dto));
        verify(reporteRepository, never()).save(any());
    }

    @Test
    @DisplayName("Debe listar con filtros combinando aula y prioridad")
    void debeListarConFiltrosPorAulaYPrioridad() {
        List<Reporte> listaMock = List.of(
                new Reporte(1L, "A-101", TipoProblema.TECNOLOGICO, "Proyector", Prioridad.ALTA, EstadoReporte.PENDIENTE, LocalDateTime.now())
        );
        when(reporteRepository.findByAulaIdAndPrioridad("A-101", Prioridad.ALTA)).thenReturn(listaMock);

        List<ReporteResponseDTO> resultado = reporteService.listarConFiltros("A-101", Prioridad.ALTA);

        assertEquals(1, resultado.size());
        assertEquals("A-101", resultado.get(0).getAulaId());
        assertEquals(Prioridad.ALTA, resultado.get(0).getPrioridad());
        verify(reporteRepository).findByAulaIdAndPrioridad("A-101", Prioridad.ALTA);
    }

    @Test
    @DisplayName("Debe listar con filtros filtrando únicamente por aula")
    void debeListarConFiltrosSoloPorAula() {
        List<Reporte> listaMock = List.of(
                new Reporte(1L, "B-202", TipoProblema.ELECTRICO, "Luz", Prioridad.MEDIA, EstadoReporte.PENDIENTE, LocalDateTime.now())
        );
        when(reporteRepository.findByAulaId("B-202")).thenReturn(listaMock);

        List<ReporteResponseDTO> resultado = reporteService.listarConFiltros("B-202", null);

        assertEquals(1, resultado.size());
        assertEquals("B-202", resultado.get(0).getAulaId());
        verify(reporteRepository).findByAulaId("B-202");
    }

    @Test
    @DisplayName("Debe listar con filtros filtrando únicamente por prioridad")
    void debeListarConFiltrosSoloPorPrioridad() {
        List<Reporte> listaMock = List.of(
                new Reporte(1L, "C-303", TipoProblema.MOBILIARIO, "Mesa", Prioridad.ALTA, EstadoReporte.PENDIENTE, LocalDateTime.now())
        );
        when(reporteRepository.findByPrioridad(Prioridad.ALTA)).thenReturn(listaMock);

        List<ReporteResponseDTO> resultado = reporteService.listarConFiltros(null, Prioridad.ALTA);

        assertEquals(1, resultado.size());
        assertEquals(Prioridad.ALTA, resultado.get(0).getPrioridad());
        verify(reporteRepository).findByPrioridad(Prioridad.ALTA);
    }

    @Test
    @DisplayName("Debe listar con filtros llamando findAll si ambos parámetros son nulos o vacíos")
    void debeListarConFiltrosSinParametros() {
        List<Reporte> listaMock = List.of(
                new Reporte(1L, "A-101", TipoProblema.TECNOLOGICO, "Proyector", Prioridad.ALTA, EstadoReporte.PENDIENTE, LocalDateTime.now())
        );
        when(reporteRepository.findAll()).thenReturn(listaMock);

        List<ReporteResponseDTO> resultado = reporteService.listarConFiltros("   ", null);

        assertEquals(1, resultado.size());
        verify(reporteRepository).findAll();
    }
}

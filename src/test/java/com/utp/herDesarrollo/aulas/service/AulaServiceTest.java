
package com.utp.herDesarrollo.aulas.service;

import com.utp.herDesarrollo.aulas.model.Aula;
import com.utp.herDesarrollo.aulas.repository.AulaRepository;
import com.utp.herDesarrollo.reportes.application.dto.ReporteResponseDTO;
import com.utp.herDesarrollo.reportes.domain.model.EstadoReporte;
import com.utp.herDesarrollo.reportes.domain.model.Prioridad;
import com.utp.herDesarrollo.reportes.domain.model.Reporte;
import com.utp.herDesarrollo.reportes.domain.model.TipoProblema;
import com.utp.herDesarrollo.reportes.domain.repository.ReporteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class AulaServiceTest {

    @Autowired
    private AulaService aulaService;

    @Autowired
    private AulaRepository aulaRepository;

    @Autowired
    private ReporteRepository reporteRepository;

    @BeforeEach
    void prepararDatos() {
        reporteRepository.deleteAll();
        aulaRepository.deleteAll();

        aulaRepository.saveAll(List.of(
                new Aula(null, "A-101",
                        "Pabellón A - Primer piso", 40, "Disponible"),
                new Aula(null, "A-102",
                        "Pabellón A - Primer piso", 35, "Mantenimiento"),
                new Aula(null, "B-201",
                        "Pabellón B - Segundo piso", 50, "Disponible")
        ));
    }

    @Test
    void debeListarAulas() {
        assertEquals(3, aulaService.listarAulas().size());
    }

    @Test
    void debeObtenerAulaPorId() {
        Aula primera = aulaRepository.findAll().stream()
                .filter(a -> a.getCodigo().equals("A-101"))
                .findFirst()
                .orElseThrow();

        Aula aula = aulaService.obtenerAulaPorId(primera.getId());

        assertEquals("A-101", aula.getCodigo());
        assertEquals(40, aula.getCapacidad());
    }

    @Test
    void debeRegistrarAula() {
        Aula nueva = new Aula(null, "C-301",
                "Pabellón C - Tercer piso", 45, "Disponible");

        Aula guardada = aulaService.registrarAula(nueva);

        assertNotNull(guardada.getId());
        assertEquals("C-301", guardada.getCodigo());
    }

    @Test
    void debeActualizarAula() {
        Aula existente = aulaRepository.findAll().stream()
                .filter(a -> a.getCodigo().equals("A-101"))
                .findFirst()
                .orElseThrow();

        Aula cambios = new Aula(null, "A-101",
                "Pabellón A - Segundo piso", 42, "Disponible");

        Aula actualizada = aulaService.actualizarAula(
                existente.getId(), cambios);

        assertEquals("Pabellón A - Segundo piso",
                actualizada.getUbicacion());
        assertEquals(42, actualizada.getCapacidad());
    }

    @Test
    void debeEliminarAula() {
        Aula existente = aulaRepository.findAll().stream()
                .filter(a -> a.getCodigo().equals("A-102"))
                .findFirst()
                .orElseThrow();

        aulaService.eliminarAula(existente.getId());

        assertFalse(aulaRepository.existsById(existente.getId()));
    }

    @Test
    void debeBuscarAulasPorEstado() {
        List<Aula> aulas = aulaService.buscarPorEstado("disponible");

        assertEquals(2, aulas.size());
    }

    @Test
    void debeBuscarPorCapacidadMinima() {
        List<Aula> aulas = aulaService.buscarPorCapacidadMinima(40);

        assertEquals(2, aulas.size());
    }

    @Test
    void debeContarAulasPorEstado() {
        assertEquals(2, aulaService.contarPorEstado("Disponible"));
    }

    @Test
    void debeIndicarCuandoNoExisteElAula() {
        assertThrows(ResponseStatusException.class,
                () -> aulaService.obtenerAulaPorId(-1L));
    }

    @Test
    void debeRechazarEliminarAulaConReportesActivos() {
        Aula aula = aulaRepository.findAll().stream()
                .filter(a -> a.getCodigo().equals("A-101"))
                .findFirst()
                .orElseThrow();

        reporteRepository.save(new Reporte(
                aula,
                TipoProblema.TECNOLOGICO,
                "Falla activa",
                Prioridad.ALTA,
                EstadoReporte.PENDIENTE,
                LocalDateTime.now()
        ));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> aulaService.eliminarAula(aula.getId()));
        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
        assertTrue(aulaRepository.existsById(aula.getId()));
    }

    @Test
    void debeListarReportesPorAula() {
        Aula aula = aulaRepository.findAll().stream()
                .filter(a -> a.getCodigo().equals("A-101"))
                .findFirst()
                .orElseThrow();

        reporteRepository.save(new Reporte(
                aula,
                TipoProblema.ELECTRICO,
                "Foco quemado",
                Prioridad.BAJA,
                EstadoReporte.PENDIENTE,
                LocalDateTime.now()
        ));

        List<ReporteResponseDTO> reportes = aulaService.listarReportesPorAula(aula.getId());
        assertEquals(1, reportes.size());
        assertEquals("A-101", reportes.get(0).getAulaId());
    }
}

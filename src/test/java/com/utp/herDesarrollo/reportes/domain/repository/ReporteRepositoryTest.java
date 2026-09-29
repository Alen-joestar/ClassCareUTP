package com.utp.herDesarrollo.reportes.domain.repository;

import com.utp.herDesarrollo.reportes.domain.model.EstadoReporte;
import com.utp.herDesarrollo.reportes.domain.model.Prioridad;
import com.utp.herDesarrollo.reportes.domain.model.Reporte;
import com.utp.herDesarrollo.reportes.domain.model.TipoProblema;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Pruebas de integración para validar la persistencia real de la entidad Reporte
 * mediante Spring Data JPA y Hibernate (ejecutado con H2 en perfil de prueba).
 */
@SpringBootTest
@Transactional
@DisplayName("Pruebas de Integración JPA - ReporteRepository (Semana 6)")
class ReporteRepositoryTest {

    @Autowired
    private ReporteRepository reporteRepository;

    private Reporte crearReporteEjemplo(String aulaId, String descripcion) {
        return new Reporte(
                aulaId,
                TipoProblema.TECNOLOGICO,
                descripcion,
                Prioridad.ALTA,
                EstadoReporte.PENDIENTE,
                LocalDateTime.now()
        );
    }

    @Test
    @DisplayName("Debe persistir un reporte y generar ID autoincremental en base de datos")
    void debePersistirReporteYGenerarId() {
        Reporte reporte = crearReporteEjemplo("A-101", "Proyector no enciende");

        Reporte guardado = reporteRepository.save(reporte);

        assertNotNull(guardado.getId());
        assertEquals("A-101", guardado.getAulaId());
        assertEquals(EstadoReporte.PENDIENTE, guardado.getEstado());
    }

    @Test
    @DisplayName("Debe buscar reporte persistido por ID")
    void debeBuscarReportePorId() {
        Reporte reporte = reporteRepository.save(crearReporteEjemplo("B-202", "Foco parpadea"));

        Optional<Reporte> encontrado = reporteRepository.findById(reporte.getId());

        assertTrue(encontrado.isPresent());
        assertEquals("B-202", encontrado.get().getAulaId());
    }

    @Test
    @DisplayName("Debe filtrar reportes por aulaId usando Spring Data JPA")
    void debeFiltrarReportesPorAulaId() {
        reporteRepository.save(crearReporteEjemplo("A-101", "Falla 1"));
        reporteRepository.save(crearReporteEjemplo("A-101", "Falla 2"));
        reporteRepository.save(crearReporteEjemplo("C-303", "Falla 3"));

        List<Reporte> delAula = reporteRepository.findByAulaId("A-101");

        assertEquals(2, delAula.size());
        assertTrue(delAula.stream().allMatch(r -> r.getAulaId().equals("A-101")));
    }

    @Test
    @DisplayName("Debe actualizar estado y detalles de un reporte en base de datos")
    void debeActualizarReporte() {
        Reporte reporte = reporteRepository.save(crearReporteEjemplo("A-101", "Cable dañado"));

        reporte.setDescripcion("Cable reemplazado");
        reporte.setEstado(EstadoReporte.RESUELTO);
        Reporte actualizado = reporteRepository.save(reporte);

        assertEquals("Cable reemplazado", actualizado.getDescripcion());
        assertEquals(EstadoReporte.RESUELTO, actualizado.getEstado());
    }

    @Test
    @DisplayName("Debe eliminar un reporte por ID")
    void debeEliminarReportePorId() {
        Reporte reporte = reporteRepository.save(crearReporteEjemplo("D-404", "Enchufe quemado"));
        Long id = reporte.getId();

        reporteRepository.deleteById(id);

        assertFalse(reporteRepository.existsById(id));
    }
}

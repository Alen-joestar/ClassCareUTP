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
@DisplayName("Pruebas de Integración JPA y JPQL - ReporteRepository (Semana 6 y 7)")
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

    private Reporte crearReporteConPrioridad(String aulaId, String descripcion, Prioridad prioridad) {
        return new Reporte(
                aulaId,
                TipoProblema.TECNOLOGICO,
                descripcion,
                prioridad,
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

    @Test
    @DisplayName("Debe filtrar reportes por aulaId usando JPQL sin distinguir mayúsculas/minúsculas")
    void debeFiltrarPorAulaIdInsensibleMayusculasJPQL() {
        reporteRepository.save(crearReporteEjemplo("A-101", "Falla 1"));
        reporteRepository.save(crearReporteEjemplo("A-101", "Falla 2"));
        reporteRepository.save(crearReporteEjemplo("B-202", "Falla 3"));

        List<Reporte> resultadosMinuscula = reporteRepository.findByAulaId("a-101");
        List<Reporte> resultadosMayuscula = reporteRepository.findByAulaId("A-101");

        assertEquals(2, resultadosMinuscula.size());
        assertEquals(2, resultadosMayuscula.size());
    }

    @Test
    @DisplayName("Debe filtrar reportes por nivel de prioridad usando JPQL")
    void debeFiltrarPorPrioridadJPQL() {
        reporteRepository.save(crearReporteConPrioridad("A-101", "Falla urgente", Prioridad.ALTA));
        reporteRepository.save(crearReporteConPrioridad("B-202", "Falla media", Prioridad.MEDIA));
        reporteRepository.save(crearReporteConPrioridad("C-303", "Falla leve", Prioridad.BAJA));
        reporteRepository.save(crearReporteConPrioridad("D-404", "Otra urgente", Prioridad.ALTA));

        List<Reporte> altas = reporteRepository.findByPrioridad(Prioridad.ALTA);
        List<Reporte> bajas = reporteRepository.findByPrioridad(Prioridad.BAJA);

        assertEquals(2, altas.size());
        assertTrue(altas.stream().allMatch(r -> r.getPrioridad() == Prioridad.ALTA));
        assertEquals(1, bajas.size());
        assertEquals(Prioridad.BAJA, bajas.get(0).getPrioridad());
    }

    @Test
    @DisplayName("Debe filtrar reportes de forma combinada por aulaId y prioridad usando JPQL")
    void debeFiltrarPorAulaYPrioridadJPQL() {
        reporteRepository.save(crearReporteConPrioridad("A-101", "Falla urgente A-101", Prioridad.ALTA));
        reporteRepository.save(crearReporteConPrioridad("A-101", "Falla baja A-101", Prioridad.BAJA));
        reporteRepository.save(crearReporteConPrioridad("B-202", "Falla urgente B-202", Prioridad.ALTA));

        List<Reporte> filtrados = reporteRepository.findByAulaIdAndPrioridad("a-101", Prioridad.ALTA);

        assertEquals(1, filtrados.size());
        assertEquals("A-101", filtrados.get(0).getAulaId());
        assertEquals(Prioridad.ALTA, filtrados.get(0).getPrioridad());
        assertEquals("Falla urgente A-101", filtrados.get(0).getDescripcion());
    }
}

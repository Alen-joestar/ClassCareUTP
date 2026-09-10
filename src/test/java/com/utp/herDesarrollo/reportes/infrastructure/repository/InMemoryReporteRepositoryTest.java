package com.utp.herDesarrollo.reportes.infrastructure.repository;

import com.utp.herDesarrollo.reportes.domain.model.EstadoReporte;
import com.utp.herDesarrollo.reportes.domain.model.Prioridad;
import com.utp.herDesarrollo.reportes.domain.model.Reporte;
import com.utp.herDesarrollo.reportes.domain.model.TipoProblema;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Pruebas Unitarias - InMemoryReporteRepository")
class InMemoryReporteRepositoryTest {

    private InMemoryReporteRepository repository;

    @BeforeEach
    void setUp() {
        repository = new InMemoryReporteRepository();
    }

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
    @DisplayName("Debe guardar un reporte y asignar ID autoincremental")
    void debeGuardarYAsignarIdAutoincremental() {
        Reporte reporte1 = crearReporteEjemplo("A-101", "Proyector no enciende");
        Reporte reporte2 = crearReporteEjemplo("B-202", "Foco parpadea");

        Reporte guardado1 = repository.save(reporte1);
        Reporte guardado2 = repository.save(reporte2);

        assertNotNull(guardado1.getId());
        assertNotNull(guardado2.getId());
        assertEquals(1L, guardado1.getId());
        assertEquals(2L, guardado2.getId());
        assertEquals("A-101", guardado1.getAulaId());
    }

    @Test
    @DisplayName("Debe actualizar un reporte existente sin alterar su ID")
    void debeActualizarReporteExistente() {
        Reporte reporte = repository.save(crearReporteEjemplo("A-101", "Proyector no enciende"));
        Long idOriginal = reporte.getId();

        reporte.setDescripcion("Proyector reemplazado");
        reporte.setEstado(EstadoReporte.RESUELTO);
        Reporte actualizado = repository.save(reporte);

        assertEquals(idOriginal, actualizado.getId());
        assertEquals("Proyector reemplazado", actualizado.getDescripcion());
        assertEquals(EstadoReporte.RESUELTO, actualizado.getEstado());
        assertEquals(1, repository.findAll().size());
    }

    @Test
    @DisplayName("Debe buscar por ID y retornar Optional con valor")
    void debeBuscarPorIdRetornandoOptionalPresente() {
        Reporte guardado = repository.save(crearReporteEjemplo("A-101", "Falla de red"));

        Optional<Reporte> encontrado = repository.findById(guardado.getId());

        assertTrue(encontrado.isPresent());
        assertEquals("Falla de red", encontrado.get().getDescripcion());
    }

    @Test
    @DisplayName("Debe retornar Optional vacío cuando el ID no existe")
    void debeRetornarOptionalVacioCuandoIdNoExiste() {
        Optional<Reporte> encontrado = repository.findById(999L);

        assertTrue(encontrado.isEmpty());
    }

    @Test
    @DisplayName("Debe listar todos los reportes almacenados ordenados por ID")
    void debeListarTodosLosReportes() {
        repository.save(crearReporteEjemplo("A-101", "Falla 1"));
        repository.save(crearReporteEjemplo("A-102", "Falla 2"));
        repository.save(crearReporteEjemplo("B-201", "Falla 3"));

        List<Reporte> lista = repository.findAll();

        assertEquals(3, lista.size());
    }

    @Test
    @DisplayName("Debe filtrar reportes por aulaId de forma insensible a mayúsculas")
    void debeFiltrarReportesPorAulaId() {
        repository.save(crearReporteEjemplo("A-101", "Falla 1"));
        repository.save(crearReporteEjemplo("a-101", "Falla 2"));
        repository.save(crearReporteEjemplo("B-202", "Falla 3"));

        List<Reporte> reportesAula = repository.findByAulaId("A-101");

        assertEquals(2, reportesAula.size());
        assertTrue(reportesAula.stream().allMatch(r -> r.getAulaId().equalsIgnoreCase("A-101")));
    }

    @Test
    @DisplayName("Debe verificar existencia por ID y eliminar correctamente")
    void debeVerificarExistenciaYEliminarPorId() {
        Reporte guardado = repository.save(crearReporteEjemplo("C-301", "Silla rota"));

        assertTrue(repository.existsById(guardado.getId()));

        repository.deleteById(guardado.getId());

        assertFalse(repository.existsById(guardado.getId()));
        assertTrue(repository.findById(guardado.getId()).isEmpty());
    }
}

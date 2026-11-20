
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
        Aula nueva = new Aula(null, " c-301 ",
                "Pabellón C - Tercer piso", 45, "Disponible");

        Aula guardada = aulaService.registrarAula(nueva);

        assertNotNull(guardada.getId());
        assertEquals("C-301", guardada.getCodigo());
    }

    @Test
    void debeAceptarLosLimitesYNormalizarElEstado() {
        Aula nueva = new Aula(
                null,
                "C".repeat(30),
                "U".repeat(120),
                200,
                " en mantenimiento "
        );

        Aula guardada = aulaService.registrarAula(nueva);

        assertEquals(30, guardada.getCodigo().length());
        assertEquals(120, guardada.getUbicacion().length());
        assertEquals(200, guardada.getCapacidad());
        assertEquals("Mantenimiento", guardada.getEstado());
    }

    @Test
    void debeRechazarCodigoYUbicacionEnBlanco() {
        ResponseStatusException errorCodigo = assertThrows(
                ResponseStatusException.class,
                () -> aulaService.registrarAula(
                        new Aula(null, "   ", "Pabellón C", 30, "Disponible")
                )
        );
        assertEquals(HttpStatus.BAD_REQUEST, errorCodigo.getStatusCode());
        assertEquals("El código del aula es obligatorio", errorCodigo.getReason());

        ResponseStatusException errorUbicacion = assertThrows(
                ResponseStatusException.class,
                () -> aulaService.registrarAula(
                        new Aula(null, "C-302", "   ", 30, "Disponible")
                )
        );
        assertEquals(HttpStatus.BAD_REQUEST, errorUbicacion.getStatusCode());
        assertEquals("La ubicación del aula es obligatoria", errorUbicacion.getReason());
    }

    @Test
    void debeRechazarTextoQueSupereLasLongitudesPermitidas() {
        ResponseStatusException errorCodigo = assertThrows(
                ResponseStatusException.class,
                () -> aulaService.registrarAula(
                        new Aula(null, "C".repeat(31), "Pabellón C", 30, "Disponible")
                )
        );
        assertEquals("El código del aula no puede superar 30 caracteres",
                errorCodigo.getReason());

        ResponseStatusException errorUbicacion = assertThrows(
                ResponseStatusException.class,
                () -> aulaService.registrarAula(
                        new Aula(null, "C-302", "U".repeat(121), 30, "Disponible")
                )
        );
        assertEquals("La ubicación no puede superar 120 caracteres",
                errorUbicacion.getReason());
    }

    @Test
    void debeRechazarCapacidadesFueraDelRango() {
        for (int capacidad : List.of(0, 201)) {
            ResponseStatusException error = assertThrows(
                    ResponseStatusException.class,
                    () -> aulaService.registrarAula(
                            new Aula(null, "C-302", "Pabellón C", capacidad, "Disponible")
                    )
            );
            assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
            assertEquals(
                    "La capacidad debe ser un número entero entre 1 y 200",
                    error.getReason()
            );
        }
    }

    @Test
    void debeRechazarEstadoNoValido() {
        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> aulaService.registrarAula(
                        new Aula(null, "C-302", "Pabellón C", 30, "Reservada")
                )
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        assertEquals(
                "Estado no válido. Seleccione Disponible, Ocupada o Mantenimiento",
                error.getReason()
        );
    }

    @Test
    void debeRechazarCodigosDuplicadosSinDistinguirMayusculas() {
        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> aulaService.registrarAula(
                        new Aula(null, "a-101", "Pabellón C", 30, "Disponible")
                )
        );

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        assertEquals("Ya existe un aula con el código: A-101", error.getReason());
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
    void debeRechazarEdicionConCodigoDeOtraAula() {
        Aula existente = aulaRepository.findByCodigoIgnoreCase("A-101")
                .orElseThrow();

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> aulaService.actualizarAula(
                        existente.getId(),
                        new Aula(null, " b-201 ", "Pabellón A", 40, "Disponible")
                )
        );

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        assertEquals("Ya existe un aula con el código: B-201", error.getReason());
    }

    @Test
    void debeMantenerElEstadoMantenimientoCuandoHayUnReporteActivoQueLoRequiere() {
        Aula aula = aulaRepository.findByCodigoIgnoreCase("A-101")
                .orElseThrow();
        reporteRepository.save(new Reporte(
                aula,
                TipoProblema.TECNOLOGICO,
                "Falla activa",
                Prioridad.ALTA,
                EstadoReporte.PENDIENTE,
                LocalDateTime.now()
        ));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> aulaService.actualizarAula(
                        aula.getId(),
                        new Aula(null, "A-101", "Pabellón A", 40, "Disponible")
                )
        );

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        assertEquals(
                "No se puede cambiar el aula a Disponible u Ocupada mientras "
                        + "tenga reportes de prioridad alta o en atención",
                error.getReason()
        );
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
    void debeRechazarEliminarAulaConReportesResueltos() {
        Aula aula = aulaRepository.findByCodigoIgnoreCase("A-101")
                .orElseThrow();
        reporteRepository.save(new Reporte(
                aula,
                TipoProblema.ELECTRICO,
                "Reporte resuelto",
                Prioridad.BAJA,
                EstadoReporte.RESUELTO,
                LocalDateTime.now()
        ));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> aulaService.eliminarAula(aula.getId())
        );

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        assertEquals(
                "No se puede eliminar el aula porque tiene reportes asociados; "
                        + "los reportes históricos deben conservar su aula",
                error.getReason()
        );
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

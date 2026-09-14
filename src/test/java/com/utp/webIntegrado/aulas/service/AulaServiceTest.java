package com.utp.webIntegrado.aulas.service;

import com.utp.webIntegrado.aulas.model.Aula;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class AulaServiceTest {

    private final AulaService aulaService = new AulaService();

    @Test
    void debeListarAulas() {
        List<Aula> aulas = aulaService.listarAulas();

        assertNotNull(aulas);
        assertEquals(3, aulas.size());
    }

    @Test
    void debeObtenerAulaPorId() {
        Aula aula = aulaService.obtenerAulaPorId(1L);

        assertNotNull(aula);
        assertEquals("A-101", aula.getCodigo());
        assertEquals("Pabellón A - Primer piso", aula.getUbicacion());
        assertEquals(40, aula.getCapacidad());
        assertEquals("Disponible", aula.getEstado());
    }

    @Test
    void debeRetornarNullSiElAulaNoExiste() {
        Aula aula = aulaService.obtenerAulaPorId(99L);

        assertNull(aula);
    }

    @Test
    void debeRegistrarAula() {
        Aula nuevaAula = new Aula(
                null,
                "C-301",
                "Pabellón C - Tercer piso",
                45,
                "Disponible"
        );

        Aula registrada = aulaService.registrarAula(nuevaAula);

        assertNotNull(registrada);
        assertEquals(4L, registrada.getId());
        assertEquals("C-301", registrada.getCodigo());
        assertEquals("Pabellón C - Tercer piso", registrada.getUbicacion());
        assertEquals(45, registrada.getCapacidad());
        assertEquals("Disponible", registrada.getEstado());
    }

    @Test
    void debeActualizarAula() {
        Aula aulaActualizada = new Aula(
                null,
                "C-302",
                "Pabellón C - Cuarto piso",
                60,
                "Disponible"
        );

        Aula resultado = aulaService.actualizarAula(1L, aulaActualizada);

        assertNotNull(resultado);
        assertEquals(1L, resultado.getId());
        assertEquals("C-302", resultado.getCodigo());
        assertEquals("Pabellón C - Cuarto piso", resultado.getUbicacion());
        assertEquals(60, resultado.getCapacidad());
        assertEquals("Disponible", resultado.getEstado());
    }
}
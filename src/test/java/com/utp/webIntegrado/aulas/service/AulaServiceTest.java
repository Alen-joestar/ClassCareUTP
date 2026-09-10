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
}
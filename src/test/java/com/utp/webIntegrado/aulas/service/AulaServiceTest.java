package com.utp.webIntegrado.aulas.service;

import com.utp.webIntegrado.aulas.model.Aula;
import com.utp.webIntegrado.aulas.repository.AulaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AulaServiceTest {

    private AulaService aulaService;
    private AulaRepository aulaRepository;

    @BeforeEach
    void configurar() {
        aulaRepository = mock(AulaRepository.class);
        aulaService = new AulaService(aulaRepository);
    }

    @Test
    void debeListarAulas() {
        List<Aula> aulas = List.of(
                new Aula(1L, "A-101", "Pabellón A - Primer piso", 40, "Disponible"),
                new Aula(2L, "A-102", "Pabellón A - Primer piso", 35, "Mantenimiento"),
                new Aula(3L, "B-201", "Pabellón B - Segundo piso", 50, "Disponible")
        );

        when(aulaRepository.findAll()).thenReturn(aulas);

        List<Aula> resultado = aulaService.listarAulas();

        assertNotNull(resultado);
        assertEquals(3, resultado.size());
        assertEquals("A-101", resultado.get(0).getCodigo());
    }

    @Test
    void debeObtenerAulaPorId() {
        Aula aula = new Aula(
                1L,
                "A-101",
                "Pabellón A - Primer piso",
                40,
                "Disponible"
        );

        when(aulaRepository.findById(1L)).thenReturn(Optional.of(aula));

        Aula resultado = aulaService.obtenerAulaPorId(1L);

        assertNotNull(resultado);
        assertEquals("A-101", resultado.getCodigo());
        assertEquals("Pabellón A - Primer piso", resultado.getUbicacion());
        assertEquals(40, resultado.getCapacidad());
        assertEquals("Disponible", resultado.getEstado());
    }

    @Test
    void debeRetornarNullSiElAulaNoExiste() {
        when(aulaRepository.findById(99L)).thenReturn(Optional.empty());

        Aula resultado = aulaService.obtenerAulaPorId(99L);

        assertNull(resultado);
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

        Aula aulaRegistrada = new Aula(
                4L,
                "C-301",
                "Pabellón C - Tercer piso",
                45,
                "Disponible"
        );

        when(aulaRepository.save(nuevaAula)).thenReturn(aulaRegistrada);

        Aula resultado = aulaService.registrarAula(nuevaAula);

        assertNotNull(resultado);
        assertEquals(4L, resultado.getId());
        assertEquals("C-301", resultado.getCodigo());
        assertEquals("Pabellón C - Tercer piso", resultado.getUbicacion());
        assertEquals(45, resultado.getCapacidad());
        assertEquals("Disponible", resultado.getEstado());
    }

    @Test
    void debeActualizarAula() {
        Aula aulaExistente = new Aula(
                1L,
                "A-101",
                "Pabellón A - Primer piso",
                40,
                "Disponible"
        );

        Aula aulaActualizada = new Aula(
                null,
                "C-302",
                "Pabellón C - Cuarto piso",
                60,
                "Disponible"
        );

        when(aulaRepository.findById(1L)).thenReturn(Optional.of(aulaExistente));
        when(aulaRepository.save(aulaExistente)).thenReturn(aulaExistente);

        Aula resultado = aulaService.actualizarAula(1L, aulaActualizada);

        assertNotNull(resultado);
        assertEquals(1L, resultado.getId());
        assertEquals("C-302", resultado.getCodigo());
        assertEquals("Pabellón C - Cuarto piso", resultado.getUbicacion());
        assertEquals(60, resultado.getCapacidad());
        assertEquals("Disponible", resultado.getEstado());
    }
}
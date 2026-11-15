package com.utp.herDesarrollo.atenciones.service;

import com.utp.herDesarrollo.atenciones.model.Atencion;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AtencionServiceTest {

    private AtencionService service;

    @BeforeEach
    void setUp() {
        service = new AtencionService();
    }

    @Test
    void debeCrearAtencionConEstadoPendiente() {
        Atencion atencion = new Atencion();
        atencion.setReporteId(100L);

        Atencion resultado = service.crear(atencion);

        assertNotNull(resultado.getId());
        assertEquals("Pendiente", resultado.getEstado());
    }

    @Test
    void debeActualizarEstadoCorrectamente() {
        Atencion atencion = new Atencion();
        atencion.setReporteId(101L);
        Atencion creada = service.crear(atencion);

        service.actualizarEstado(creada.getId(), "En atención");

        assertEquals("En atención", creada.getEstado());
    }

    @Test
    void noDebePermitirResolverSinEstarEnAtencion() {
        Atencion atencion = new Atencion();
        atencion.setReporteId(102L);
        Atencion creada = service.crear(atencion);

        // Intentar pasar directo a Resuelto sin pasar por En atención
        assertThrows(RuntimeException.class, () ->
                service.actualizarEstado(creada.getId(), "Resuelto")
        );
    }
}

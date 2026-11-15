package com.utp.herDesarrollo.atenciones.service;

import com.utp.herDesarrollo.atenciones.model.Atencion;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class AtencionService {

    private final List<Atencion> atenciones = new ArrayList<>();
    private Long contadorId = 1L;

    public Atencion crear(Atencion atencion) {
        atencion.setId(contadorId++);
        atencion.setEstado("Pendiente");
        atenciones.add(atencion);
        return atencion;
    }

    public List<Atencion> listarTodas() {
        return atenciones;
    }

    public Atencion actualizarEstado(Long id, String nuevoEstado) {
        Optional<Atencion> encontrada = atenciones.stream()
                .filter(a -> a.getId().equals(id))
                .findFirst();

        if (encontrada.isEmpty()) {
            throw new RuntimeException("Atencion no encontrada con id: " + id);
        }

        Atencion atencion = encontrada.get();

        // Regla de negocio: no se puede pasar a Resuelto sin estar En atención
        if ("Resuelto".equals(nuevoEstado) && !"En atención".equals(atencion.getEstado())) {
            throw new RuntimeException("No se puede resolver sin estar En atención primero");
        }

        atencion.setEstado(nuevoEstado);
        return atencion;
    }
}

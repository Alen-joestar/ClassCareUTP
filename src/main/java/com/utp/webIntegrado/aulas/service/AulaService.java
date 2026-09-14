package com.utp.webIntegrado.aulas.service;

import com.utp.webIntegrado.aulas.model.Aula;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class AulaService {

    private final List<Aula> aulas = new ArrayList<>();

    public AulaService() {
        aulas.add(new Aula(
                1L,
                "A-101",
                "Pabellón A - Primer piso",
                40,
                "Disponible"
        ));

        aulas.add(new Aula(
                2L,
                "A-102",
                "Pabellón A - Primer piso",
                35,
                "Mantenimiento"
        ));

        aulas.add(new Aula(
                3L,
                "B-201",
                "Pabellón B - Segundo piso",
                50,
                "Disponible"
        ));
    }

    public List<Aula> listarAulas() {
        return aulas;
    }

    public Aula obtenerAulaPorId(Long id) {
        for (Aula aula : aulas) {
            if (aula.getId().equals(id)) {
                return aula;
            }
        }

        return null;
    }

    public Aula registrarAula(Aula aula) {
        aula.setId((long) (aulas.size() + 1));
        aulas.add(aula);
        return aula;
    }

    public Aula actualizarAula(Long id, Aula aulaActualizada) {
    Aula aulaExistente = obtenerAulaPorId(id);

    if (aulaExistente == null) {
        return null;
    }

    aulaExistente.setCodigo(aulaActualizada.getCodigo());
    aulaExistente.setUbicacion(aulaActualizada.getUbicacion());
    aulaExistente.setCapacidad(aulaActualizada.getCapacidad());
    aulaExistente.setEstado(aulaActualizada.getEstado());

    return aulaExistente;
}
}

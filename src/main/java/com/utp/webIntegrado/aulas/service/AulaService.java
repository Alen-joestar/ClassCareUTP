package com.utp.webIntegrado.aulas.service;

import com.utp.webIntegrado.aulas.model.Aula;
import com.utp.webIntegrado.aulas.repository.AulaRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AulaService {

    private final AulaRepository aulaRepository;

    public AulaService(AulaRepository aulaRepository) {
        this.aulaRepository = aulaRepository;
    }

    public List<Aula> listarAulas() {
        return aulaRepository.findAll();
    }

    public Aula obtenerAulaPorId(Long id) {
        return aulaRepository.findById(id).orElse(null);
    }

    public Aula registrarAula(Aula aula) {
        return aulaRepository.save(aula);
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

        return aulaRepository.save(aulaExistente);
    }
}
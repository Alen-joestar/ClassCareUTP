package com.utp.herDesarrollo.reportes.infrastructure.repository;

import com.utp.herDesarrollo.reportes.domain.model.Reporte;
import com.utp.herDesarrollo.reportes.domain.repository.ReporteRepository;
import org.springframework.stereotype.Repository;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Implementación en memoria del repositorio de reportes.
 * Utiliza estructuras concurrentes de Java para asegurar consistencia
 * y prepara la capa para migrar sin fricción a Spring Data JPA en fases posteriores.
 */
@Repository
public class InMemoryReporteRepository implements ReporteRepository {

    private final Map<Long, Reporte> storage = new ConcurrentHashMap<>();
    private final AtomicLong idGenerator = new AtomicLong(1);

    @Override
    public Reporte save(Reporte reporte) {
        if (reporte == null) {
            throw new IllegalArgumentException("El reporte a guardar no puede ser nulo");
        }

        if (reporte.getId() == null) {
            reporte.setId(idGenerator.getAndIncrement());
        }

        storage.put(reporte.getId(), reporte);
        return reporte;
    }

    @Override
    public Optional<Reporte> findById(Long id) {
        if (id == null) {
            return Optional.empty();
        }
        return Optional.ofNullable(storage.get(id));
    }

    @Override
    public List<Reporte> findAll() {
        return storage.values().stream()
                .sorted(Comparator.comparing(Reporte::getId))
                .toList();
    }

    @Override
    public List<Reporte> findByAulaId(String aulaId) {
        if (aulaId == null || aulaId.isBlank()) {
            return List.of();
        }
        return storage.values().stream()
                .filter(r -> r.getAulaId() != null && r.getAulaId().equalsIgnoreCase(aulaId.trim()))
                .sorted(Comparator.comparing(Reporte::getId))
                .toList();
    }

    @Override
    public boolean existsById(Long id) {
        if (id == null) {
            return false;
        }
        return storage.containsKey(id);
    }

    @Override
    public void deleteById(Long id) {
        if (id != null) {
            storage.remove(id);
        }
    }
}

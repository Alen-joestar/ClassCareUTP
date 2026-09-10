package com.utp.herDesarrollo.reportes.domain.repository;

import com.utp.herDesarrollo.reportes.domain.model.Reporte;

import java.util.List;
import java.util.Optional;

/**
 * Contrato del repositorio para la persistencia del agregado Reporte.
 * Desacoplado de la tecnología de almacenamiento para facilitar la migración futura a Spring Data JPA.
 */
public interface ReporteRepository {

    Reporte save(Reporte reporte);

    Optional<Reporte> findById(Long id);

    List<Reporte> findAll();

    List<Reporte> findByAulaId(String aulaId);

    boolean existsById(Long id);

    void deleteById(Long id);
}

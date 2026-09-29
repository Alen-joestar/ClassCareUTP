package com.utp.herDesarrollo.reportes.domain.repository;

import com.utp.herDesarrollo.reportes.domain.model.Reporte;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repositorio de Spring Data JPA para la entidad Reporte.
 * Conecta directamente con la base de datos PostgreSQL proveyendo operaciones CRUD completas.
 */
@Repository
public interface ReporteRepository extends JpaRepository<Reporte, Long> {

    /**
     * Consulta derivada de Spring Data para buscar reportes filtrados por aula.
     */
    List<Reporte> findByAulaId(String aulaId);
}

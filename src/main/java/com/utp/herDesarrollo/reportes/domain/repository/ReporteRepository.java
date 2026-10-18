package com.utp.herDesarrollo.reportes.domain.repository;

import com.utp.herDesarrollo.reportes.domain.model.EstadoReporte;
import com.utp.herDesarrollo.reportes.domain.model.Prioridad;
import com.utp.herDesarrollo.reportes.domain.model.Reporte;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repositorio de Spring Data JPA para la entidad Reporte.
 * Integra consultas personalizadas en JPQL para filtrado avanzado por aula y prioridad.
 */
@Repository
public interface ReporteRepository extends JpaRepository<Reporte, Long> {

    /**
     * Consulta personalizada en JPQL para buscar reportes por aula (insensible a mayúsculas/minúsculas).
     */
    @Query("SELECT r FROM Reporte r WHERE UPPER(r.aula.codigo) = UPPER(:aulaId) ORDER BY r.fechaRegistro DESC")
    List<Reporte> findByAulaId(@Param("aulaId") String aulaId);

    /**
     * Consulta personalizada en JPQL para filtrar incidencias por su nivel de urgencia/prioridad.
     */
    @Query("SELECT r FROM Reporte r WHERE r.prioridad = :prioridad ORDER BY r.fechaRegistro DESC")
    List<Reporte> findByPrioridad(@Param("prioridad") Prioridad prioridad);

    /**
     * Consulta personalizada en JPQL para filtrado combinado por aula y prioridad.
     */
    @Query("SELECT r FROM Reporte r WHERE UPPER(r.aula.codigo) = UPPER(:aulaId) AND r.prioridad = :prioridad ORDER BY r.fechaRegistro DESC")
    List<Reporte> findByAulaIdAndPrioridad(@Param("aulaId") String aulaId, @Param("prioridad") Prioridad prioridad);

    /**
     * Obtiene todos los reportes asociados a un aula por su ID numérico.
     */
    List<Reporte> findByAula_IdOrderByFechaRegistroDesc(Long aulaId);

    /**
     * Verifica si existen reportes activos (no resueltos) para un aula específica.
     */
    boolean existsByAula_IdAndEstadoNot(Long aulaId, EstadoReporte estado);

    /**
     * Cuenta reportes no resueltos para un aula excluyendo un reporte específico.
     */
    long countByAula_IdAndEstadoNotAndIdNot(Long aulaId, EstadoReporte estado, Long id);

    /**
     * Cuenta reportes no resueltos para un aula.
     */
    long countByAula_IdAndEstadoNot(Long aulaId, EstadoReporte estado);
}

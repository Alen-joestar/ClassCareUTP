package com.utp.herDesarrollo.reportes.domain.repository;

import com.utp.herDesarrollo.reportes.domain.model.EstadoReporte;
import com.utp.herDesarrollo.reportes.domain.model.Prioridad;
import com.utp.herDesarrollo.reportes.domain.model.Reporte;
import com.utp.herDesarrollo.reportes.domain.model.TipoProblema;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * Repositorio de Spring Data JPA para la entidad Reporte.
 * Integra consultas personalizadas en JPQL para filtrado avanzado por aula y prioridad.
 */
public interface ReporteRepository extends JpaRepository<Reporte, Long> {

    /**
     * Obtiene todos los reportes junto con su aula asociada en una sola consulta JOIN FETCH (evita N+1).
     */
    @Override
    @Query("SELECT r FROM Reporte r JOIN FETCH r.aula ORDER BY r.fechaRegistro DESC")
    List<Reporte> findAll();

    /**
     * Consulta personalizada en JPQL para buscar reportes por aula (insensible a mayúsculas/minúsculas).
     */
    @Query("SELECT r FROM Reporte r JOIN FETCH r.aula WHERE UPPER(r.aula.codigo) = UPPER(:aulaId) ORDER BY r.fechaRegistro DESC")
    List<Reporte> findByAulaId(@Param("aulaId") String aulaId);

    /**
     * Consulta personalizada en JPQL para filtrar incidencias por su nivel de urgencia/prioridad.
     */
    @Query("SELECT r FROM Reporte r JOIN FETCH r.aula WHERE r.prioridad = :prioridad ORDER BY r.fechaRegistro DESC")
    List<Reporte> findByPrioridad(@Param("prioridad") Prioridad prioridad);

    /**
     * Consulta personalizada en JPQL para filtrado combinado por aula y prioridad.
     */
    @Query("SELECT r FROM Reporte r JOIN FETCH r.aula WHERE UPPER(r.aula.codigo) = UPPER(:aulaId) AND r.prioridad = :prioridad ORDER BY r.fechaRegistro DESC")
    List<Reporte> findByAulaIdAndPrioridad(@Param("aulaId") String aulaId, @Param("prioridad") Prioridad prioridad);

    /**
     * Obtiene todos los reportes asociados a un aula por su ID numérico.
     */
    List<Reporte> findByAula_IdOrderByFechaRegistroDesc(Long aulaId);

    boolean existsByAula_Id(Long aulaId);

    boolean existsByAula_IdAndEstado(Long aulaId, EstadoReporte estado);

    /**
     * Verifica si existen reportes activos (no resueltos) para un aula específica.
     */
    boolean existsByAula_IdAndEstadoNot(Long aulaId, EstadoReporte estado);

    boolean existsByAula_IdAndEstadoNotAndPrioridad(
            Long aulaId, EstadoReporte estado, Prioridad prioridad);

    /**
     * Cuenta reportes no resueltos para un aula excluyendo un reporte específico.
     */
    long countByAula_IdAndEstadoNotAndIdNot(Long aulaId, EstadoReporte estado, Long id);

    /**
     * Cuenta reportes no resueltos para un aula.
     */
    long countByAula_IdAndEstadoNot(Long aulaId, EstadoReporte estado);

    /**
     * Verifica si ya existe un reporte activo (no resuelto) en la misma aula para la misma categoría técnica.
     */
    boolean existsByAula_IdAndTipoProblemaAndEstadoNot(Long aulaId, TipoProblema tipoProblema, EstadoReporte estado);

    /**
     * Verifica si ya existe otro reporte activo en la misma aula para la misma categoría excluyendo un ID (modo edición).
     */
    boolean existsByAula_IdAndTipoProblemaAndEstadoNotAndIdNot(Long aulaId, TipoProblema tipoProblema, EstadoReporte estado, Long id);
}

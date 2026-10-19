package com.utp.herDesarrollo.atenciones.repository;

import com.utp.herDesarrollo.atenciones.model.Atencion;
import com.utp.herDesarrollo.atenciones.model.EstadoAtencion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AtencionRepository extends JpaRepository<Atencion, Long> {

    @Query("SELECT a FROM Atencion a WHERE a.estado = :estado ORDER BY a.fechaRegistro DESC")
    List<Atencion> findByEstado(@Param("estado") EstadoAtencion estado);

    @Query("SELECT a FROM Atencion a WHERE a.reporte.id = :reporteId ORDER BY a.fechaRegistro DESC")
    List<Atencion> findByReporteId(@Param("reporteId") Long reporteId);

    @Query("SELECT a FROM Atencion a WHERE LOWER(a.tecnicoEncargado) = LOWER(:tecnico) ORDER BY a.fechaRegistro DESC")
    List<Atencion> findByTecnicoEncargado(@Param("tecnico") String tecnicoEncargado);

    @Query("SELECT a FROM Atencion a WHERE LOWER(a.tecnicoEncargado) = LOWER(:tecnico) AND a.estado = :estado ORDER BY a.fechaRegistro DESC")
    List<Atencion> findByTecnicoEncargadoAndEstado(
            @Param("tecnico") String tecnicoEncargado,
            @Param("estado") EstadoAtencion estado
    );

    long countByReporte_IdAndEstadoNot(Long reporteId, EstadoAtencion estado);
}

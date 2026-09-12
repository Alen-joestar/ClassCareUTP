package com.utp.herDesarrollo.reportes.application.dto;

import com.utp.herDesarrollo.reportes.domain.model.EstadoReporte;
import com.utp.herDesarrollo.reportes.domain.model.Prioridad;
import com.utp.herDesarrollo.reportes.domain.model.Reporte;
import com.utp.herDesarrollo.reportes.domain.model.TipoProblema;

import java.time.LocalDateTime;

/**
 * DTO de respuesta para representar una incidencia ante clientes REST o vistas.
 */
public class ReporteResponseDTO {

    private Long id;
    private String aulaId;
    private TipoProblema tipoProblema;
    private String descripcion;
    private Prioridad prioridad;
    private EstadoReporte estado;
    private LocalDateTime fechaRegistro;

    public ReporteResponseDTO() {
    }

    public ReporteResponseDTO(Long id, String aulaId, TipoProblema tipoProblema, String descripcion, Prioridad prioridad, EstadoReporte estado, LocalDateTime fechaRegistro) {
        this.id = id;
        this.aulaId = aulaId;
        this.tipoProblema = tipoProblema;
        this.descripcion = descripcion;
        this.prioridad = prioridad;
        this.estado = estado;
        this.fechaRegistro = fechaRegistro;
    }

    public static ReporteResponseDTO fromDomain(Reporte reporte) {
        if (reporte == null) {
            return null;
        }
        return new ReporteResponseDTO(
                reporte.getId(),
                reporte.getAulaId(),
                reporte.getTipoProblema(),
                reporte.getDescripcion(),
                reporte.getPrioridad(),
                reporte.getEstado(),
                reporte.getFechaRegistro()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getAulaId() {
        return aulaId;
    }

    public void setAulaId(String aulaId) {
        this.aulaId = aulaId;
    }

    public TipoProblema getTipoProblema() {
        return tipoProblema;
    }

    public void setTipoProblema(TipoProblema tipoProblema) {
        this.tipoProblema = tipoProblema;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public Prioridad getPrioridad() {
        return prioridad;
    }

    public void setPrioridad(Prioridad prioridad) {
        this.prioridad = prioridad;
    }

    public EstadoReporte getEstado() {
        return estado;
    }

    public void setEstado(EstadoReporte estado) {
        this.estado = estado;
    }

    public LocalDateTime getFechaRegistro() {
        return fechaRegistro;
    }

    public void setFechaRegistro(LocalDateTime fechaRegistro) {
        this.fechaRegistro = fechaRegistro;
    }
}

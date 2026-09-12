package com.utp.herDesarrollo.reportes.application.dto;

import com.utp.herDesarrollo.reportes.domain.model.Prioridad;
import com.utp.herDesarrollo.reportes.domain.model.TipoProblema;

/**
 * DTO para la solicitud de creación de una nueva incidencia/reporte.
 */
public class CrearReporteDTO {

    private String aulaId;
    private TipoProblema tipoProblema;
    private String descripcion;
    private Prioridad prioridad;

    public CrearReporteDTO() {
    }

    public CrearReporteDTO(String aulaId, TipoProblema tipoProblema, String descripcion, Prioridad prioridad) {
        this.aulaId = aulaId;
        this.tipoProblema = tipoProblema;
        this.descripcion = descripcion;
        this.prioridad = prioridad;
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
}

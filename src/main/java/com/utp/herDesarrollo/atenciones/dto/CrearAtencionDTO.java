package com.utp.herDesarrollo.atenciones.dto;

public class CrearAtencionDTO {

    private Long reporteId;
    private String tecnicoEncargado;
    private String observaciones;

    public CrearAtencionDTO() {
    }

    public CrearAtencionDTO(Long reporteId, String tecnicoEncargado, String observaciones) {
        this.reporteId = reporteId;
        this.tecnicoEncargado = tecnicoEncargado;
        this.observaciones = observaciones;
    }

    public Long getReporteId() {
        return reporteId;
    }

    public void setReporteId(Long reporteId) {
        this.reporteId = reporteId;
    }

    public String getTecnicoEncargado() {
        return tecnicoEncargado;
    }

    public void setTecnicoEncargado(String tecnicoEncargado) {
        this.tecnicoEncargado = tecnicoEncargado;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }
}

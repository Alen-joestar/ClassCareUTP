package com.utp.atenciones.model;

public class Atencion {
    private Long id;
    private Long reporteId;
    private String estado; // Pendiente, En atención, Resuelto

    public Atencion() {}

    public Atencion(Long id, Long reporteId, String estado) {
        this.id = id;
        this.reporteId = reporteId;
        this.estado = estado;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getReporteId() { return reporteId; }
    public void setReporteId(Long reporteId) { this.reporteId = reporteId; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
}

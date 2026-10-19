package com.utp.herDesarrollo.atenciones.dto;

import com.utp.herDesarrollo.atenciones.model.Atencion;
import com.utp.herDesarrollo.atenciones.model.EstadoAtencion;

import java.time.LocalDateTime;

public class AtencionResponseDTO {

    private Long id;
    private Long reporteId;
    private String tecnicoEncargado;
    private EstadoAtencion estado;
    private String observaciones;
    private LocalDateTime fechaRegistro;
    private LocalDateTime fechaResolucion;

    public AtencionResponseDTO() {
    }

    public AtencionResponseDTO(Long id, Long reporteId, String tecnicoEncargado,
                                EstadoAtencion estado, String observaciones,
                                LocalDateTime fechaRegistro, LocalDateTime fechaResolucion) {
        this.id = id;
        this.reporteId = reporteId;
        this.tecnicoEncargado = tecnicoEncargado;
        this.estado = estado;
        this.observaciones = observaciones;
        this.fechaRegistro = fechaRegistro;
        this.fechaResolucion = fechaResolucion;
    }

    public static AtencionResponseDTO fromDomain(Atencion atencion) {
        if (atencion == null) {
            return null;
        }
        return new AtencionResponseDTO(
                atencion.getId(),
                atencion.getReporteId(),
                atencion.getTecnicoEncargado(),
                atencion.getEstado(),
                atencion.getObservaciones(),
                atencion.getFechaRegistro(),
                atencion.getFechaResolucion()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public EstadoAtencion getEstado() {
        return estado;
    }

    public void setEstado(EstadoAtencion estado) {
        this.estado = estado;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }

    public LocalDateTime getFechaRegistro() {
        return fechaRegistro;
    }

    public void setFechaRegistro(LocalDateTime fechaRegistro) {
        this.fechaRegistro = fechaRegistro;
    }

    public LocalDateTime getFechaResolucion() {
        return fechaResolucion;
    }

    public void setFechaResolucion(LocalDateTime fechaResolucion) {
        this.fechaResolucion = fechaResolucion;
    }
}

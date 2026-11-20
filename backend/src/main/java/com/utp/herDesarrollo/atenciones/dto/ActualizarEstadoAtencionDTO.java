package com.utp.herDesarrollo.atenciones.dto;

import com.utp.herDesarrollo.atenciones.model.EstadoAtencion;

public class ActualizarEstadoAtencionDTO {

    private EstadoAtencion nuevoEstado;
    private String observaciones;
    private String solicitadoPor;

    public ActualizarEstadoAtencionDTO() {
    }

    public ActualizarEstadoAtencionDTO(EstadoAtencion nuevoEstado, String observaciones, String solicitadoPor) {
        this.nuevoEstado = nuevoEstado;
        this.observaciones = observaciones;
        this.solicitadoPor = solicitadoPor;
    }

    public EstadoAtencion getNuevoEstado() {
        return nuevoEstado;
    }

    public void setNuevoEstado(EstadoAtencion nuevoEstado) {
        this.nuevoEstado = nuevoEstado;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }

    public String getSolicitadoPor() {
        return solicitadoPor;
    }

    public void setSolicitadoPor(String solicitadoPor) {
        this.solicitadoPor = solicitadoPor;
    }
}

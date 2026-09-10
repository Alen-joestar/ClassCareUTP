package com.utp.herDesarrollo.reportes.domain.model;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Entidad central del dominio para el registro y gestión de incidencias en aulas.
 */
public class Reporte {

    private Long id;
    private String aulaId;
    private TipoProblema tipoProblema;
    private String descripcion;
    private Prioridad prioridad;
    private EstadoReporte estado;
    private LocalDateTime fechaRegistro;

    public Reporte() {
    }

    public Reporte(Long id, String aulaId, TipoProblema tipoProblema, String descripcion, Prioridad prioridad, EstadoReporte estado, LocalDateTime fechaRegistro) {
        this.id = id;
        this.aulaId = aulaId;
        this.tipoProblema = tipoProblema;
        this.descripcion = descripcion;
        this.prioridad = prioridad;
        this.estado = estado;
        this.fechaRegistro = fechaRegistro;
    }

    public Reporte(String aulaId, TipoProblema tipoProblema, String descripcion, Prioridad prioridad, EstadoReporte estado, LocalDateTime fechaRegistro) {
        this(null, aulaId, tipoProblema, descripcion, prioridad, estado, fechaRegistro);
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Reporte reporte = (Reporte) o;
        return Objects.equals(id, reporte.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Reporte{" +
                "id=" + id +
                ", aulaId='" + aulaId + '\'' +
                ", tipoProblema=" + tipoProblema +
                ", descripcion='" + descripcion + '\'' +
                ", prioridad=" + prioridad +
                ", estado=" + estado +
                ", fechaRegistro=" + fechaRegistro +
                '}';
    }
}

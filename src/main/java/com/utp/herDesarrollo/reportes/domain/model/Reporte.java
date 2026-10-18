package com.utp.herDesarrollo.reportes.domain.model;

import com.utp.herDesarrollo.aulas.model.Aula;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Entidad central del dominio mapeada con JPA para persistencia en base de datos PostgreSQL.
 */
@Entity
@Table(name = "reportes")
public class Reporte {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "aula_id", nullable = false)
    private Aula aula;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_problema", nullable = false, length = 30)
    private TipoProblema tipoProblema;

    @Column(name = "descripcion", nullable = false, length = 255)
    private String descripcion;

    @Enumerated(EnumType.STRING)
    @Column(name = "prioridad", nullable = false, length = 20)
    private Prioridad prioridad;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    private EstadoReporte estado;

    @Column(name = "fecha_registro", nullable = false)
    private LocalDateTime fechaRegistro;

    public Reporte() {
    }

    public Reporte(Long id, Aula aula, TipoProblema tipoProblema, String descripcion, Prioridad prioridad, EstadoReporte estado, LocalDateTime fechaRegistro) {
        this.id = id;
        this.aula = aula;
        this.tipoProblema = tipoProblema;
        this.descripcion = descripcion;
        this.prioridad = prioridad;
        this.estado = estado;
        this.fechaRegistro = fechaRegistro;
    }

    public Reporte(Aula aula, TipoProblema tipoProblema, String descripcion, Prioridad prioridad, EstadoReporte estado, LocalDateTime fechaRegistro) {
        this(null, aula, tipoProblema, descripcion, prioridad, estado, fechaRegistro);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Aula getAula() {
        return aula;
    }

    public void setAula(Aula aula) {
        this.aula = aula;
    }

    public String getAulaId() {
        return aula != null ? aula.getCodigo() : null;
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
                ", aula=" + (aula != null ? aula.getCodigo() : "null") +
                ", tipoProblema=" + tipoProblema +
                ", descripcion='" + descripcion + '\'' +
                ", prioridad=" + prioridad +
                ", estado=" + estado +
                ", fechaRegistro=" + fechaRegistro +
                '}';
    }
}

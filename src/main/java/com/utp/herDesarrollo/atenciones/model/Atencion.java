package com.utp.herDesarrollo.atenciones.model;

import com.utp.herDesarrollo.reportes.domain.model.Reporte;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "atenciones")
public class Atencion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "reporte_id", nullable = false)
    private Reporte reporte;

    @Column(name = "tecnico_encargado", nullable = false, length = 100)
    private String tecnicoEncargado;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    private EstadoAtencion estado;

    @Column(name = "observaciones", length = 500)
    private String observaciones;

    @Column(name = "fecha_registro", nullable = false)
    private LocalDateTime fechaRegistro;

    @Column(name = "fecha_resolucion")
    private LocalDateTime fechaResolucion;

    public Atencion() {
    }

    public Atencion(Reporte reporte, String tecnicoEncargado, EstadoAtencion estado,
                    String observaciones, LocalDateTime fechaRegistro) {
        this.reporte = reporte;
        this.tecnicoEncargado = tecnicoEncargado;
        this.estado = estado;
        this.observaciones = observaciones;
        this.fechaRegistro = fechaRegistro;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Reporte getReporte() {
        return reporte;
    }

    public void setReporte(Reporte reporte) {
        this.reporte = reporte;
    }

    public Long getReporteId() {
        return reporte != null ? reporte.getId() : null;
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

package com.utp.atenciones.model;

public class Atencion {
    private Long id;
    private String estado; // Pendiente, En atención, Resuelto
    
    public Atencion() {}
    
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
}

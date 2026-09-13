package com.utp.atenciones.controller;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/atenciones")
public class AtencionController {
    
    // Endpoint para actualizar estados (Semana 4 del Gantt)
    @PutMapping("/{id}/estado")
    public String actualizarEstado(@PathVariable Long id, @RequestParam String estado) {
        return "Estado actualizado a: " + estado;
    }
}

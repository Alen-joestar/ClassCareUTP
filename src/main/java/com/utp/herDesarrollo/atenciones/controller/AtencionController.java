package com.utp.herDesarrollo.atenciones.controller;

import com.utp.herDesarrollo.atenciones.model.Atencion;
import com.utp.herDesarrollo.atenciones.service.AtencionService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/atenciones")
public class AtencionController {

    private final AtencionService atencionService;

    // Inyección de dependencias
    public AtencionController(AtencionService atencionService) {
        this.atencionService = atencionService;
    }

    // GET - listar todas las atenciones
    @GetMapping
    public List<Atencion> listarTodas() {
        return atencionService.listarTodas();
    }

    // POST - registrar nueva atencion
    @PostMapping
    public Atencion crear(@RequestBody Atencion atencion) {
        return atencionService.crear(atencion);
    }

    // PUT - actualizar estado
    @PutMapping("/{id}/estado")
    public Atencion actualizarEstado(@PathVariable Long id, @RequestParam String nuevoEstado) {
        return atencionService.actualizarEstado(id, nuevoEstado);
    }
}

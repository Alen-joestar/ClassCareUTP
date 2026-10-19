package com.utp.herDesarrollo.atenciones.controller;

import com.utp.herDesarrollo.atenciones.dto.ActualizarEstadoAtencionDTO;
import com.utp.herDesarrollo.atenciones.dto.AtencionResponseDTO;
import com.utp.herDesarrollo.atenciones.dto.CrearAtencionDTO;
import com.utp.herDesarrollo.atenciones.model.EstadoAtencion;
import com.utp.herDesarrollo.atenciones.service.AtencionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/atenciones")
public class AtencionController {

    private final AtencionService atencionService;

    public AtencionController(AtencionService atencionService) {
        this.atencionService = atencionService;
    }

    @GetMapping
    public ResponseEntity<List<AtencionResponseDTO>> listar(
            @RequestParam(required = false) EstadoAtencion estado) {
        List<AtencionResponseDTO> resultado = (estado != null)
                ? atencionService.listarPorEstado(estado)
                : atencionService.listarTodas();
        return ResponseEntity.ok(resultado);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AtencionResponseDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(atencionService.buscarPorId(id));
    }

    @GetMapping("/reporte/{reporteId}")
    public ResponseEntity<List<AtencionResponseDTO>> listarPorReporte(@PathVariable Long reporteId) {
        return ResponseEntity.ok(atencionService.listarPorReporte(reporteId));
    }

    @GetMapping("/tecnico/{nombreTecnico}")
    public ResponseEntity<List<AtencionResponseDTO>> listarPorTecnico(@PathVariable String nombreTecnico) {
        return ResponseEntity.ok(atencionService.listarPorTecnico(nombreTecnico));
    }

    @PostMapping
    public ResponseEntity<AtencionResponseDTO> crear(@RequestBody CrearAtencionDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(atencionService.crearAtencion(dto));
    }

    @PutMapping("/{id}/estado")
    public ResponseEntity<AtencionResponseDTO> actualizarEstado(
            @PathVariable Long id,
            @RequestBody ActualizarEstadoAtencionDTO dto) {
        return ResponseEntity.ok(atencionService.actualizarEstado(id, dto));
    }
}

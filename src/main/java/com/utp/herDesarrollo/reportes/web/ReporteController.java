package com.utp.herDesarrollo.reportes.web;

import com.utp.herDesarrollo.reportes.application.dto.ActualizarReporteDTO;
import com.utp.herDesarrollo.reportes.application.dto.CrearReporteDTO;
import com.utp.herDesarrollo.reportes.application.dto.ReporteResponseDTO;
import com.utp.herDesarrollo.reportes.application.service.ReporteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST para la gestión de incidencias en aulas universitarias.
 * Expone los endpoints obligatorios para APF1 bajo /api/reportes.
 */
@RestController
@RequestMapping("/api/reportes")
public class ReporteController {

    private final ReporteService reporteService;

    public ReporteController(ReporteService reporteService) {
        this.reporteService = reporteService;
    }

    /**
     * GET /api/reportes : Listar todas las incidencias.
     */
    @GetMapping
    public ResponseEntity<List<ReporteResponseDTO>> listarTodos() {
        List<ReporteResponseDTO> reportes = reporteService.listarTodos();
        return ResponseEntity.ok(reportes);
    }

    /**
     * GET /api/reportes/{id} : Consultar una incidencia específica por ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ReporteResponseDTO> buscarPorId(@PathVariable Long id) {
        ReporteResponseDTO reporte = reporteService.buscarPorId(id);
        return ResponseEntity.ok(reporte);
    }

    /**
     * GET /api/reportes/aula/{aulaId} : Consultar incidencias asociadas a un aula.
     */
    @GetMapping("/aula/{aulaId}")
    public ResponseEntity<List<ReporteResponseDTO>> listarPorAula(@PathVariable String aulaId) {
        List<ReporteResponseDTO> reportes = reporteService.listarPorAulaId(aulaId);
        return ResponseEntity.ok(reportes);
    }

    /**
     * POST /api/reportes : Registrar nuevo problema/incidencia.
     */
    @PostMapping
    public ResponseEntity<ReporteResponseDTO> crearReporte(@RequestBody CrearReporteDTO dto) {
        ReporteResponseDTO creado = reporteService.crearReporte(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    /**
     * PUT /api/reportes/{id} : Actualizar estado o detalles de la incidencia.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ReporteResponseDTO> actualizarReporte(@PathVariable Long id, @RequestBody ActualizarReporteDTO dto) {
        ReporteResponseDTO actualizado = reporteService.actualizarReporte(id, dto);
        return ResponseEntity.ok(actualizado);
    }
}

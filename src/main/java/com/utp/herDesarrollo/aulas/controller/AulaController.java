
package com.utp.herDesarrollo.aulas.controller;

import com.utp.herDesarrollo.aulas.model.Aula;
import com.utp.herDesarrollo.aulas.service.AulaService;
import com.utp.herDesarrollo.reportes.application.dto.ReporteResponseDTO;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/aulas")
public class AulaController {

    private final AulaService aulaService;

    public AulaController(AulaService aulaService) {
        this.aulaService = aulaService;
    }

    @GetMapping
    public List<Aula> listarAulas() {
        return aulaService.listarAulas();
    }

    @GetMapping("/{id}")
    public Aula obtenerAula(@PathVariable Long id) {
        return aulaService.obtenerAulaPorId(id);
    }

    @GetMapping("/{id}/reportes")
    public List<ReporteResponseDTO> listarReportesPorAula(@PathVariable Long id) {
        return aulaService.listarReportesPorAula(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('TECNICO', 'ADMIN')")
    public ResponseEntity<Aula> registrarAula(@RequestBody Aula aula) {
        Aula nuevaAula = aulaService.registrarAula(aula);
        return ResponseEntity.status(HttpStatus.CREATED).body(nuevaAula);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('TECNICO', 'ADMIN')")
    public Aula actualizarAula(
            @PathVariable Long id,
            @RequestBody Aula aula) {
        return aulaService.actualizarAula(id, aula);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('TECNICO', 'ADMIN')")
    public ResponseEntity<Void> eliminarAula(@PathVariable Long id) {
        aulaService.eliminarAula(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/buscar/estado/{estado}")
    public List<Aula> buscarPorEstado(@PathVariable String estado) {
        return aulaService.buscarPorEstado(estado);
    }

    @GetMapping("/buscar/capacidad")
    public List<Aula> buscarPorCapacidadMinima(
            @RequestParam int minima) {
        return aulaService.buscarPorCapacidadMinima(minima);
    }

    @GetMapping("/contar")
    public long contarPorEstado(@RequestParam String estado) {
        return aulaService.contarPorEstado(estado);
    }

    @GetMapping("/disponibles")
    public List<Aula> listarAulasDisponibles() {
        return aulaService.listarAulasDisponibles();
}
}

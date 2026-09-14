package com.utp.webIntegrado.aulas.controller;

import com.utp.webIntegrado.aulas.model.Aula;
import com.utp.webIntegrado.aulas.service.AulaService;
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

    @PostMapping
    public Aula registrarAula(@RequestBody Aula aula) {
        return aulaService.registrarAula(aula);
    }

    @PutMapping("/{id}")
    public Aula actualizarAula(@PathVariable Long id, @RequestBody Aula aula) {
    return aulaService.actualizarAula(id, aula);
}

}
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
}
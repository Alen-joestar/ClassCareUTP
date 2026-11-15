
package com.utp.herDesarrollo.aulas.service;

import com.utp.herDesarrollo.aulas.model.Aula;
import com.utp.herDesarrollo.aulas.repository.AulaRepository;
import com.utp.herDesarrollo.reportes.application.dto.ReporteResponseDTO;
import com.utp.herDesarrollo.reportes.domain.model.EstadoReporte;
import com.utp.herDesarrollo.reportes.domain.repository.ReporteRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class AulaService {

    private final AulaRepository aulaRepository;
    private final ReporteRepository reporteRepository;

    public AulaService(AulaRepository aulaRepository, ReporteRepository reporteRepository) {
        this.aulaRepository = aulaRepository;
        this.reporteRepository = reporteRepository;
    }

    @Transactional(readOnly = true)
    public List<Aula> listarAulas() {
        return aulaRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Aula obtenerAulaPorId(Long id) {
        return aulaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Aula no encontrada"));
    }

    @Transactional
    public Aula registrarAula(Aula aula) {
        if (aulaRepository.existsByCodigo(aula.getCodigo())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Ya existe un aula con el código: " + aula.getCodigo());
        }

        aula.setId(null);
        return aulaRepository.save(aula);
    }

    @Transactional
    public Aula actualizarAula(Long id, Aula datosAula) {
        Aula aula = obtenerAulaPorId(id);

        boolean codigoCambiado =
                !aula.getCodigo().equals(datosAula.getCodigo());

        if (codigoCambiado
                && aulaRepository.existsByCodigo(datosAula.getCodigo())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Ya existe un aula con el código: "
                            + datosAula.getCodigo());
        }

        aula.setCodigo(datosAula.getCodigo());
        aula.setUbicacion(datosAula.getUbicacion());
        aula.setCapacidad(datosAula.getCapacidad());
        aula.setEstado(datosAula.getEstado());

        return aulaRepository.save(aula);
    }

    @Transactional
    public void eliminarAula(Long id) {
        Aula aula = obtenerAulaPorId(id);
        if (reporteRepository.existsByAula_IdAndEstadoNot(id, EstadoReporte.RESUELTO)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No se puede eliminar el aula porque cuenta con incidencias pendientes o en atención asociadas");
        }
        aulaRepository.delete(aula);
    }

    @Transactional(readOnly = true)
    public List<ReporteResponseDTO> listarReportesPorAula(Long id) {
        obtenerAulaPorId(id);
        return reporteRepository.findByAula_IdOrderByFechaRegistroDesc(id).stream()
                .map(ReporteResponseDTO::fromDomain)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Aula> buscarPorEstado(String estado) {
        return aulaRepository.buscarPorEstado(estado);
    }

    @Transactional(readOnly = true)
    public List<Aula> buscarPorCapacidadMinima(int capacidad) {
        return aulaRepository.buscarPorCapacidadMinima(capacidad);
    }

    @Transactional(readOnly = true)
    public long contarPorEstado(String estado) {
        return aulaRepository.contarPorEstado(estado);
    }
}

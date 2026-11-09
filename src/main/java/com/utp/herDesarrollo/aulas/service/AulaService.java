
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
import java.util.Locale;

@Service
public class AulaService {

    private final AulaRepository aulaRepository;
    private final ReporteRepository reporteRepository;

    public AulaService(
            AulaRepository aulaRepository,
            ReporteRepository reporteRepository) {
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
                        HttpStatus.NOT_FOUND,
                        "Aula no encontrada"));
    }

    @Transactional
    public Aula registrarAula(Aula aula) {
        validarAula(aula);

        aula.setCodigo(aula.getCodigo().trim());
        aula.setUbicacion(aula.getUbicacion().trim());
        aula.setEstado(aula.getEstado().trim());

        if (aulaRepository.existsByCodigo(aula.getCodigo())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Ya existe un aula con el código: "
                            + aula.getCodigo());
        }

        aula.setId(null);
        return aulaRepository.save(aula);
    }

    @Transactional
    public Aula actualizarAula(Long id, Aula datosAula) {
        validarAula(datosAula);

        Aula aula = obtenerAulaPorId(id);

        String codigo = datosAula.getCodigo().trim();
        String ubicacion = datosAula.getUbicacion().trim();
        String estado = datosAula.getEstado().trim();

        boolean codigoCambiado =
                !aula.getCodigo().equalsIgnoreCase(codigo);

        if (codigoCambiado
                && aulaRepository.existsByCodigo(codigo)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Ya existe un aula con el código: " + codigo);
        }

        aula.setCodigo(codigo);
        aula.setUbicacion(ubicacion);
        aula.setCapacidad(datosAula.getCapacidad());
        aula.setEstado(estado);

        return aulaRepository.save(aula);
    }

    private void validarAula(Aula aula) {
        if (aula == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Los datos del aula son obligatorios");
        }

        if (aula.getCodigo() == null
                || aula.getCodigo().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El código del aula es obligatorio");
        }

        if (aula.getUbicacion() == null
                || aula.getUbicacion().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La ubicación del aula es obligatoria");
        }

        if (aula.getCapacidad() <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La capacidad debe ser mayor que cero");
        }

        if (aula.getEstado() == null
                || aula.getEstado().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El estado del aula es obligatorio");
        }

        String estado = aula.getEstado()
                .trim()
                .toLowerCase(Locale.ROOT);

        if (!estado.equals("disponible")
                && !estado.equals("ocupada")
                && !estado.equals("mantenimiento")
                && !estado.equals("en mantenimiento")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Estado no válido. Use Disponible, Ocupada "
                            + "o Mantenimiento");
        }
    }

    @Transactional
    public void eliminarAula(Long id) {
        Aula aula = obtenerAulaPorId(id);

        if (reporteRepository.existsByAula_IdAndEstadoNot(
                id, EstadoReporte.RESUELTO)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No se puede eliminar el aula porque cuenta "
                            + "con incidencias pendientes o en "
                            + "atención asociadas");
        }

        aulaRepository.delete(aula);
    }

    @Transactional(readOnly = true)
    public List<ReporteResponseDTO> listarReportesPorAula(Long id) {
        obtenerAulaPorId(id);

        return reporteRepository
                .findByAula_IdOrderByFechaRegistroDesc(id)
                .stream()
                .map(ReporteResponseDTO::fromDomain)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Aula> buscarPorEstado(String estado) {
        return aulaRepository.buscarPorEstado(estado);
    }

    @Transactional(readOnly = true)
    public List<Aula> buscarPorCapacidadMinima(int capacidad) {
        if (capacidad < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La capacidad mínima no puede ser negativa");
        }

        return aulaRepository.buscarPorCapacidadMinima(capacidad);
    }

    @Transactional(readOnly = true)
    public long contarPorEstado(String estado) {
        return aulaRepository.contarPorEstado(estado);
    }

    @Transactional(readOnly = true)
    public List<Aula> listarAulasDisponibles() {
        return aulaRepository.listarAulasDisponibles();
    }
}

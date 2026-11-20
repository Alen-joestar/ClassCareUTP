
package com.utp.herDesarrollo.aulas.service;

import com.utp.herDesarrollo.aulas.model.Aula;
import com.utp.herDesarrollo.aulas.repository.AulaRepository;
import com.utp.herDesarrollo.reportes.application.dto.ReporteResponseDTO;
import com.utp.herDesarrollo.reportes.domain.model.EstadoReporte;
import com.utp.herDesarrollo.reportes.domain.model.Prioridad;
import com.utp.herDesarrollo.reportes.domain.repository.ReporteRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

@Service
public class AulaService {

    private static final int CODIGO_MAX_LONGITUD = 30;
    private static final int UBICACION_MAX_LONGITUD = 120;
    private static final int CAPACIDAD_MAXIMA = 200;

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

        String codigo = normalizarCodigo(aula.getCodigo());

        if (aulaRepository.existsByCodigoIgnoreCase(codigo)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Ya existe un aula con el código: "
                            + codigo);
        }

        aula.setCodigo(codigo);
        aula.setUbicacion(aula.getUbicacion().trim());
        aula.setEstado(normalizarEstado(aula.getEstado()));
        aula.setId(null);
        return aulaRepository.save(aula);
    }

    @Transactional
    public Aula actualizarAula(Long id, Aula datosAula) {
        validarAula(datosAula);

        Aula aula = obtenerAulaPorId(id);

        String codigo = normalizarCodigo(datosAula.getCodigo());
        String ubicacion = datosAula.getUbicacion().trim();
        String estado = datosAula.getEstado().trim();

        if (aulaRepository.existsByCodigoIgnoreCaseAndIdNot(codigo, aula.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Ya existe un aula con el código: " + codigo);
        }

        String estadoNormalizado = normalizarEstado(estado);
        if (!"Mantenimiento".equals(estadoNormalizado)
                && requiereMantenimientoPorReportes(aula.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No se puede cambiar el aula a Disponible u Ocupada mientras "
                            + "tenga reportes de prioridad alta o en atención");
        }

        aula.setCodigo(codigo);
        aula.setUbicacion(ubicacion);
        aula.setCapacidad(datosAula.getCapacidad());
        aula.setEstado(estadoNormalizado);

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
        if (aula.getCodigo().trim().length() > CODIGO_MAX_LONGITUD) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El código del aula no puede superar "
                            + CODIGO_MAX_LONGITUD + " caracteres");
        }

        if (aula.getUbicacion() == null
                || aula.getUbicacion().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La ubicación del aula es obligatoria");
        }
        if (aula.getUbicacion().trim().length()
                > UBICACION_MAX_LONGITUD) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La ubicación no puede superar "
                            + UBICACION_MAX_LONGITUD + " caracteres");
        }

        if (aula.getCapacidad() < 1
                || aula.getCapacidad() > CAPACIDAD_MAXIMA) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La capacidad debe ser un número entero entre 1 y "
                            + CAPACIDAD_MAXIMA);
        }

        if (aula.getEstado() == null
                || aula.getEstado().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El estado del aula es obligatorio");
        }

        normalizarEstado(aula.getEstado());
    }

    private String normalizarEstado(String estado) {
        return switch (estado.trim().toLowerCase(Locale.ROOT)) {
            case "disponible" -> "Disponible";
            case "ocupada" -> "Ocupada";
            case "mantenimiento", "en mantenimiento" -> "Mantenimiento";
            default -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Estado no válido. Seleccione Disponible, Ocupada "
                            + "o Mantenimiento");
        };
    }

    private String normalizarCodigo(String codigo) {
        return codigo.trim().toUpperCase(Locale.ROOT);
    }

    private boolean requiereMantenimientoPorReportes(Long aulaId) {
        return reporteRepository.existsByAula_IdAndEstado(
                        aulaId, EstadoReporte.EN_ATENCION)
                || reporteRepository.existsByAula_IdAndEstadoNotAndPrioridad(
                        aulaId, EstadoReporte.RESUELTO, Prioridad.ALTA);
    }

    @Transactional
    public void eliminarAula(Long id) {
        Aula aula = obtenerAulaPorId(id);

        if (reporteRepository.existsByAula_Id(id)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No se puede eliminar el aula porque tiene reportes asociados; "
                            + "los reportes históricos deben conservar su aula");
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

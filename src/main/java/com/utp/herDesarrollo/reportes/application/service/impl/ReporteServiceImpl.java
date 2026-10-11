package com.utp.herDesarrollo.reportes.application.service.impl;

import com.utp.herDesarrollo.reportes.application.dto.ActualizarReporteDTO;
import com.utp.herDesarrollo.reportes.application.dto.CrearReporteDTO;
import com.utp.herDesarrollo.reportes.application.dto.ReporteResponseDTO;
import com.utp.herDesarrollo.reportes.application.exception.RecursoNoEncontradoException;
import com.utp.herDesarrollo.reportes.application.exception.ReglaNegocioException;
import com.utp.herDesarrollo.reportes.application.service.ReporteService;
import com.utp.herDesarrollo.reportes.domain.model.EstadoReporte;
import com.utp.herDesarrollo.reportes.domain.model.Prioridad;
import com.utp.herDesarrollo.reportes.domain.model.Reporte;
import com.utp.herDesarrollo.reportes.domain.repository.ReporteRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Implementación de la lógica de negocio para la gestión de incidencias.
 */
@Service
public class ReporteServiceImpl implements ReporteService {

    private final ReporteRepository reporteRepository;

    public ReporteServiceImpl(ReporteRepository reporteRepository) {
        this.reporteRepository = reporteRepository;
    }

    @Override
    public ReporteResponseDTO crearReporte(CrearReporteDTO dto) {
        if (dto == null) {
            throw new ReglaNegocioException("La solicitud para crear el reporte no puede ser nula");
        }
        if (dto.getAulaId() == null || dto.getAulaId().isBlank()) {
            throw new ReglaNegocioException("El código o identificador del aula es obligatorio");
        }
        if (dto.getDescripcion() == null || dto.getDescripcion().isBlank()) {
            throw new ReglaNegocioException("La descripción del problema es obligatoria");
        }
        if (dto.getTipoProblema() == null) {
            throw new ReglaNegocioException("El tipo de problema es obligatorio");
        }
        if (dto.getPrioridad() == null) {
            throw new ReglaNegocioException("La prioridad del reporte es obligatoria");
        }

        Reporte nuevoReporte = new Reporte(
                dto.getAulaId().trim().toUpperCase(),
                dto.getTipoProblema(),
                dto.getDescripcion().trim(),
                dto.getPrioridad(),
                EstadoReporte.PENDIENTE,
                LocalDateTime.now()
        );

        Reporte guardado = reporteRepository.save(nuevoReporte);
        return ReporteResponseDTO.fromDomain(guardado);
    }

    @Override
    public List<ReporteResponseDTO> listarTodos() {
        return reporteRepository.findAll().stream()
                .map(ReporteResponseDTO::fromDomain)
                .toList();
    }

    @Override
    public List<ReporteResponseDTO> listarConFiltros(String aulaId, Prioridad prioridad) {
        String aulaNormalizada = (aulaId != null && !aulaId.isBlank()) ? aulaId.trim() : null;

        List<Reporte> reportes;
        if (aulaNormalizada != null && prioridad != null) {
            reportes = reporteRepository.findByAulaIdAndPrioridad(aulaNormalizada, prioridad);
        } else if (aulaNormalizada != null) {
            reportes = reporteRepository.findByAulaId(aulaNormalizada);
        } else if (prioridad != null) {
            reportes = reporteRepository.findByPrioridad(prioridad);
        } else {
            reportes = reporteRepository.findAll();
        }

        return reportes.stream()
                .map(ReporteResponseDTO::fromDomain)
                .toList();
    }

    @Override
    public ReporteResponseDTO buscarPorId(Long id) {
        if (id == null) {
            throw new ReglaNegocioException("El ID del reporte no puede ser nulo");
        }
        return reporteRepository.findById(id)
                .map(ReporteResponseDTO::fromDomain)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró el reporte con ID: " + id));
    }

    @Override
    public List<ReporteResponseDTO> listarPorAulaId(String aulaId) {
        if (aulaId == null || aulaId.isBlank()) {
            return List.of();
        }
        return reporteRepository.findByAulaId(aulaId.trim()).stream()
                .map(ReporteResponseDTO::fromDomain)
                .toList();
    }

    @Override
    public ReporteResponseDTO actualizarReporte(Long id, ActualizarReporteDTO dto) {
        if (id == null) {
            throw new ReglaNegocioException("El ID del reporte no puede ser nulo");
        }
        if (dto == null) {
            throw new ReglaNegocioException("Los datos de actualización no pueden ser nulos");
        }

        Reporte reporteExistente = reporteRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró el reporte con ID: " + id));

        if (dto.getDescripcion() != null && !dto.getDescripcion().isBlank()) {
            reporteExistente.setDescripcion(dto.getDescripcion().trim());
        }
        if (dto.getTipoProblema() != null) {
            reporteExistente.setTipoProblema(dto.getTipoProblema());
        }
        if (dto.getPrioridad() != null) {
            reporteExistente.setPrioridad(dto.getPrioridad());
        }
        if (dto.getEstado() != null) {
            reporteExistente.setEstado(dto.getEstado());
        }

        Reporte actualizado = reporteRepository.save(reporteExistente);
        return ReporteResponseDTO.fromDomain(actualizado);
    }
}

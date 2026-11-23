package com.utp.herDesarrollo.reportes.application.service.impl;

import com.utp.herDesarrollo.aulas.model.Aula;
import com.utp.herDesarrollo.aulas.repository.AulaRepository;
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
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Implementación de la lógica de negocio para la gestión de incidencias.
 */
@Service
public class ReporteServiceImpl implements ReporteService {

    private final ReporteRepository reporteRepository;
    private final AulaRepository aulaRepository;

    public ReporteServiceImpl(ReporteRepository reporteRepository, AulaRepository aulaRepository) {
        this.reporteRepository = reporteRepository;
        this.aulaRepository = aulaRepository;
    }

    @Override
    @Transactional
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

        String aulaParam = dto.getAulaId().trim();
        Aula aula = aulaRepository.findByCodigoIgnoreCase(aulaParam)
                .or(() -> {
                    try {
                        Long aulaIdNum = Long.parseLong(aulaParam);
                        return aulaRepository.findById(aulaIdNum);
                    } catch (NumberFormatException e) {
                        return Optional.empty();
                    }
                })
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe un aula registrada con código o ID: " + aulaParam));

        // Regla de negocio: impedir duplicados activos (PENDIENTE o EN_ATENCION) del mismo tipo de problema en la misma aula
        if (aula.getId() != null && reporteRepository.existsByAula_IdAndTipoProblemaAndEstadoNot(
                aula.getId(),
                dto.getTipoProblema(),
                EstadoReporte.RESUELTO)) {
            throw new ReglaNegocioException(
                    "Ya existe un reporte activo (" + dto.getTipoProblema() + ") pendiente de solución en el aula " + aula.getCodigo()
            );
        }

        // Regla cruzada: si la incidencia es de prioridad ALTA, el aula pasa a Mantenimiento automáticamente
        if (dto.getPrioridad() == Prioridad.ALTA) {
            aula.setEstado("Mantenimiento");
            aulaRepository.save(aula);
        }

        Reporte nuevoReporte = new Reporte(
                aula,
                dto.getTipoProblema(),
                dto.getDescripcion().trim(),
                dto.getPrioridad(),
                EstadoReporte.PENDIENTE,
                LocalDateTime.now()
        );
        String autor = (dto.getReportadoPor() != null && !dto.getReportadoPor().isBlank())
                ? dto.getReportadoPor().trim()
                : "Comunidad Académica UTP";
        nuevoReporte.setReportadoPor(autor);

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
    @Transactional
    public ReporteResponseDTO actualizarReporte(Long id, ActualizarReporteDTO dto) {
        if (id == null) {
            throw new ReglaNegocioException("El ID del reporte no puede ser nulo");
        }
        if (dto == null) {
            throw new ReglaNegocioException("Los datos de actualización no pueden ser nulos");
        }

        Reporte reporteExistente = reporteRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró el reporte con ID: " + id));

        if (reporteExistente.getEstado() == EstadoReporte.RESUELTO
                && (dto.getEstado() == null || dto.getEstado() == EstadoReporte.RESUELTO)) {
            throw new ReglaNegocioException("No se pueden editar los datos de un reporte que ya se encuentra resuelto y cerrado");
        }

        if (dto.getDescripcion() != null && !dto.getDescripcion().isBlank()) {
            reporteExistente.setDescripcion(dto.getDescripcion().trim());
        }
        if (dto.getTipoProblema() != null) {
            if (reporteExistente.getAula() != null
                    && reporteExistente.getAula().getId() != null
                    && reporteRepository.existsByAula_IdAndTipoProblemaAndEstadoNotAndIdNot(
                            reporteExistente.getAula().getId(),
                            dto.getTipoProblema(),
                            EstadoReporte.RESUELTO,
                            reporteExistente.getId())) {
                throw new ReglaNegocioException(
                        "Ya existe otro reporte activo con la categoría " + dto.getTipoProblema() + " en el aula " + reporteExistente.getAulaId()
                );
            }
            reporteExistente.setTipoProblema(dto.getTipoProblema());
        }
        if (dto.getPrioridad() != null) {
            reporteExistente.setPrioridad(dto.getPrioridad());
        }
        if (dto.getEstado() != null) {
            reporteExistente.setEstado(dto.getEstado());
        }

        // Sincronización cruzada del estado del Aula según la etapa de atención y prioridad
        if (reporteExistente.getAula() != null) {
            Aula aula = reporteExistente.getAula();
            if (reporteExistente.getEstado() == EstadoReporte.RESUELTO) {
                long reportesActivosRestantes = reporteRepository.countByAula_IdAndEstadoNotAndIdNot(
                        aula.getId(),
                        EstadoReporte.RESUELTO,
                        reporteExistente.getId()
                );
                if (reportesActivosRestantes == 0) {
                    aula.setEstado("Disponible");
                    aulaRepository.save(aula);
                }
            } else if (reporteExistente.getEstado() == EstadoReporte.EN_ATENCION
                    || reporteExistente.getPrioridad() == Prioridad.ALTA) {
                aula.setEstado("Mantenimiento");
                aulaRepository.save(aula);
            }
        }

        Reporte actualizado = reporteRepository.save(reporteExistente);
        return ReporteResponseDTO.fromDomain(actualizado);
    }

    @Override
    @Transactional
    public void eliminarReporte(Long id) {
        if (id == null) {
            throw new ReglaNegocioException("El ID del reporte no puede ser nulo");
        }

        Reporte reporteExistente = reporteRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró el reporte con ID: " + id));

        Aula aulaAsociada = reporteExistente.getAula();
        reporteRepository.delete(reporteExistente);

        if (aulaAsociada != null) {
            long reportesActivosRestantes = reporteRepository.countByAula_IdAndEstadoNotAndIdNot(
                    aulaAsociada.getId(),
                    EstadoReporte.RESUELTO,
                    id
            );
            if (reportesActivosRestantes == 0 && "Mantenimiento".equalsIgnoreCase(aulaAsociada.getEstado())) {
                aulaAsociada.setEstado("Disponible");
                aulaRepository.save(aulaAsociada);
            }
        }
    }
}

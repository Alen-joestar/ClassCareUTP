package com.utp.herDesarrollo.atenciones.service;

import com.utp.herDesarrollo.atenciones.dto.ActualizarEstadoAtencionDTO;
import com.utp.herDesarrollo.atenciones.dto.AtencionResponseDTO;
import com.utp.herDesarrollo.atenciones.dto.CrearAtencionDTO;
import com.utp.herDesarrollo.atenciones.exception.AtencionNoEncontradaException;
import com.utp.herDesarrollo.atenciones.exception.ReglaNegocioAtencionException;
import com.utp.herDesarrollo.atenciones.model.Atencion;
import com.utp.herDesarrollo.atenciones.model.EstadoAtencion;
import com.utp.herDesarrollo.atenciones.repository.AtencionRepository;
import com.utp.herDesarrollo.reportes.application.exception.RecursoNoEncontradoException;
import com.utp.herDesarrollo.reportes.domain.model.Reporte;
import com.utp.herDesarrollo.reportes.domain.repository.ReporteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AtencionServiceImpl implements AtencionService {

    private final AtencionRepository atencionRepository;
    private final ReporteRepository reporteRepository;

    public AtencionServiceImpl(AtencionRepository atencionRepository,
                               ReporteRepository reporteRepository) {
        this.atencionRepository = atencionRepository;
        this.reporteRepository = reporteRepository;
    }

    @Override
    @Transactional
    public AtencionResponseDTO crearAtencion(CrearAtencionDTO dto) {
        if (dto == null) {
            throw new ReglaNegocioAtencionException("Los datos de la atención no pueden ser nulos");
        }
        if (dto.getReporteId() == null) {
            throw new ReglaNegocioAtencionException("El ID del reporte es obligatorio");
        }
        if (dto.getTecnicoEncargado() == null || dto.getTecnicoEncargado().isBlank()) {
            throw new ReglaNegocioAtencionException("El nombre del técnico encargado es obligatorio");
        }

        Reporte reporte = reporteRepository.findById(dto.getReporteId())
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No existe un reporte con ID: " + dto.getReporteId()));

        long atencionesActivas = atencionRepository.countByReporte_IdAndEstadoNot(
                dto.getReporteId(), EstadoAtencion.RESUELTO);
        if (atencionesActivas > 0) {
            throw new ReglaNegocioAtencionException(
                    "El reporte con ID " + dto.getReporteId() + " ya cuenta con una atención activa en curso");
        }

        Atencion nuevaAtencion = new Atencion(
                reporte,
                dto.getTecnicoEncargado().trim(),
                EstadoAtencion.PENDIENTE,
                dto.getObservaciones() != null ? dto.getObservaciones().trim() : null,
                LocalDateTime.now()
        );

        return AtencionResponseDTO.fromDomain(atencionRepository.save(nuevaAtencion));
    }

    @Override
    @Transactional(readOnly = true)
    public List<AtencionResponseDTO> listarTodas() {
        return atencionRepository.findAll().stream()
                .map(AtencionResponseDTO::fromDomain)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AtencionResponseDTO> listarPorEstado(EstadoAtencion estado) {
        if (estado == null) {
            throw new ReglaNegocioAtencionException("El estado de filtro no puede ser nulo");
        }
        return atencionRepository.findByEstado(estado).stream()
                .map(AtencionResponseDTO::fromDomain)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AtencionResponseDTO> listarPorReporte(Long reporteId) {
        if (reporteId == null) {
            throw new ReglaNegocioAtencionException("El ID del reporte no puede ser nulo");
        }
        return atencionRepository.findByReporteId(reporteId).stream()
                .map(AtencionResponseDTO::fromDomain)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AtencionResponseDTO> listarPorTecnico(String tecnico) {
        if (tecnico == null || tecnico.isBlank()) {
            throw new ReglaNegocioAtencionException("El nombre del técnico no puede estar vacío");
        }
        return atencionRepository.findByTecnicoEncargado(tecnico.trim()).stream()
                .map(AtencionResponseDTO::fromDomain)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public AtencionResponseDTO buscarPorId(Long id) {
        if (id == null) {
            throw new ReglaNegocioAtencionException("El ID de la atención no puede ser nulo");
        }
        return atencionRepository.findById(id)
                .map(AtencionResponseDTO::fromDomain)
                .orElseThrow(() -> new AtencionNoEncontradaException(
                        "No se encontró la atención con ID: " + id));
    }

    @Override
    @Transactional
    public AtencionResponseDTO actualizarEstado(Long id, ActualizarEstadoAtencionDTO dto) {
        if (id == null) {
            throw new ReglaNegocioAtencionException("El ID de la atención no puede ser nulo");
        }
        if (dto == null || dto.getNuevoEstado() == null) {
            throw new ReglaNegocioAtencionException("El nuevo estado es obligatorio");
        }

        Atencion atencion = atencionRepository.findById(id)
                .orElseThrow(() -> new AtencionNoEncontradaException(
                        "No se encontró la atención con ID: " + id));

        // Solo el técnico asignado puede actualizar el estado
        if (dto.getSolicitadoPor() != null && !dto.getSolicitadoPor().isBlank()) {
            if (!atencion.getTecnicoEncargado().equalsIgnoreCase(dto.getSolicitadoPor().trim())) {
                throw new ReglaNegocioAtencionException(
                        "Solo el técnico encargado '" + atencion.getTecnicoEncargado()
                        + "' puede modificar el estado de esta atención");
            }
        }

        validarTransicion(atencion.getEstado(), dto.getNuevoEstado());

        atencion.setEstado(dto.getNuevoEstado());

        if (dto.getObservaciones() != null && !dto.getObservaciones().isBlank()) {
            atencion.setObservaciones(dto.getObservaciones().trim());
        }
        if (dto.getNuevoEstado() == EstadoAtencion.RESUELTO) {
            atencion.setFechaResolucion(LocalDateTime.now());
        }

        return AtencionResponseDTO.fromDomain(atencionRepository.save(atencion));
    }

    private void validarTransicion(EstadoAtencion actual, EstadoAtencion nuevo) {
        boolean valida = switch (actual) {
            case PENDIENTE   -> nuevo == EstadoAtencion.EN_ATENCION;
            case EN_ATENCION -> nuevo == EstadoAtencion.RESUELTO;
            case RESUELTO    -> false;
        };
        if (!valida) {
            throw new ReglaNegocioAtencionException(
                    "Transición inválida: no se puede pasar de '" + actual + "' a '" + nuevo + "'. "
                    + "Flujo permitido: PENDIENTE → EN_ATENCION → RESUELTO");
        }
    }
}

package com.utp.herDesarrollo.reportes.application.service;

import com.utp.herDesarrollo.reportes.application.dto.ActualizarReporteDTO;
import com.utp.herDesarrollo.reportes.application.dto.CrearReporteDTO;
import com.utp.herDesarrollo.reportes.application.dto.ReporteResponseDTO;
import com.utp.herDesarrollo.reportes.domain.model.Prioridad;

import java.util.List;

/**
 * Contrato del servicio para la gestión de incidencias/reportes.
 */
public interface ReporteService {

    ReporteResponseDTO crearReporte(CrearReporteDTO dto);

    List<ReporteResponseDTO> listarTodos();

    List<ReporteResponseDTO> listarConFiltros(String aulaId, Prioridad prioridad);

    ReporteResponseDTO buscarPorId(Long id);

    List<ReporteResponseDTO> listarPorAulaId(String aulaId);

    ReporteResponseDTO actualizarReporte(Long id, ActualizarReporteDTO dto);
}

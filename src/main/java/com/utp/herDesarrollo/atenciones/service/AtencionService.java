package com.utp.herDesarrollo.atenciones.service;

import com.utp.herDesarrollo.atenciones.dto.ActualizarEstadoAtencionDTO;
import com.utp.herDesarrollo.atenciones.dto.AtencionResponseDTO;
import com.utp.herDesarrollo.atenciones.dto.CrearAtencionDTO;
import com.utp.herDesarrollo.atenciones.model.EstadoAtencion;

import java.util.List;

public interface AtencionService {

    AtencionResponseDTO crearAtencion(CrearAtencionDTO dto);

    List<AtencionResponseDTO> listarTodas();

    List<AtencionResponseDTO> listarPorEstado(EstadoAtencion estado);

    List<AtencionResponseDTO> listarPorReporte(Long reporteId);

    List<AtencionResponseDTO> listarPorTecnico(String tecnico);

    AtencionResponseDTO buscarPorId(Long id);

    AtencionResponseDTO actualizarEstado(Long id, ActualizarEstadoAtencionDTO dto);
}

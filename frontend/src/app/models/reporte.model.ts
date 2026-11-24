export type TipoProblema = 'TECNOLOGICO' | 'ELECTRICO' | 'MOBILIARIO' | 'INFRAESTRUCTURA' | 'OTRO';
export type Prioridad = 'ALTA' | 'MEDIA' | 'BAJA';
export type EstadoReporte = 'PENDIENTE' | 'EN_ATENCION' | 'RESUELTO';

export interface AulaDisponible {
  id?: number;
  codigo: string;
  ubicacion: string;
  capacidad?: number;
  estado?: string;
}

export interface Reporte {
  id: number;
  aulaId: string;
  aulaInternoId?: number;
  aulaUbicacion?: string;
  tipoProblema: TipoProblema;
  prioridad: Prioridad;
  estado: EstadoReporte;
  descripcion: string;
  fechaRegistro: string;
  reportadoPor?: string;
}

export interface CrearReportePayload {
  aulaId: string;
  aulaUbicacion: string;
  tipoProblema: TipoProblema;
  prioridad: Prioridad;
  descripcion: string;
}

/**
 * Contrato exacto de CrearReporteDTO en Spring Boot (POST /api/reportes)
 */
export interface CrearReporteRequestDTO {
  aulaId: string;
  tipoProblema: TipoProblema;
  descripcion: string;
  prioridad: Prioridad;
  reportadoPor?: string;
}

/**
 * Contrato exacto de ActualizarReporteDTO en Spring Boot (PUT /api/reportes/{id})
 */
export interface ActualizarReporteRequestDTO {
  descripcion: string;
  tipoProblema: TipoProblema;
  prioridad: Prioridad;
  estado: EstadoReporte;
}

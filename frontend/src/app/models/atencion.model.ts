export type EstadoAtencion = 'PENDIENTE' | 'EN_ATENCION' | 'RESUELTO';
export type TipoMantenimiento = 'CORRECTIVO' | 'PREVENTIVO';

export interface Atencion {
  id: number;
  reporteId: number;
  tecnicoEncargado: string;
  estado: EstadoAtencion;
  observaciones?: string;
  fechaRegistro: string;
  fechaResolucion?: string | null;
  // Campos enriquecidos para la mesa técnica en campus UTP
  aulaCodigo?: string;
  tipoProblema?: string;
  prioridad?: 'ALTA' | 'MEDIA' | 'BAJA';
  tipoMantenimiento?: TipoMantenimiento;
  impactoAcademico?: string;
}

export interface AtencionBackendDTO {
  id: number;
  reporteId: number;
  tecnicoEncargado: string;
  estado: EstadoAtencion;
  observaciones?: string;
  fechaRegistro: string;
  fechaResolucion?: string | null;
}

export interface CrearAtencionPayload {
  reporteId: number;
  tecnicoEncargado: string;
  observaciones?: string;
  aulaCodigo?: string;
  tipoProblema?: string;
  prioridad?: 'ALTA' | 'MEDIA' | 'BAJA';
  tipoMantenimiento?: TipoMantenimiento;
  impactoAcademico?: string;
}

export interface ActualizarEstadoPayload {
  nuevoEstado: EstadoAtencion;
  observaciones: string;
  solicitadoPor: string;
}

export interface FormularioResolucionData {
  observaciones: string;
  tipoSolucion: string;
  repuestoUtilizado?: string;
  confirmacionOperatividad: boolean;
}

export interface ReportePendienteAsignacion {
  id: number;
  aulaId: string;
  tipoProblema: string;
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA' | string;
  descripcion: string;
  fechaRegistro: string;
  aulaUbicacion?: string;
  estado?: string;
}

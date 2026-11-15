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
  // Campos enriquecidos para la mesa técnica
  aulaCodigo?: string;
  tipoProblema?: string;
  prioridad?: 'ALTA' | 'MEDIA' | 'BAJA';
  tipoMantenimiento?: TipoMantenimiento;
  impactoAcademico?: string;
}

export interface CrearAtencionPayload {
  reporteId: number;
  tecnicoEncargado: string;
  observaciones?: string;
}

export interface ActualizarEstadoPayload {
  nuevoEstado: EstadoAtencion;
  observaciones: string;
  solicitadoPor: string;
}

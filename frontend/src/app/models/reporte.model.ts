export type TipoProblema = 'TECNOLOGICO' | 'ELECTRICO' | 'MOBILIARIO' | 'INFRAESTRUCTURA' | 'OTRO';
export type Prioridad = 'ALTA' | 'MEDIA' | 'BAJA';
export type EstadoReporte = 'PENDIENTE' | 'EN_ATENCION' | 'RESUELTO';

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
}

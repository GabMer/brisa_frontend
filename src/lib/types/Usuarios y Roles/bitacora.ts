// src/types/bitacora.ts
export interface RegistroBitacora {
  id_bitacora: number;
  id_usuario_admin: number;
  usuario: string;
  nombre_completo: string;
  accion: string;
  descripcion: string;
  fecha_hora: string;
  tipo_objetivo: string | null;
  id_objetivo: number | null;
  icono: string;
}

export interface FiltrosBitacora {
  usuario_admin?: number;
  accion?: string;
  tipo_objetivo?: string;
  id_objetivo?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
}

export interface BitacoraResponse {
  items: RegistroBitacora[];
  total: number;
  page: number;
  pages: number;
  skip: number;
  limit: number;
  has_more: boolean;
  filtros_aplicados: FiltrosBitacora;
}

export interface EstadisticasBitacora {
  periodo: {
    dias: number;
    desde: string;
    hasta: string;
  };
  resumen: {
    total_registros: number;
  };
  acciones_comunes: Array<{
    accion: string;
    cantidad: number;
  }>;
  usuarios_activos: Array<{
    usuario: string;
    cantidad: number;
  }>;
  por_tipo_objetivo: Array<{
    tipo: string;
    cantidad: number;
  }>;
}

export interface TipoAccion {
  acciones: string[];
  total: number;
}
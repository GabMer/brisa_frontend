// src/types/auth.ts - Tipos actualizados con permisos por módulo

export interface LoginRequest {
  usuario: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    access_token: string;
    token_type: string;
    usuario_id: number;
    usuario: string;
    nombres: string;
    rol: string;
    permisos: string[];
    expires_in: number;
  };
}

// ========== NUEVOS TIPOS PARA PERMISOS DETALLADOS ==========

export interface PermisoDetallado {
  permiso: string; // "Lectura", "Agregar", etc.
  modulo: string;  // "usuarios", "incidentes", etc.
}

export interface PermisosPorModulo {
  [modulo: string]: string[]; // { "usuarios": ["Lectura", "Agregar"], ... }
}

export interface PermisosResponse {
  success: boolean;
  message: string;
  data: {
    usuario: string;
    permisos: PermisoDetallado[];
    permisos_por_modulo: PermisosPorModulo;
    modulos_accesibles: string[];
    acciones_disponibles: string[];
    es_administrador: boolean;
    roles: string[];
  };
}

// ========== TIPOS EXISTENTES (actualizados) ==========

export interface User {
  usuario_id: number;
  usuario: string;
  nombres: string;
  rol: string;
  permisos: string[]; // Mantener para compatibilidad
  // Nuevos campos detallados
  permisos_detallados?: PermisoDetallado[];
  permisos_por_modulo?: PermisosPorModulo;
  modulos_accesibles?: string[];
  acciones_disponibles?: string[];
  es_administrador?: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface ApiError {
  detail: string;
  status_code?: number;
}

// ========== MAPEO DE MÓDULOS A RUTAS ==========

export const MODULOS_RUTAS: Record<string, string> = {
  'usuarios': 'usuarios',
  'esquelas': 'esquelas',
  'incidentes': 'incidentes',
  'retiros_tempranos': 'retiros',
  'reportes': 'reportes',
  'profesores': 'profesores',
  'administracion': 'administracion'
};

// ========== MÓDULOS DEL SISTEMA ==========

export type ModuloSistema = 
  | 'usuarios'
  | 'esquelas'
  | 'incidentes'
  | 'retiros_tempranos'
  | 'reportes'
  | 'profesores'
  | 'administracion';
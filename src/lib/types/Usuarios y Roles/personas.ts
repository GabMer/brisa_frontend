// src/types/personas.ts - TIPOS ACTUALIZADOS

export type TipoPersona = 'profesor' | 'administrativo';

/**
 * Información de usuario asociado a persona
 */
export interface UsuarioInfo {
  id_usuario: number;
  usuario: string;
  correo: string;
  is_active: boolean;
  requiere_cambio_password?: boolean;
}

/**
 * Persona (solo lectura desde frontend)
 */
export interface Persona {
  id_persona: number;
  ci: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  nombre_completo: string;
  direccion: string | null;
  telefono: string | null;
  correo: string | null;
  tipo_persona: TipoPersona;
  is_active: boolean;
  
  tiene_usuario: boolean;
  usuario?: string | null;
  id_usuario?: number | null;
  usuario_info?: UsuarioInfo | null;
  usuario_activo?: boolean;
}


/**
 * DTO para crear usuario (NO persona)
 */
export interface UsuarioCreateDTO {
  id_persona: number;
  usuario: string;
  correo: string;
  password?: string;  // Opcional, se genera automáticamente si no se envía
  is_active?: boolean;
}

/**
 * DTO para actualizar usuario
 */
export interface UsuarioUpdateDTO {
  usuario?: string;
  correo?: string;
  password?: string;  // Solo si se quiere cambiar
  is_active?: boolean;
}

/**
 * DTO para cambiar contraseña (primer login)
 */
export interface CambiarPasswordDTO {
  password_actual: string;
  password_nueva: string;
  password_confirmacion: string;
}

/**
 * DTO para resetear contraseña (admin)
 */
export interface ResetPasswordDTO {
  id_usuario: number;
  generar_automatica: boolean;
  password_nueva?: string;
}

/**
 * Respuesta al crear usuario con credenciales
 */
export interface UsuarioConCredenciales {
  usuario: {
    id_usuario: number;
    id_persona: number;
    usuario: string;
    correo: string;
    is_active: boolean;
    requiere_cambio_password: boolean;
  };
  password_temporal: string;
  mensaje: string;
}

/**
 * Respuesta al resetear contraseña
 */
export interface ResetPasswordResponse {
  mensaje: string;
  usuario: string;
  password_temporal: string;
  advertencia: string;
}

/**
 * Estadísticas de personas
 */
export interface PersonasStats {
  total_personas: number;
  total_profesores: number;
  total_administrativos: number;
  personas_activas: number;
  personas_inactivas: number;
  personas_con_usuario: number;
  personas_sin_usuario: number;
}

/**
 * Filtros para listado
 */
export interface PersonaFiltros {
  tipo_persona?: TipoPersona;
  busqueda?: string;
  estado?: 'activo' | 'inactivo';
  skip?: number;
  limit?: number;
}

/**
 * Respuesta paginada
 */
export interface PersonasPaginatedResponse {
  items: Persona[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

/**
 * Respuesta genérica de la API
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  status_code?: number;
}
// src/types/users.ts - TIPOS CORREGIDOS Y ALINEADOS CON BACKEND

// ==========================================
// INTERFACES PRINCIPALES
// ==========================================

export interface User {
  id_usuario: number;         // Del backend
  id_persona: number;
  usuario: string;            // Del backend
  correo: string;             // Del backend
  is_active: boolean;         // Del backend
  roles?: Role[];
  ultimo_acceso?: string;     // Del backend
  fecha_creacion?: string;    // Del backend
}

export interface Role {
  id_rol: number;             // Del backend
  nombre: string;
  descripcion: string;
  is_active?: boolean;
  permisos?: Permission[];
  usuariosCount: number;      // Viene del backend
  permisosCount: number;      // Viene del backend
  fechaCreacion: string;      // Para compatibilidad con frontend
  fecha_creacion?: string;    // Del backend
}

export interface Permission {
  id_permiso: number;         // Del backend
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  modulo: string;
  accion: 'crear' | 'leer' | 'actualizar' | 'eliminar';
  is_active?: boolean;
  fecha_creacion?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: number | null;
  updated_by?: number | null;
}

export interface UsuarioRol {
  id: number;
  usuarioId: number;
  rolId: number;
  fechaAsignacion: string;
}

export interface AccessLog {
  id: number;
  usuarioId: number;
  usuario_id: number;
  fecha: string;
  accion: string;
  ip: string;
  estado: 'exitoso' | 'fallido' | 'bloqueado';
  detalles?: string;
}

export interface UsersStats {
  totalUsuarios: number;
  rolesActivos: number;
  totalPermisos: number;
  accesosHoy: number;
}

// ==========================================
// DTOs PARA CREAR/ACTUALIZAR
// ==========================================

export interface PermisoCreateDTO {
  nombre: string;
  codigo: string;
  descripcion?: string;
  modulo: string;
  accion: 'crear' | 'leer' | 'actualizar' | 'eliminar';
}

export interface PermisoUpdateDTO {
  nombre?: string;
  codigo?: string;
  descripcion?: string;
  modulo?: string;
  accion?: 'crear' | 'leer' | 'actualizar' | 'eliminar';
}

export interface RolCreateDTO {
  nombre: string;
  descripcion: string;
}

export interface RolUpdateDTO {
  nombre?: string;
  descripcion?: string;
}

export interface UsuarioCreateDTO {
  id_persona: number;
  usuario: string;
  correo: string;
  password: string;
}

export interface UsuarioUpdateDTO {
  usuario?: string;
  correo?: string;
  password?: string;
  is_active?: boolean;
}

// ==========================================
// HELPERS PARA COMPATIBILIDAD (OPCIONAL)
// ==========================================

/**
 * Convierte un User del backend a formato legacy si es necesario
 * Útil para componentes que todavía usan nombres antiguos
 */
export function userToLegacyFormat(user: User) {
  return {
    id: user.id_usuario,
    nombre: user.usuario,
    username: user.usuario,
    email: user.correo,
    rol: user.roles?.[0]?.nombre || 'Sin rol',
    estado: user.is_active ? 'activo' : 'inactivo',
    ultimoAcceso: user.ultimo_acceso || new Date().toISOString(),
    fechaCreacion: user.fecha_creacion || new Date().toISOString()
  };
}

/**
 * Convierte un Role del backend a formato legacy
 */
export function roleToLegacyFormat(role: Role) {
  return {
    id: role.id_rol,
    nombre: role.nombre,
    descripcion: role.descripcion,
    usuariosCount: role.usuariosCount,
    permisosCount: role.permisosCount,
    fechaCreacion: role.fechaCreacion || role.fecha_creacion || new Date().toISOString()
  };
}

/**
 * Convierte un Permission del backend a formato legacy
 */
export function permissionToLegacyFormat(permission: Permission) {
  return {
    id: permission.id_permiso,
    codigo: permission.codigo,
    nombre: permission.nombre,
    descripcion: permission.descripcion || '',
    modulo: permission.modulo,
    accion: permission.accion
  };
}
// src/services/PermissionsService.ts - VERSIÓN COMPLETA CON TODAS LAS FUNCIONALIDADES
import type { Permission, PermisoCreateDTO, PermisoUpdateDTO } from '../../types/Usuarios y Roles/users';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface APIResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export class PermissionsService {
  // ------------------------------
  // OBTENER HEADERS DE AUTORIZACIÓN
  // ------------------------------
  private static async getAuthHeaders() {
    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error('No autenticado. Por favor inicia sesión.');
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // ------------------------------
  // LISTAR PERMISOS
  // ------------------------------
  static async listarPermisos(
    skip: number = 0,
    limit: number = 100,
    modulo?: string
  ): Promise<Permission[]> {
    try {
      const headers = await this.getAuthHeaders();

      // ✅ RUTA CORREGIDA: /auth/permisos en vez de /usuarios/permisos
      let url = `${API_BASE_URL}/auth/permisos?skip=${skip}&limit=${limit}`;

      // Solo agregar módulo si tiene un valor válido y no vacío
      if (modulo && modulo.trim() !== '' && modulo !== 'undefined' && modulo !== 'null') {
        url += `&modulo=${encodeURIComponent(modulo.trim())}`;
      }

      console.log("🔍 Llamando a:", url);
      console.log("📦 Parámetros:", { skip, limit, modulo });

      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      console.log("📡 Status:", response.status);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        }

        if (response.status === 422) {
          const errorData = await response.json();
          console.error('❌ Error 422 - Detalle completo:', errorData);
          console.error('❌ URL que causó el error:', url);
          throw new Error(`Error de validación: ${JSON.stringify(errorData.detail || errorData)}`);
        }

        try {
          const errorData = await response.json();
          throw new Error(errorData.detail || `Error ${response.status}`);
        } catch {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const result: APIResponse<Permission[]> = await response.json();
      console.log("✅ Permisos recibidos:", result.data?.length || 0);

      return result.data || [];

    } catch (error) {
      console.error('❌ Error al listar permisos:', error);
      throw error;
    }
  }

  // ------------------------------
  // OBTENER PERMISO POR ID
  // ------------------------------
  static async obtenerPermiso(idPermiso: number): Promise<Permission> {
    try {
      const headers = await this.getAuthHeaders();

      // ✅ RUTA CORREGIDA
      const response = await fetch(
        `${API_BASE_URL}/auth/permisos/${idPermiso}`,
        { method: 'GET', headers }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        }
        if (response.status === 404) {
          throw new Error('Permiso no encontrado');
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result: APIResponse<Permission> = await response.json();
      return result.data;

    } catch (error) {
      console.error('❌ Error al obtener permiso:', error);
      throw error;
    }
  }

  // ------------------------------
  // CREAR PERMISO
  // ------------------------------
  static async crearPermiso(permiso: PermisoCreateDTO): Promise<Permission> {
    try {
      const headers = await this.getAuthHeaders();

      // ✅ RUTA CORREGIDA
      const response = await fetch(
        `${API_BASE_URL}/auth/permisos`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(permiso)
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        }
        if (response.status === 409) {
          throw new Error('Ya existe un permiso con ese nombre o código');
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || `Error ${response.status}`);
      }

      const result: APIResponse<Permission> = await response.json();
      return result.data;

    } catch (error) {
      console.error('❌ Error al crear permiso:', error);
      throw error;
    }
  }

  // ------------------------------
  // ACTUALIZAR PERMISO
  // ------------------------------
  static async actualizarPermiso(
    idPermiso: number,
    permiso: PermisoUpdateDTO
  ): Promise<Permission> {
    try {
      const headers = await this.getAuthHeaders();

      // ✅ RUTA CORREGIDA
      const response = await fetch(
        `${API_BASE_URL}/auth/permisos/${idPermiso}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify(permiso)
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        }
        if (response.status === 404) {
          throw new Error('Permiso no encontrado');
        }
        if (response.status === 409) {
          throw new Error('Ya existe un permiso con ese nombre o código');
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || `Error ${response.status}`);
      }

      const result: APIResponse<Permission> = await response.json();
      return result.data;

    } catch (error) {
      console.error('❌ Error al actualizar permiso:', error);
      throw error;
    }
  }

  // ------------------------------
  // ELIMINAR PERMISO
  // ------------------------------
  static async eliminarPermiso(idPermiso: number): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();

      // ✅ RUTA CORREGIDA
      const response = await fetch(
        `${API_BASE_URL}/auth/permisos/${idPermiso}`,
        { method: 'DELETE', headers }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        }
        if (response.status === 404) {
          throw new Error('Permiso no encontrado');
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || `Error al eliminar permiso: ${response.status}`);
      }

      console.log('✅ Permiso eliminado exitosamente');
    } catch (error) {
      console.error('❌ Error al eliminar permiso:', error);
      throw error;
    }
  }

  // ------------------------------
  // ASIGNAR PERMISOS A UN ROL
  // ------------------------------
  static async asignarPermisosRol(
    idRol: number,
    permisosIds: number[]
  ): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();

      // ✅ RUTA CORREGIDA: /auth/roles/{id}/permisos
      const response = await fetch(
        `${API_BASE_URL}/auth/roles/${idRol}/permisos`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(permisosIds)
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        }
        if (response.status === 404) {
          throw new Error('Rol no encontrado');
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || `Error ${response.status}`);
      }

      console.log('✅ Permisos asignados al rol exitosamente');
    } catch (error) {
      console.error('❌ Error al asignar permisos:', error);
      throw error;
    }
  }

  // ------------------------------
  // OBTENER MÓDULOS ÚNICOS
  // ------------------------------
  static async obtenerModulos(): Promise<string[]> {
    try {
      const permisos = await this.listarPermisos(0, 1000);
      const modulos = new Set(
        permisos
          .map(p => p.modulo)
          .filter(m => m && m.trim() !== '')
      );
      return Array.from(modulos).sort();
    } catch (error) {
      console.error('❌ Error al obtener módulos:', error);
      throw error;
    }
  }

  // ------------------------------
  // OBTENER ACCIONES ÚNICAS
  // ------------------------------
  static async obtenerAcciones(): Promise<string[]> {
    try {
      const permisos = await this.listarPermisos(0, 1000);
      const acciones = new Set(
        permisos
          .map(p => p.accion)
          .filter(a => a !== null && a !== undefined)
      );
      return Array.from(acciones).sort();
    } catch (error) {
      console.error('❌ Error al obtener acciones:', error);
      throw error;
    }
  }

  // ------------------------------
  // OBTENER ROLES QUE TIENEN UN PERMISO
  // ------------------------------
  static async obtenerRolesConPermiso(idPermiso: number): Promise<any[]> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(
        `${API_BASE_URL}/auth/permisos/${idPermiso}/roles`,
        { method: 'GET', headers }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        }
        if (response.status === 404) {
          throw new Error('Permiso no encontrado');
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || `Error ${response.status}`);
      }

      const result: APIResponse<any[]> = await response.json();
      return result.data || [];

    } catch (error) {
      console.error('❌ Error al obtener roles con permiso:', error);
      throw error;
    }
  }
}
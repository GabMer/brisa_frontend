// src/services/rolesService.ts - RUTAS CORREGIDAS
const API_BASE_URL = 'http://localhost:8000/api';

async function getAuthHeaders() {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('No autenticado. Por favor inicia sesión.');
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

export const RolesService = {
  /**
   * Listar todos los roles con contadores
   */
  async listarRoles() {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/auth/roles`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        }
        throw new Error(`Error al obtener roles: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Respuesta del backend (roles):', data);

      // El backend devuelve los roles con usuariosCount y permisosCount
      return data.data || data || [];
    } catch (error) {
      console.error('❌ Error en listarRoles:', error);
      throw error;
    }
  },

  /**
   * Crear nuevo rol
   */
  async crearRol(data: { nombre: string; descripcion: string }) {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/auth/roles`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al crear rol');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('❌ Error en crearRol:', error);
      throw error;
    }
  },

  /**
   * Actualizar rol existente
   */
  async actualizarRol(roleId: number, data: { nombre: string; descripcion: string }) {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/auth/roles/${roleId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al actualizar rol');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('❌ Error en actualizarRol:', error);
      throw error;
    }
  },

  /**
   * ✅ ELIMINAR ROL DEL SISTEMA (borrado lógico)
   * Ruta: DELETE /api/auth/roles/{id_rol}
   */
  // ✅ VERSIÓN CORREGIDA - Solución de errores de sintaxis

  async eliminarRol(roleId: number) {
    try {
      const headers = await getAuthHeaders();
      // ✅ Paréntesis correctos en console.log
      console.log(`🗑️ Eliminando rol del sistema: ${roleId}`);

      // ✅ Paréntesis correctos en fetch
      const response = await fetch(`${API_BASE_URL}/auth/roles/${roleId}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        }
        if (response.status === 403) {
          throw new Error('No tienes permisos para eliminar roles');
        }
        if (response.status === 404) {
          throw new Error('El rol no existe o ya fue eliminado');
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al eliminar rol');
      }

      const result = await response.json();
      console.log('✅ Rol eliminado exitosamente');

      // ✅ El backend devuelve ResponseModel con estructura {success, message, data}
      return result.data || result;

    } catch (error) {
      console.error('❌ Error en eliminarRol:', error);
      throw error;
    }
  },

  /**
   * ✅ ASIGNAR ROL A USUARIO
   * Ruta: POST /api/auth/usuarios/{id_usuario}/roles/{id_rol}
   */
  async asignarRolUsuario(userId: number, roleId: number) {
    try {
      const headers = await getAuthHeaders();
      console.log(`👤 Asignando rol ${roleId} al usuario ${userId}`);

      const response = await fetch(`${API_BASE_URL}/auth/usuarios/${userId}/roles/${roleId}`, {
        method: 'POST',
        headers
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        }
        if (response.status === 403) {
          throw new Error('No tienes permisos para asignar roles');
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al asignar rol');
      }

      const result = await response.json();
      console.log('✅ Rol asignado exitosamente al usuario');
      return result.data;
    } catch (error) {
      console.error('❌ Error en asignarRolUsuario:', error);
      throw error;
    }
  },

  /**
   * ✅ REVOCAR ROL DE USUARIO
   * Ruta: DELETE /api/auth/usuarios/{id_usuario}/roles/{id_rol}
   */
  async revocarRolUsuario(userId: number, roleId: number) {
    try {
      const headers = await getAuthHeaders();
      console.log(`👤 Revocando rol ${roleId} del usuario ${userId}`);

      const response = await fetch(`${API_BASE_URL}/auth/usuarios/${userId}/roles/${roleId}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        }
        if (response.status === 403) {
          throw new Error('No tienes permisos para revocar roles');
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al revocar rol');
      }

      const result = await response.json();
      console.log('✅ Rol revocado exitosamente del usuario');
      return result.data;
    } catch (error) {
      console.error('❌ Error en revocarRolUsuario:', error);
      throw error;
    }
  },

  /**
   * Obtener un rol específico por ID con todos sus detalles
   */
  async obtenerRol(roleId: number) {
    try {
      const headers = await getAuthHeaders();
      console.log(`📋 Obteniendo detalles del rol: ${roleId}`);

      const response = await fetch(`${API_BASE_URL}/auth/roles/${roleId}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        }
        if (response.status === 404) {
          throw new Error('El rol no existe o fue eliminado');
        }
        throw new Error(`Error al obtener rol: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Detalles del rol obtenidos:', result.data);
      return result.data;
    } catch (error) {
      console.error('❌ Error en obtenerRol:', error);
      throw error;
    }
  },

  /**
   * Obtener permisos de un rol específico
   */
  async obtenerPermisosRol(roleId: number) {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/auth/roles/${roleId}/permisos`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        }
        throw new Error(`Error al obtener permisos del rol: ${response.status}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('❌ Error en obtenerPermisosRol:', error);
      throw error;
    }
  },

  /**
 * Obtener usuarios asignados a un rol específico
 * GET /api/auth/roles/{id_rol}/usuarios
 */
  async obtenerUsuariosRol(roleId: number) {
    try {
      const headers = await getAuthHeaders();
      console.log(`👥 Obteniendo usuarios del rol: ${roleId}`);

      const response = await fetch(`${API_BASE_URL}/auth/roles/${roleId}/usuarios`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        }
        if (response.status === 404) {
          console.warn('No se encontraron usuarios para este rol');
          return [];
        }
        throw new Error(`Error al obtener usuarios del rol: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Usuarios del rol obtenidos:', result.data);
      return result.data || [];
    } catch (error) {
      console.error('❌ Error en obtenerUsuariosRol:', error);
      // Retornar array vacío en caso de error para no romper la UI
      return [];
    }
  },

  /**
 * Asignar permisos a un rol
 */
  async asignarPermisosRol(roleId: number, permisosIds: number[]) {
      try {
        const headers = await getAuthHeaders();
        console.log(`🔐 Asignando ${permisosIds.length} permisos al rol ${roleId}`);

        const response = await fetch(`${API_BASE_URL}/auth/roles/${roleId}/permisos`, {
          method: 'POST',
          headers,
          body: JSON.stringify(permisosIds)
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
          }
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Error al asignar permisos');
        }

        const result = await response.json();
        console.log('✅ Permisos asignados exitosamente');
        return result.data;
      } catch (error) {
        console.error('❌ Error en asignarPermisosRol:', error);
        throw error;
      }
    }

};
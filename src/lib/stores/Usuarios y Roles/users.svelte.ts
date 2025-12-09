// src/stores/users.svelte.ts - CONTADOR USUARIOS POR ROL CORREGIDO
import type { User, Role, Permission, AccessLog, UsersStats } from '../../types/Usuarios y Roles/users';
import { PermissionsService } from '../../services/Usuarios y Roles/PermissionsService';
import { RolesService } from '../../services/Usuarios y Roles/rolesService';

const API_BASE_URL = 'http://localhost:8000/api';

class UsersStore {
  users = $state<User[]>([]);
  roles = $state<Role[]>([]);
  permissions = $state<Permission[]>([]);
  accessLogs = $state<AccessLog[]>([]);
  stats = $state<UsersStats | null>(null);
  selectedUser = $state<User | null>(null);
  selectedPermission = $state<Permission | null>(null);
  isLoading = $state(false);
  error = $state<string | null>(null);

  private async getAuthHeaders() {
    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error('No autenticado. Por favor inicia sesión.');
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Función para contar accesos de hoy
  private countTodayAccesses(logs: AccessLog[]): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    return logs.filter(log => {
      const logDate = new Date(log.fecha);
      return logDate >= today && logDate <= todayEnd && log.estado === 'exitoso';
    }).length;
  }

  async loadUsers() {
    console.log('🔄 Iniciando carga de datos desde el store...');
    this.isLoading = true;
    this.error = null;

    try {
      const headers = await this.getAuthHeaders();

      // ========== CARGAR USUARIOS ==========
      const usersRes = await fetch(`${API_BASE_URL}/auth/usuarios`, {
        method: 'GET',
        headers
      });

      if (!usersRes.ok) {
        if (usersRes.status === 401) {
          throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        }
        throw new Error(`Error al cargar usuarios: ${usersRes.status}`);
      }

      const usersData = await usersRes.json();
      this.users = (usersData.data || usersData || []).map((u: any) => ({
        id_usuario: u.id_usuario,
        id_persona: u.id_persona,
        usuario: u.usuario,
        correo: u.correo,
        is_active: u.is_active !== undefined ? u.is_active : true,
        roles: u.roles || [],
        ultimo_acceso: u.ultimo_acceso || new Date().toISOString(),
        fecha_creacion: u.fecha_creacion || new Date().toISOString()
      }));

      console.log('✅ Usuarios cargados:', this.users.length);
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Error al cargar usuarios';
      console.error('❌ Error en loadUsers:', err);
    }

    // ========== CARGAR ROLES ==========
    try {
      const rolesData = await RolesService.listarRoles();

      // ✅ El backend YA devuelve usuariosCount y permisosCount
      this.roles = rolesData.map((r: any) => ({
        id_rol: r.id || r.id_rol, // Manejar ambos nombres de campo
        nombre: r.nombre,
        descripcion: r.descripcion || 'Sin descripción',
        is_active: r.is_active !== undefined ? r.is_active : true,
        permisos: r.permisos || [],
        // ✅ USAR LOS CONTADORES DEL BACKEND
        usuariosCount: r.usuariosCount || 0,
        permisosCount: r.permisosCount || (r.permisos?.length || 0),
        fechaCreacion: r.fechaCreacion || r.created_at || new Date().toISOString(),
        fecha_creacion: r.created_at || r.fechaCreacion || new Date().toISOString()
      }));

      console.log('✅ Roles cargados:', this.roles.length);
      console.log('📊 Ejemplo de rol con contador:', this.roles[0]);
    } catch (rolError) {
      console.error('⚠️ Error al cargar roles:', rolError);
      this.roles = [];
    }

    // ========== CARGAR PERMISOS ==========
    try {
      const permisosData = await PermissionsService.listarPermisos();
      this.permissions = permisosData;
      console.log('✅ Permisos cargados:', this.permissions.length);
    } catch (permError) {
      console.error('⚠️ Error al cargar permisos:', permError);
      this.permissions = [];
    }

    // ========== CARGAR BITÁCORA ==========
    try {
      const headers = await this.getAuthHeaders();
      const logsRes = await fetch(`${API_BASE_URL}/bitacora/login-logs`, {
        method: 'GET',
        headers
      });

      if (logsRes.ok) {
        const logsData = await logsRes.json();

        // El backend devuelve { success, message, data: { logs: [...] } }
        const registros = logsData.data?.logs || [];

        this.accessLogs = registros.map((log: any) => ({
          id: log.id_log,
          usuarioId: log.usuario_id,
          usuario_id: log.usuario_id,
          fecha: log.fecha_hora,
          accion: log.estado === 'exitoso' ? 'LOGIN_EXITOSO' : 'LOGIN_FALLIDO',
          ip: log.ip_address || 'N/A',
          estado: log.estado,
          detalles: log.user_agent
        }));

        console.log('✅ Login logs cargados:', this.accessLogs.length);
      } else {
        this.accessLogs = [];
      }
    } catch (logError) {
      console.error('⚠️ Error al cargar logs:', logError);
      this.accessLogs = [];
    }

    // ========== CALCULAR ESTADÍSTICAS ==========
    const accesosHoy = this.countTodayAccesses(this.accessLogs);

    this.stats = {
      totalUsuarios: this.users.length,
      rolesActivos: this.roles.filter(r => r.is_active).length,
      totalPermisos: this.permissions.length,
      accesosHoy: accesosHoy
    };

    console.log('📊 Estadísticas:', this.stats);
    console.log('🔢 Accesos hoy calculados:', accesosHoy);
  }

  async refreshPermissions() {
    try {
      console.log('🔄 Refrescando permisos...');
      const permisosData = await PermissionsService.listarPermisos();
      this.permissions = permisosData;

      if (this.stats) {
        this.stats.totalPermisos = this.permissions.length;
      }

      console.log('✅ Permisos refrescados:', this.permissions.length);
    } catch (error) {
      console.error('❌ Error al refrescar permisos:', error);
      throw error;
    }
  }

  async refreshRoles() {
    try {
      console.log('🔄 Refrescando roles...');
      const rolesData = await RolesService.listarRoles();

      // ✅ El backend YA devuelve usuariosCount y permisosCount
      this.roles = rolesData.map((r: any) => ({
        id_rol: r.id || r.id_rol,
        nombre: r.nombre,
        descripcion: r.descripcion || 'Sin descripción',
        is_active: r.is_active !== undefined ? r.is_active : true,
        permisos: r.permisos || [],
        // ✅ USAR LOS CONTADORES DEL BACKEND
        usuariosCount: r.usuariosCount || 0,
        permisosCount: r.permisosCount || (r.permisos?.length || 0),
        fechaCreacion: r.fechaCreacion || r.created_at || new Date().toISOString(),
        fecha_creacion: r.created_at || r.fechaCreacion || new Date().toISOString()
      }));

      if (this.stats) {
        this.stats.rolesActivos = this.roles.filter(r => r.is_active).length;
      }

      console.log('✅ Roles refrescados:', this.roles.length);
    } catch (error) {
      console.error('❌ Error al refrescar roles:', error);
      throw error;
    }
  }



  selectUser(user: User | null) {
    this.selectedUser = user;
  }

  selectPermission(permission: Permission | null) {
    this.selectedPermission = permission;
  }

  async createUser(data: Partial<User>) {
    try {
      const headers = await this.getAuthHeaders();

      const res = await fetch(`${API_BASE_URL}/auth/usuarios`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        }
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Error al crear usuario');
      }

      const result = await res.json();
      const createdUser = result.data;

      this.users = [...this.users, createdUser];

      if (this.stats) {
        this.stats.totalUsuarios = this.users.length;
      }

      return createdUser;
    } catch (err) {
      console.error('Error al crear usuario:', err);
      throw err;
    }
  }

  async updateUser(id: number, data: Partial<User>) {
    try {
      const headers = await this.getAuthHeaders();

      const res = await fetch(`${API_BASE_URL}/auth/usuarios/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        }
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Error al actualizar usuario');
      }

      const result = await res.json();
      const updated = result.data;

      this.users = this.users.map(u => u.id_usuario === id ? updated : u);

      return updated;
    } catch (err) {
      console.error('Error al actualizar usuario:', err);
      throw err;
    }
  }

  async deleteUser(id: number) {
    try {
      const headers = await this.getAuthHeaders();

      console.log('🗑️ Eliminando usuario:', id);

      const res = await fetch(`${API_BASE_URL}/auth/usuarios/${id}`, {
        method: 'DELETE',
        headers
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        }
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Error al eliminar usuario');
      }

      this.users = this.users.filter(u => u.id_usuario !== id);

      if (this.stats) {
        this.stats.totalUsuarios = this.users.length;
      }

      console.log('✅ Usuario eliminado exitosamente');
    } catch (err) {
      console.error('❌ Error al eliminar usuario:', err);
      throw err;
    }
  }

  async createPermission(data: {
    nombre: string;
    descripcion: string;
    modulo: string;
    codigo: string;
    accion: 'crear' | 'leer' | 'actualizar' | 'eliminar';
  }) {
    try {
      const newPermission = await PermissionsService.crearPermiso(data);
      this.permissions = [...this.permissions, newPermission];

      if (this.stats) {
        this.stats.totalPermisos = this.permissions.length;
      }

      return newPermission;
    } catch (err) {
      console.error('Error al crear permiso:', err);
      throw err;
    }
  }

  async updatePermission(id: number, data: {
    nombre?: string;
    descripcion?: string;
    modulo?: string;
    codigo?: string;
    accion?: 'crear' | 'leer' | 'actualizar' | 'eliminar';
  }) {
    try {
      const updated = await PermissionsService.actualizarPermiso(id, data);
      this.permissions = this.permissions.map(p => p.id_permiso === id ? updated : p);
      return updated;
    } catch (err) {
      console.error('Error al actualizar permiso:', err);
      throw err;
    }
  }

  async deletePermission(id: number) {
    try {
      await PermissionsService.eliminarPermiso(id);
      this.permissions = this.permissions.filter(p => p.id_permiso !== id);

      if (this.stats) {
        this.stats.totalPermisos = this.permissions.length;
      }
    } catch (err) {
      console.error('Error al eliminar permiso:', err);
      throw err;
    }
  }

  async createRole(data: { nombre: string; descripcion: string }) {
    try {
      const newRole = await RolesService.crearRol(data);

      // ✅ Refrescar roles para obtener datos actualizados del backend
      await this.refreshRoles();

      return newRole;
    } catch (err) {
      console.error('Error al crear rol:', err);
      throw err;
    }
  }

  async updateRole(roleId: number, data: { nombre: string; descripcion: string }) {
    try {
      console.log('🔄 Actualizando rol:', roleId);
      const updatedRole = await RolesService.actualizarRol(roleId, data);

      // ✅ Refrescar roles para obtener datos actualizados del backend (incluyendo contadores)
      await this.refreshRoles();

      console.log('✅ Rol actualizado exitosamente');
      return updatedRole;
    } catch (err) {
      console.error('❌ Error al actualizar rol:', err);
      throw err;
    }
  }

  async assignRoleToUser(userId: number, roleId: number) {
    try {
      await RolesService.asignarRolUsuario(userId, roleId);
      // ✅ Refrescar roles para actualizar el contador
      await this.refreshRoles();
      await this.loadUsers();
    } catch (err) {
      console.error('Error al asignar rol:', err);
      throw err;
    }
  }

  async revokeRoleFromUser(userId: number, roleId: number) {
    try {
      await RolesService.revocarRolUsuario(userId, roleId);
      // ✅ Refrescar roles para actualizar el contador
      await this.refreshRoles();
      await this.loadUsers();
    } catch (err) {
      console.error('Error al revocar rol:', err);
      throw err;
    }
  }

  async assignPermissionsToRole(roleId: number, permissionIds: number[]) {
    try {
      await PermissionsService.asignarPermisosRol(roleId, permissionIds);
      // ✅ Refrescar roles para actualizar el contador de permisos
      await this.refreshRoles();
    } catch (err) {
      console.error('Error al asignar permisos:', err);
      throw err;
    }
  }

  async deleteRole(roleId: number) {
    try {
      console.log('🗑️ Eliminando rol desde store:', roleId);

      await RolesService.eliminarRol(roleId);

      // Remover el rol de la lista local
      this.roles = this.roles.filter(r => r.id_rol !== roleId);

      // Actualizar estadísticas
      if (this.stats) {
        this.stats.rolesActivos = this.roles.filter(r => r.is_active).length;
      }

      console.log('✅ Rol eliminado exitosamente del store');
    } catch (err) {
      console.error('❌ Error al eliminar rol en store:', err);
      throw err;
    }
  }

}


export const usersStore = new UsersStore();
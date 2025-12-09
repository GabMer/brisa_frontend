// src/stores/auth.svelte.ts - Actualizado con permisos detallados
import type { User, AuthState, ModuloSistema } from '../../types/Usuarios y Roles/auth';
import { api } from '../../services/Usuarios y Roles/api';

class AuthStore {
  private state = $state<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true
  });

  // ========== GETTERS BÁSICOS ==========

  get user() {
    return this.state.user;
  }

  get token() {
    return this.state.token;
  }

  get isAuthenticated() {
    return this.state.isAuthenticated;
  }

  get isLoading() {
    return this.state.isLoading;
  }

  get permisos() {
    return this.state.user?.permisos || [];
  }

  // ========== NUEVOS GETTERS PARA PERMISOS DETALLADOS ==========

  get modulosAccesibles() {
    return this.state.user?.modulos_accesibles || [];
  }

  get accionesDisponibles() {
    return this.state.user?.acciones_disponibles || [];
  }

  get esAdministrador() {
    return this.state.user?.es_administrador || false;
  }

  get permisosPorModulo() {
    return this.state.user?.permisos_por_modulo || {};
  }

  // ========== AUTENTICACIÓN ==========

  async login(usuario: string, password: string) {
    try {
      const response = await api.login(usuario, password);
      
      if (response.success && response.data) {
        const { 
          access_token, 
          usuario_id, 
          usuario: username, 
          nombres, 
          rol, 
          permisos 
        } = response.data;
        
        // Guardar token
        localStorage.setItem('token', access_token);
        
        // Actualizar estado básico
        this.state.user = {
          usuario_id,
          usuario: username,
          nombres,
          rol,
          permisos
        };
        this.state.token = access_token;
        this.state.isAuthenticated = true;
        
        // ✅ CARGAR PERMISOS DETALLADOS DESPUÉS DEL LOGIN
        await this.cargarPermisosDetallados();
        
        return response;
      }
      
      throw new Error('Respuesta de login inválida');
    } catch (error) {
      this.logout();
      throw error;
    }
  }

  logout() {
    // Intentar cerrar sesión en el servidor
    if (this.state.token) {
      api.logout().catch(() => {
        console.warn('No se pudo cerrar sesión en el servidor');
      });
    }
    
    localStorage.removeItem('token');
    this.state.user = null;
    this.state.token = null;
    this.state.isAuthenticated = false;
  }

  async init() {
    const token = localStorage.getItem('token');
    
    if (!token) {
      this.state.isLoading = false;
      return;
    }

    try {
      // Verificar token con el backend
      const response = await api.getMe();
      
      if (response.success && response.data) {
        this.state.user = {
          usuario_id: response.data.id_usuario,
          usuario: response.data.usuario,
          nombres: response.data.nombres || '',
          rol: response.data.rol || 'Usuario',
          permisos: response.data.permisos || []
        };
        this.state.token = token;
        this.state.isAuthenticated = true;
        
        // ✅ CARGAR PERMISOS DETALLADOS AL INICIAR
        await this.cargarPermisosDetallados();
      } else {
        this.logout();
      }
    } catch (error) {
      console.error('Error verificando token:', error);
      this.logout();
    } finally {
      this.state.isLoading = false;
    }
  }

  // ========== CARGAR PERMISOS DETALLADOS ==========

  /**
   * 📋 Cargar permisos detallados desde el backend
   * Se llama automáticamente después del login y al init
   */
  async cargarPermisosDetallados() {
    try {
      const response = await api.getMisPermisos();
      
      if (response.success && response.data && this.state.user) {
        // Actualizar usuario con permisos detallados
        this.state.user = {
          ...this.state.user,
          permisos_detallados: response.data.permisos,
          permisos_por_modulo: response.data.permisos_por_modulo,
          modulos_accesibles: response.data.modulos_accesibles,
          acciones_disponibles: response.data.acciones_disponibles,
          es_administrador: response.data.es_administrador
        };
        
        console.log('✅ Permisos detallados cargados:', {
          modulos: response.data.modulos_accesibles,
          acciones: response.data.acciones_disponibles.length,
          esAdmin: response.data.es_administrador
        });
      }
    } catch (error) {
      console.error('❌ Error al cargar permisos detallados:', error);
      // No hacemos logout, seguimos con permisos básicos
    }
  }

  // ========== VALIDACIÓN DE PERMISOS ==========

  /**
   * ✅ Verificar si tiene UN permiso específico (formato antiguo)
   */
  hasPermission(permiso: string): boolean {
    return this.state.user?.permisos.includes(permiso) || false;
  }

  /**
   * 🔒 Verificar si puede acceder a un módulo
   * Usa el nuevo sistema de permisos detallados
   */
  puedeAccederModulo(modulo: ModuloSistema): boolean {
    // Si es administrador, puede todo
    if (this.esAdministrador) {
      return true;
    }
    
    // Verificar si el módulo está en la lista de accesibles
    return this.modulosAccesibles.includes(modulo);
  }

  /**
   * 🎯 Verificar si puede realizar una acción específica
   * Ejemplo: puedeRealizarAccion("crear_usuario")
   */
  puedeRealizarAccion(accion: string): boolean {
    // Si es administrador, puede todo
    if (this.esAdministrador) {
      return true;
    }
    
    // Verificar si la acción está en la lista de disponibles
    return this.accionesDisponibles.includes(accion);
  }

  /**
   * 📊 Obtener permisos de un módulo específico
   * Ejemplo: getPermisosModulo("usuarios") -> ["Lectura", "Agregar"]
   */
  getPermisosModulo(modulo: ModuloSistema): string[] {
    return this.permisosPorModulo[modulo] || [];
  }

  /**
   * 🔐 Verificar si tiene un permiso específico en un módulo
   * Ejemplo: tienePermisoEnModulo("usuarios", "Modificar")
   */
  tienePermisoEnModulo(modulo: ModuloSistema, permiso: string): boolean {
    // Si es administrador, puede todo
    if (this.esAdministrador) {
      return true;
    }
    
    const permisosModulo = this.getPermisosModulo(modulo);
    return permisosModulo.includes(permiso);
  }

  // ========== HELPERS ÚTILES ==========

  /**
   * 📋 Obtener lista de módulos que puede ver en el menú
   */
  getModulosMenu() {
    const modulosMenu = [
      { 
        id: 'usuarios', 
        nombre: 'Usuarios y Roles',
        icon: 'users',
        ruta: 'usuarios'
      },
      { 
        id: 'esquelas', 
        nombre: 'Esquelas',
        icon: 'document',
        ruta: 'esquelas'
      },
      { 
        id: 'incidentes', 
        nombre: 'Incidentes',
        icon: 'alert',
        ruta: 'incidentes'
      },
      { 
        id: 'retiros_tempranos', 
        nombre: 'Retiros Tempranos',
        icon: 'exit',
        ruta: 'retiros'
      },
      { 
        id: 'reportes', 
        nombre: 'Reportes',
        icon: 'chart',
        ruta: 'reportes'
      },
      { 
        id: 'profesores', 
        nombre: 'Profesores',
        icon: 'academic',
        ruta: 'profesores'
      },
      { 
        id: 'administracion', 
        nombre: 'Administración',
        icon: 'settings',
        ruta: 'administracion'
      }
    ];

    // Filtrar solo los módulos a los que tiene acceso
    return modulosMenu.filter(modulo => 
      this.puedeAccederModulo(modulo.id as ModuloSistema)
    );
  }

  // ========== REFRESH TOKEN ==========

  async refreshToken() {
    try {
      const response = await api.refreshToken();
      if (response.success && response.data?.access_token) {
        localStorage.setItem('token', response.data.access_token);
        this.state.token = response.data.access_token;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error al refrescar token:', error);
      this.logout();
      return false;
    }
  }
}

export const authStore = new AuthStore();
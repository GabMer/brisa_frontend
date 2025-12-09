// src/services/usersService.ts - SERVICIO ACTUALIZADO

import type {
  UsuarioCreateDTO,
  UsuarioUpdateDTO,
  CambiarPasswordDTO,
  ResetPasswordDTO,
  UsuarioConCredenciales,
  ResetPasswordResponse,
  ApiResponse
} from '../../types/Usuarios y Roles/personas';

const API_BASE_URL = 'http://localhost:8000/api/auth';

/**
 * Obtener headers de autenticación
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('No autenticado. Por favor inicia sesión.');
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

/**
 * Manejar respuesta de la API
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
    }

    try {
      const errorData = await response.json();

      if (errorData.detail) {
        if (typeof errorData.detail === 'string') {
          throw new Error(errorData.detail);
        } else if (Array.isArray(errorData.detail)) {
          const errors = errorData.detail.map((err: any) =>
            `${err.loc?.join('.') || 'campo'}: ${err.msg}`
          ).join(', ');
          throw new Error(`Errores de validación: ${errors}`);
        }
      }

      throw new Error(`Error ${response.status}: ${response.statusText}`);
    } catch (jsonError) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
  }

  const result = await response.json();

  // Extraer data si viene en formato { success, message, data }
  if (result.success && result.data) {
    return result.data as T;
  }

  return result as T;
}

/**
 * Servicio de gestión de usuarios
 */
export class UsersService {

  /**
   * Crear nuevo usuario
   * ✅ Genera contraseña temporal automáticamente
   * ✅ Devuelve credenciales (SOLO mostradas una vez)
   */
  static async crearUsuario(data: UsuarioCreateDTO): Promise<UsuarioConCredenciales> {
    const headers = await getAuthHeaders();

    console.log('📤 Datos enviados al backend:', data); // ✅ DEBUG

    const response = await fetch(`${API_BASE_URL}/usuarios`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        id_persona: data.id_persona,
        usuario: data.usuario,
        correo: data.correo,
        is_active: true
        // ❌ NO enviar password (se genera automáticamente en el backend)
      })
    });

    console.log('📡 Status de respuesta:', response.status); // ✅ DEBUG

    if (response.status === 409) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Ya existe un usuario con ese correo o nombre de usuario');
    }

    if (response.status === 404) {
      throw new Error('Persona no encontrada');
    }

    if (response.status === 422) {
      const errorData = await response.json();
      console.error('❌ Error 422 - Detalles:', errorData); // ✅ DEBUG
      throw new Error('Datos inválidos: ' + JSON.stringify(errorData.detail));
    }

    return handleResponse<UsuarioConCredenciales>(response);
  }

  /**
   * Actualizar usuario
   * ✅ Puede cambiar contraseña opcionalmente
   */
  static async actualizarUsuario(id: number, data: UsuarioUpdateDTO): Promise<any> {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/usuarios/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    });

    if (response.status === 404) {
      throw new Error('Usuario no encontrado');
    }

    if (response.status === 409) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Ya existe un usuario con ese correo o nombre de usuario');
    }

    return handleResponse(response);
  }

  /**
   * Resetear contraseña de usuario
   * ✅ Solo administradores
   * ✅ Genera nueva contraseña temporal
   */
  static async restablecerPassword(id: number): Promise<{
    usuario: string;
    nueva_password_temporal: string;
    mensaje: string;
  }> {
    const headers = await getAuthHeaders();

    console.log('🔄 Restableciendo contraseña para usuario:', id);

    const response = await fetch(`${API_BASE_URL}/usuarios/${id}/restablecer-password`, {
      method: 'POST',
      headers
    });

    console.log('📡 Status de respuesta:', response.status);

    if (response.status === 404) {
      throw new Error('Usuario no encontrado');
    }

    if (response.status === 403) {
      throw new Error('No tienes permisos para restablecer contraseñas');
    }

    if (response.status === 400) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'No se puede restablecer la contraseña');
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Error ${response.status} al restablecer contraseña`);
    }

    const resultado = await handleResponse<{
      usuario: string;
      nueva_password_temporal: string;
      mensaje: string;
    }>(response);

    console.log('✅ Contraseña restablecida exitosamente');

    return resultado;
  }

  /**
   * Cambiar contraseña (primer inicio de sesión)
   * ✅ Usuario final
   */
  static async cambiarPassword(data: CambiarPasswordDTO): Promise<any> {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/usuarios/cambiar-password`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });

    if (response.status === 400) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Contraseña actual incorrecta');
    }

    return handleResponse(response);
  }

  /**
   * Obtener usuario por ID
   */
  static async obtenerUsuario(id: number): Promise<any> {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/usuarios/${id}`, {
      method: 'GET',
      headers
    });

    if (response.status === 404) {
      throw new Error('Usuario no encontrado');
    }

    return handleResponse(response);
  }

  /**
   * Listar usuarios
   */
  static async listarUsuarios(skip: number = 0, limit: number = 100): Promise<any[]> {
    const headers = await getAuthHeaders();

    const params = new URLSearchParams({
      skip: String(skip),
      limit: String(limit)
    });

    const response = await fetch(`${API_BASE_URL}/usuarios?${params}`, {
      method: 'GET',
      headers
    });

    return handleResponse(response);
  }

   /**
   * Obtener estadísticas de usuarios
   */
  static async obtenerEstadisticas(): Promise<any> {
  const headers = await getAuthHeaders();

  console.log('🔵 Llamando a:', `${API_BASE_URL}/usuarios/estadisticas`);

  const response = await fetch(`${API_BASE_URL}/usuarios/estadisticas`, {
    method: 'GET',
    headers
  });

  console.log('🔵 Status de respuesta:', response.status);

  const result = await handleResponse(response);
  console.log('🔵 Datos recibidos:', result);

  return result;
}

}
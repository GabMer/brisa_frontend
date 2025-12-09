// src/services/bitacoraService.ts
import type {
  RegistroBitacora,
  BitacoraResponse,
  EstadisticasBitacora,
  TipoAccion,
  FiltrosBitacora
} from '../../types/Usuarios y Roles/bitacora';

const API_BASE_URL = 'http://localhost:8000/api/bitacora';

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

    if (response.status === 403) {
      throw new Error('No tienes permisos para acceder a la auditoría');
    }

    try {
      const errorData = await response.json();
      throw new Error(errorData.detail || errorData.message || `Error ${response.status}`);
    } catch {
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
 * Servicio de Bitácora
 */
export class BitacoraService {
  
  /**
   * Consultar auditoría con filtros opcionales (CU-07)
   */
  static async consultarAuditoria(
    filtros: FiltrosBitacora = {},
    skip: number = 0,
    limit: number = 50
  ): Promise<BitacoraResponse> {
    const headers = await getAuthHeaders();

    const params = new URLSearchParams({
      skip: String(skip),
      limit: String(limit)
    });

    // Agregar filtros opcionales
    if (filtros.usuario_admin) {
      params.append('usuario_admin', String(filtros.usuario_admin));
    }
    if (filtros.accion) {
      params.append('accion', filtros.accion);
    }
    if (filtros.tipo_objetivo) {
      params.append('tipo_objetivo', filtros.tipo_objetivo);
    }
    if (filtros.id_objetivo) {
      params.append('id_objetivo', String(filtros.id_objetivo));
    }
    if (filtros.fecha_inicio) {
      params.append('fecha_inicio', filtros.fecha_inicio);
    }
    if (filtros.fecha_fin) {
      params.append('fecha_fin', filtros.fecha_fin);
    }

    const response = await fetch(`${API_BASE_URL}/auditoria?${params}`, {
      method: 'GET',
      headers
    });

    return handleResponse<BitacoraResponse>(response);
  }

  /**
   * Obtener estadísticas de auditoría
   */
  static async obtenerEstadisticas(dias: number = 7): Promise<EstadisticasBitacora> {
    const headers = await getAuthHeaders();

    const params = new URLSearchParams({
      dias: String(dias)
    });

    const response = await fetch(`${API_BASE_URL}/auditoria/estadisticas?${params}`, {
      method: 'GET',
      headers
    });

    return handleResponse<EstadisticasBitacora>(response);
  }

  /**
   * Listar tipos de acciones disponibles (para filtros)
   */
  static async listarTiposAcciones(): Promise<string[]> {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/auditoria/acciones`, {
      method: 'GET',
      headers
    });

    const result = await handleResponse<TipoAccion>(response);
    return result.acciones;
  }

  /**
   * Exportar registros de auditoría (opcional - puedes implementar en backend)
   */
  static async exportarAuditoria(
    filtros: FiltrosBitacora = {},
    formato: 'csv' | 'excel' = 'csv'
  ): Promise<Blob> {
    const headers = await getAuthHeaders();

    const params = new URLSearchParams();

    // Agregar filtros
    if (filtros.usuario_admin) {
      params.append('usuario_admin', String(filtros.usuario_admin));
    }
    if (filtros.accion) {
      params.append('accion', filtros.accion);
    }
    if (filtros.tipo_objetivo) {
      params.append('tipo_objetivo', filtros.tipo_objetivo);
    }
    if (filtros.id_objetivo) {
      params.append('id_objetivo', String(filtros.id_objetivo));
    }
    if (filtros.fecha_inicio) {
      params.append('fecha_inicio', filtros.fecha_inicio);
    }
    if (filtros.fecha_fin) {
      params.append('fecha_fin', filtros.fecha_fin);
    }

    params.append('formato', formato);

    const response = await fetch(`${API_BASE_URL}/auditoria/exportar?${params}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error('Error al exportar auditoría');
    }

    return response.blob();
  }
}
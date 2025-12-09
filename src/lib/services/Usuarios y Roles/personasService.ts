// src/services/personasService.ts
import type { 
  Persona, 
  PersonasStats,
  PersonaFiltros,
  PersonasPaginatedResponse,
  ApiResponse
} from '../../types/Usuarios y Roles/personas';

const API_BASE_URL = 'http://localhost:8000/api';

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

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
    }
    
    try {
      const errorData = await response.json();
      console.error('❌ Error del servidor:', errorData);
      
      if (errorData.detail) {
        if (typeof errorData.detail === 'string') {
          throw new Error(errorData.detail);
        } else if (Array.isArray(errorData.detail)) {
          const errors = errorData.detail.map((err: any) => 
            `${err.loc?.join('.') || 'campo'}: ${err.msg}`
          ).join(', ');
          throw new Error(`Errores de validación: ${errors}`);
        } else {
          throw new Error(JSON.stringify(errorData.detail));
        }
      }
      
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    } catch (jsonError) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
  }
  
  const result: ApiResponse<T> = await response.json();
  return result.data;
}

export class PersonasService {
  
  /**
   * Listar personas con filtros y paginación
   * GET /api/auth/personas
   */
  static async listarPersonas(filtros?: PersonaFiltros): Promise<PersonasPaginatedResponse> {
    const headers = await getAuthHeaders();
    
    const params = new URLSearchParams();
    
    if (filtros) {
      if (filtros.tipo_persona) {
        params.append('tipo_persona', filtros.tipo_persona);
      }
      if (filtros.skip !== undefined) {
        params.append('skip', String(filtros.skip));
      }
      if (filtros.limit !== undefined) {
        params.append('limit', String(filtros.limit));
      }
    } else {
      params.append('skip', '0');
      params.append('limit', '80');
    }
    
    const url = `${API_BASE_URL}/auth/personas?${params.toString()}`;
    console.log('🌐 Llamando a:', url);
    
    const response = await fetch(url, { method: 'GET', headers });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error Response:', errorText);
      throw new Error(`Error ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('📦 Respuesta completa del backend:', result);
    
    // ✅ DEPURACIÓN: Ver estructura de datos
    if (result.data?.items && result.data.items.length > 0) {
      console.group('🔍 PRIMERA PERSONA DE LA RESPUESTA');
      const primera = result.data.items[0];
      console.log('ID:', primera.id_persona);
      console.log('Nombre:', primera.nombre_completo);
      console.log('tiene_usuario:', primera.tiene_usuario);
      console.log('usuario:', primera.usuario);
      console.log('id_usuario:', primera.id_usuario);
      console.log('usuario_info:', primera.usuario_info);
      console.groupEnd();
    }
    
    return result.data;
  }
  
  /**
   * Obtener estadísticas de personas
   * GET /api/auth/personas/estadisticas
   */
  static async obtenerEstadisticas(): Promise<PersonasStats> {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/auth/personas/estadisticas`, {
      method: 'GET',
      headers
    });
    
    return handleResponse<PersonasStats>(response);
  }
  
  /**
   * Buscar persona por CI
   * GET /api/auth/personas/buscar/ci/{ci}
   */
  static async buscarPorCI(ci: string): Promise<Persona> {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/auth/personas/buscar/ci/${ci}`, {
      method: 'GET',
      headers
    });
    
    if (response.status === 404) {
      throw new Error(`No se encontró persona con CI ${ci}`);
    }
    
    return handleResponse<Persona>(response);
  }
  
  /**
   * Listar personas por tipo
   * GET /api/auth/personas/tipo/{tipo_persona}
   */
  static async listarPorTipo(tipo: 'profesor' | 'administrativo'): Promise<Persona[]> {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/auth/personas/tipo/${tipo}`, {
      method: 'GET',
      headers
    });
    
    return handleResponse<Persona[]>(response);
  }
  
  /**
   * Obtener persona por ID
   * GET /api/auth/personas/{persona_id}
   */
  static async obtenerPersona(id: number): Promise<Persona> {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/auth/personas/${id}`, {
      method: 'GET',
      headers
    });
    
    if (response.status === 404) {
      throw new Error('Persona no encontrada');
    }
    
    return handleResponse<Persona>(response);
  }
  
}
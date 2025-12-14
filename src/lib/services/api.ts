// services/api.ts

import { statusService } from './status';
import { codigosService } from './codigos';
import { estudiantesService } from './estudiantes';
import { coursesService } from './courses';
import { personalService } from './personal';
import { academicService } from './academic';
import { esquelasService } from './esquelas';
import { authService } from './Usuarios_Roles/auth';
import { administrativosService } from './administrativos';
import { http } from './http';

// ==================== API CLIENT UNIFICADO ====================

/**
 * Cliente API unificado que combina todos los servicios del sistema:
 * - Autenticación y permisos (authService)
 * - Gestión de estudiantes, cursos, personal, etc.
 * - Métodos HTTP genéricos
 * 
 * @example
 * ```typescript
 * import { apiClient } from './services/api';
 * 
 * // Autenticación
 * await apiClient.login('usuario', 'password');
 * const permisos = await apiClient.getMisPermisos();
 * 
 * // Usar servicios
 * const estudiantes = await apiClient.getEstudiantes();
 * const esquelas = await apiClient.getEsquelas();
 * 
 * // HTTP genérico
 * const data = await apiClient.get('/api/custom-endpoint');
 * ```
 */
export const apiClient = {
	// ==================== AUTENTICACIÓN Y PERMISOS ====================
	...authService,

	// ==================== SERVICIOS POR MÓDULO ====================
	...statusService,
	...codigosService,
	...estudiantesService,
	...coursesService,
	...personalService,
	...academicService,
	...esquelasService,
	...administrativosService,

	// ==================== MÉTODOS HTTP GENÉRICOS ====================
	// Passthroughs para compatibilidad con código que usa apiClient.get(...)
	get: http.get,
	post: http.post,
	put: http.put,
	del: http.del,
	buildQuery: http.buildQuery
};

// ==================== EXPORTS INDIVIDUALES ====================

/**
 * Re-exportar servicios individuales para imports específicos
 * 
 * @example
 * ```typescript
 * // Importar servicio específico
 * import { authService, esquelasService } from './services/api';
 * await authService.login('usuario', 'password');
 * 
 * // O usar el cliente completo
 * import { apiClient } from './services/api';
 * await apiClient.login('usuario', 'password');
 * ```
 */
export {
	authService,
	statusService,
	codigosService,
	estudiantesService,
	coursesService,
	personalService,
	academicService,
	esquelasService,
	administrativosService
};

/**
 * Alias para mantener compatibilidad con código existente
 * que usa 'api' en lugar de 'apiClient'
 */
export const api = apiClient;
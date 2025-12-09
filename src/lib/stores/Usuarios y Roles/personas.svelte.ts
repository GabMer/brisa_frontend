// src/stores/personas.svelte.ts
import type {
  Persona,
  PersonasStats,
  PersonaFiltros,
  PersonasPaginatedResponse,
  TipoPersona
} from '../../types/Usuarios y Roles/personas';
import { PersonasService } from '../../services/Usuarios y Roles/personasService';

class PersonasStore {
  // Estado
  personas = $state<Persona[]>([]);
  stats = $state<PersonasStats | null>(null);
  selectedPersona = $state<Persona | null>(null);
  isLoading = $state(false);
  error = $state<string | null>(null);

  // Paginación
  pagination = $state({
    total: 0,
    page: 1,
    per_page: 50,
    pages: 0
  });

  // Filtros actuales
  filtros = $state<PersonaFiltros>({
    skip: 0,
    limit: 50
  });

  // ==================== MÉTODOS DE CARGA ====================

  async loadPersonas(filtros?: PersonaFiltros) {
    console.log('🔄 PersonasStore.loadPersonas() - INICIO');
    this.isLoading = true;
    this.error = null;

    try {


      console.log('📡 Llamando a PersonasService.listarPersonas()...');
      const response: PersonasPaginatedResponse = await PersonasService.listarPersonas(filtros);

      console.log('✅ Respuesta recibida:', response);

      // ✅ DEPURACIÓN: Ver estructura de personas
      response.items.forEach((persona, index) => {
        if (index < 3) { // Solo mostrar las primeras 3
          console.group(`👤 Persona ${index + 1}: ${persona.nombre_completo}`);
          console.log('tiene_usuario:', persona.tiene_usuario);
          console.log('usuario:', persona.usuario);
          console.log('id_usuario:', persona.id_usuario);
          console.log('usuario_info:', persona.usuario_info);
          console.groupEnd();
        }
      });

      console.log('✅ Respuesta recibida:', response);

      this.personas = response.items;
      this.pagination = {
        total: response.total,
        page: response.page,
        per_page: response.per_page,
        pages: response.pages
      };

      console.log(`✅ ${this.personas.length} personas cargadas (Total: ${response.total})`);

    } catch (err) {
      // ✅ MANEJO CORRECTO DE ERRORES
      console.error('❌ ERROR en loadPersonas:', err);

      if (err instanceof Error) {
        this.error = err.message;
      } else if (typeof err === 'string') {
        this.error = err;
      } else {
        this.error = 'Error desconocido al cargar personas';
      }

      console.error('📝 Error guardado:', this.error);
    } finally {
      this.isLoading = false;
      console.log('🏁 PersonasStore.loadPersonas() - FIN');
    }
  }

  async loadStats() {
    try {
      console.log('📊 Cargando estadísticas...');
      this.stats = await PersonasService.obtenerEstadisticas();
      console.log('✅ Estadísticas cargadas:', this.stats);
    } catch (err) {
      console.error('⚠️ Error al cargar estadísticas:', err);
      // No seteamos error aquí porque las stats no son críticas
    }
  }

  async loadAll(filtros?: PersonaFiltros) {
    console.log('🔄 PersonasStore.loadAll() - INICIO');
    this.isLoading = true;
    this.error = null;

    try {
      // 1. Cargar personas
      console.log('1️⃣ Cargando personas...');
      const response: PersonasPaginatedResponse = await PersonasService.listarPersonas(filtros);

      this.personas = response.items;
      this.pagination = {
        total: response.total,
        page: response.page,
        per_page: response.per_page,
        pages: response.pages
      };

      console.log(`✅ ${this.personas.length} personas cargadas`);

      // 2. Cargar stats (no crítico)
      try {
        console.log('2️⃣ Cargando estadísticas...');
        this.stats = await PersonasService.obtenerEstadisticas();
        console.log('✅ Estadísticas cargadas');
      } catch (statsErr) {
        console.warn('⚠️ No se pudieron cargar las estadísticas:', statsErr);
      }

    } catch (err) {
      // ✅ MANEJO CORRECTO DE ERRORES
      console.error('❌ ERROR en loadAll:', err);

      if (err instanceof Error) {
        this.error = err.message;
      } else if (typeof err === 'string') {
        this.error = err;
      } else if (err && typeof err === 'object' && 'message' in err) {
        this.error = String((err as any).message);
      } else {
        this.error = 'Error desconocido al cargar datos';
      }

      console.error('📝 Error guardado:', this.error);
    } finally {
      this.isLoading = false;
      console.log('🏁 PersonasStore.loadAll() - FIN');
    }
  }

  // ==================== BÚSQUEDA ====================

  async buscarPorCI(ci: string): Promise<Persona | null> {
    try {
      return await PersonasService.buscarPorCI(ci);
    } catch {
      return null;
    }
  }

  async listarPorTipo(tipo: TipoPersona): Promise<Persona[]> {
    return PersonasService.listarPorTipo(tipo);
  }

  // ==================== SELECCIÓN ====================

  selectPersona(persona: Persona | null) {
    this.selectedPersona = persona;
  }

  async selectPersonaById(id: number) {
    try {
      this.selectedPersona = await PersonasService.obtenerPersona(id);
    } catch (err) {
      console.error('Error al obtener persona:', err);
      this.selectedPersona = null;
    }
  }

  clearSelection() {
    this.selectedPersona = null;
  }

  // ==================== FILTROS (DESHABILITADOS POR AHORA) ====================

  setFiltroTipo(tipo: TipoPersona | undefined) {
    // TODO: Implementar cuando el backend soporte filtros
    console.log('⚠️ Filtros no implementados aún');
  }

  setFiltroEstado(activo: boolean | undefined) {
    // TODO: Implementar cuando el backend soporte filtros
    console.log('⚠️ Filtros no implementados aún');
  }

  setBusqueda(termino: string) {
    // TODO: Implementar cuando el backend soporte búsqueda
    console.log('⚠️ Búsqueda no implementada aún');
  }

  limpiarFiltros() {
    this.loadPersonas();
  }

  // ==================== GETTERS ====================

  getPersonaById(id: number): Persona | undefined {
    return this.personas.find(p => p.id_persona === id);
  }

  existeCI(ci: string, excludeId?: number): boolean {
    return this.personas.some(p => p.ci === ci && p.id_persona !== excludeId);
  }

  existeCorreo(correo: string, excludeId?: number): boolean {
    return this.personas.some(p =>
      p.correo === correo && p.id_persona !== excludeId
    );
  }

  get profesores(): Persona[] {
    return this.personas.filter(p => p.tipo_persona === 'profesor');
  }

  get administrativos(): Persona[] {
    return this.personas.filter(p => p.tipo_persona === 'administrativo');
  }

  get activos(): Persona[] {
    return this.personas.filter(p => p.is_active);
  }

  get inactivos(): Persona[] {
    return this.personas.filter(p => !p.is_active);
  }

  get conUsuario(): Persona[] {
    return this.personas.filter(p => p.tiene_usuario);
  }

  get sinUsuario(): Persona[] {
    return this.personas.filter(p => !p.tiene_usuario);
  }

  // ==================== UTILIDADES ====================

  clearError() {
    this.error = null;
  }

  reset() {
    this.personas = [];
    this.stats = null;
    this.selectedPersona = null;
    this.isLoading = false;
    this.error = null;
    this.filtros = { skip: 0, limit: 50 };
    this.pagination = { total: 0, page: 1, per_page: 50, pages: 0 };
  }
}

export const personasStore = new PersonasStore();
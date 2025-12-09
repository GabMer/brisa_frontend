// src/stores/bitacora.svelte.ts
import type {
  RegistroBitacora,
  BitacoraResponse,
  EstadisticasBitacora,
  FiltrosBitacora
} from '../../types/Usuarios y Roles/bitacora';
import { BitacoraService } from '../../services/Usuarios y Roles/bitacoraService';

class BitacoraStore {
  registros = $state<RegistroBitacora[]>([]);
  estadisticas = $state<EstadisticasBitacora | null>(null);
  tiposAcciones = $state<string[]>([]);
  
  // Paginación
  total = $state(0);
  page = $state(1);
  pages = $state(1);
  limit = $state(50);
  hasMore = $state(false);
  
  // Filtros activos
  filtrosActivos = $state<FiltrosBitacora>({});
  
  // Estados
  isLoading = $state(false);
  isLoadingStats = $state(false);
  error = $state<string | null>(null);
  
  /**
   * Cargar registros de auditoría con filtros
   */
  async cargarRegistros(filtros: FiltrosBitacora = {}, skip: number = 0) {
    this.isLoading = true;
    this.error = null;
    
    try {
      console.log('🔄 Cargando registros de auditoría...', { filtros, skip });
      
      const response = await BitacoraService.consultarAuditoria(
        filtros,
        skip,
        this.limit
      );
      
      this.registros = response.items;
      this.total = response.total;
      this.page = response.page;
      this.pages = response.pages;
      this.hasMore = response.has_more;
      this.filtrosActivos = response.filtros_aplicados;
      
      console.log('✅ Registros cargados:', this.registros.length);
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Error al cargar auditoría';
      console.error('❌ Error al cargar auditoría:', err);
    } finally {
      this.isLoading = false;
    }
  }
  
  /**
   * Cargar estadísticas
   */
  async cargarEstadisticas(dias: number = 7) {
    this.isLoadingStats = true;
    
    try {
      console.log('📊 Cargando estadísticas de auditoría...');
      
      this.estadisticas = await BitacoraService.obtenerEstadisticas(dias);
      
      console.log('✅ Estadísticas cargadas');
    } catch (err) {
      console.error('⚠️ Error al cargar estadísticas:', err);
      // No seteamos error general para no afectar la tabla
    } finally {
      this.isLoadingStats = false;
    }
  }
  
  /**
   * Cargar tipos de acciones disponibles
   */
  async cargarTiposAcciones() {
    try {
      this.tiposAcciones = await BitacoraService.listarTiposAcciones();
      console.log('✅ Tipos de acciones cargados:', this.tiposAcciones.length);
    } catch (err) {
      console.error('⚠️ Error al cargar tipos de acciones:', err);
    }
  }
  
  /**
   * Aplicar filtros y recargar
   */
  async aplicarFiltros(filtros: FiltrosBitacora) {
    await this.cargarRegistros(filtros, 0);
  }
  
  /**
   * Limpiar filtros
   */
  async limpiarFiltros() {
    this.filtrosActivos = {};
    await this.cargarRegistros({}, 0);
  }
  
  /**
   * Cambiar página
   */
  async cambiarPagina(nuevaPagina: number) {
    const skip = (nuevaPagina - 1) * this.limit;
    await this.cargarRegistros(this.filtrosActivos, skip);
  }
  
  /**
   * Exportar auditoría
   */
  async exportar(formato: 'csv' | 'excel' = 'csv') {
    try {
      console.log('📥 Exportando auditoría...');
      
      const blob = await BitacoraService.exportarAuditoria(this.filtrosActivos, formato);
      
      // Descargar archivo
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `auditoria_${new Date().toISOString().split('T')[0]}.${formato}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('✅ Auditoría exportada');
    } catch (err) {
      console.error('❌ Error al exportar:', err);
      throw err;
    }
  }
  
  /**
   * Refrescar datos
   */
  async refrescar() {
    await Promise.all([
      this.cargarRegistros(this.filtrosActivos, (this.page - 1) * this.limit),
      this.cargarEstadisticas()
    ]);
  }
}

export const bitacoraStore = new BitacoraStore();
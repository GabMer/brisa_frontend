<!-- src/components/bitacora/BitacoraTable.svelte -->
<script lang="ts">
  import type { RegistroBitacora } from '../../../../lib/types/Usuarios y Roles/bitacora';

  interface Props {
    registros: RegistroBitacora[];
    loading?: boolean;
    total?: number;
    page?: number;
    pages?: number;
    onPageChange?: (page: number) => void;
    onViewDetail?: (registro: RegistroBitacora) => void;
  }

  let {
    registros = [],
    loading = false,
    total = 0,
    page = 1,
    pages = 1,
    onPageChange,
    onViewDetail
  }: Props = $props();

  // Formatear fecha
  function formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleString('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  // Obtener badge de acción
  function getBadgeClass(accion: string): string {
    const accionLower = accion.toLowerCase();
    
    if (accionLower.includes('crear') || accionLower.includes('login')) {
      return 'badge-create';
    } else if (accionLower.includes('editar') || accionLower.includes('actualizar')) {
      return 'badge-edit';
    } else if (accionLower.includes('eliminar') || accionLower.includes('logout')) {
      return 'badge-delete';
    } else if (accionLower.includes('asignar') || accionLower.includes('revocar')) {
      return 'badge-assign';
    }
    
    return 'badge-default';
  }

  // Obtener icono SVG según la acción
  function getActionIcon(accion: string): string {
    const accionLower = accion.toLowerCase();
    
    if (accionLower.includes('crear')) {
      return 'plus';
    } else if (accionLower.includes('editar') || accionLower.includes('actualizar')) {
      return 'edit';
    } else if (accionLower.includes('eliminar')) {
      return 'trash';
    } else if (accionLower.includes('login')) {
      return 'login';
    } else if (accionLower.includes('logout')) {
      return 'logout';
    } else if (accionLower.includes('asignar')) {
      return 'assign';
    } else if (accionLower.includes('revocar')) {
      return 'revoke';
    }
    
    return 'activity';
  }
</script>

<div class="bitacora-table-container">
  {#if loading}
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Cargando registros de auditoría...</p>
    </div>
  {:else if registros.length === 0}
    <div class="empty-state">
      <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
      <h3>No se encontraron registros</h3>
      <p>No hay registros de auditoría que coincidan con los filtros aplicados.</p>
      <p class="hint">Intenta modificar los filtros o realizar una nueva búsqueda.</p>
    </div>
  {:else}
    <div class="table-wrapper">
      <table class="bitacora-table">
        <thead>
          <tr>
            <th>Fecha y Hora</th>
            <th>Usuario</th>
            <th>Acción</th>
            <th>Descripción</th>
            <th>Tipo Objetivo</th>
            <th>ID Objetivo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {#each registros as registro (registro.id_bitacora)}
            <tr>
              <td class="fecha-col">
                <div class="fecha-wrapper">
                  <div class="icono-container {getBadgeClass(registro.accion)}">
                    {#if getActionIcon(registro.accion) === 'plus'}
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                      </svg>
                    {:else if getActionIcon(registro.accion) === 'edit'}
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                    {:else if getActionIcon(registro.accion) === 'trash'}
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    {:else if getActionIcon(registro.accion) === 'login'}
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
                      </svg>
                    {:else if getActionIcon(registro.accion) === 'logout'}
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                      </svg>
                    {:else if getActionIcon(registro.accion) === 'assign'}
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                      </svg>
                    {:else if getActionIcon(registro.accion) === 'revoke'}
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    {:else}
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                      </svg>
                    {/if}
                  </div>
                  <span class="fecha">{formatearFecha(registro.fecha_hora)}</span>
                </div>
              </td>
              
              <td>
                <div class="usuario-info">
                  <div class="usuario-nombre">{registro.usuario}</div>
                  <div class="usuario-completo">{registro.nombre_completo}</div>
                </div>
              </td>
              
              <td>
                <span class="badge {getBadgeClass(registro.accion)}">
                  {registro.accion}
                </span>
              </td>
              
              <td class="descripcion-col">
                <div class="descripcion-text" title={registro.descripcion}>
                  {registro.descripcion}
                </div>
              </td>
              
              <td>
                {#if registro.tipo_objetivo}
                  <span class="tipo-objetivo">{registro.tipo_objetivo}</span>
                {:else}
                  <span class="no-data">N/A</span>
                {/if}
              </td>
              
              <td class="id-col">
                {#if registro.id_objetivo}
                  <code class="id-objetivo">{registro.id_objetivo}</code>
                {:else}
                  <span class="no-data">—</span>
                {/if}
              </td>
              
              <td class="actions-col">
                <button
                  class="btn-icon btn-view"
                  title="Ver detalles"
                  onclick={() => onViewDetail?.(registro)}
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Paginación -->
    {#if pages > 1}
      <div class="pagination">
        <div class="pagination-info">
          Mostrando {registros.length} de {total} registros
        </div>
        
        <div class="pagination-controls">
          <button
            class="btn-pagination"
            disabled={page === 1}
            onclick={() => onPageChange?.(page - 1)}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
            Anterior
          </button>
          
          <div class="pagination-pages">
            <span class="page-current">Página {page}</span>
            <span class="page-separator">de</span>
            <span class="page-total">{pages}</span>
          </div>
          
          <button
            class="btn-pagination"
            disabled={page === pages}
            onclick={() => onPageChange?.(page + 1)}
          >
            Siguiente
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  @import './styles/./BitacoraTable.css'; 
</style>
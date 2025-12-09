<!--src/components/users/PermisoDetailModal.svelte-->
<script lang="ts">
  import type { Permission } from '../../../../lib/types/Usuarios y Roles/users';
  import { PermissionsService } from '../../../../lib/services/Usuarios y Roles/PermissionsService';
  
  interface Props {
    permiso?: Permission | null;
    isOpen?: boolean;
    onClose?: () => void;
    onEdit?: (permiso: Permission) => void;
  }
  
  let { 
    permiso = null,
    isOpen = false,
    onClose = () => {},
    onEdit = () => {}
  }: Props = $props();
  
  let loading = $state(false);
  let error = $state<string | null>(null);
  let permisoDetail = $state<any | null>(null);
  
  $effect(() => {
    if (isOpen && permiso) {
      loadPermisoDetail();
    }
  });
  
  async function loadPermisoDetail() {
    if (!permiso) return;
    
    try {
      loading = true;
      error = null;
      
      // Cargar detalle del permiso
      permisoDetail = await PermissionsService.obtenerPermiso(permiso.id_permiso);
      
      // Cargar roles que tienen este permiso
      const rolesData = await PermissionsService.obtenerRolesConPermiso(permiso.id_permiso);
      permisoDetail.roles = rolesData;
      
      // Contar usuarios con este permiso (a través de roles)
      let usuariosCount = 0;
      if (rolesData && rolesData.length > 0) {
        rolesData.forEach((rol: any) => {
          usuariosCount += rol.usuariosCount || 0;
        });
      }
      permisoDetail.usuariosCount = usuariosCount;
      
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error al cargar el detalle del permiso';
      console.error('Error al cargar detalle:', err);
    } finally {
      loading = false;
    }
  }
  
  const handleClose = () => {
    permisoDetail = null;
    error = null;
    onClose();
  };
  
  const handleEdit = () => {
    if (permisoDetail) {
      onEdit(permisoDetail);
      handleClose();
    }
  };
</script>

{#if isOpen}
  <div class="modal-overlay">
    <button 
      class="modal-backdrop"
      onclick={handleClose}
      aria-label="Cerrar modal"
      tabindex="-1"
    ></button>
    
    <div class="modal-container" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal-header">
        <div class="header-content">
          <div class="permiso-icon" aria-hidden="true">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h3 id="modal-title" class="modal-title">Detalle del Permiso</h3>
            <p class="modal-subtitle">Información completa del permiso</p>
          </div>
        </div>
        <button 
          type="button"
          class="btn-close" 
          onclick={handleClose}
          aria-label="Cerrar modal"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div class="modal-body">
        {#if loading}
          <div class="loading-state" role="status" aria-live="polite">
            <div class="spinner" aria-hidden="true"></div>
            <p>Cargando información...</p>
          </div>
        {:else if error}
          <div class="error-state" role="alert">
            <svg class="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="error-text">{error}</p>
            <button type="button" class="btn btn-secondary" onclick={loadPermisoDetail}>
              Reintentar
            </button>
          </div>
        {:else if permisoDetail}
          <div class="detail-content">
            <!-- Información General -->
            <div class="detail-section">
              <div class="section-header">
                <h4 class="section-title">Información General</h4>
              </div>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Nombre del Permiso</span>
                  <p class="info-value">{permisoDetail.nombre}</p>
                </div>
                <div class="info-item">
                  <span class="info-label">ID del Permiso</span>
                  <p class="info-value">#{permisoDetail.id_permiso}</p>
                </div>
                <div class="info-item full-width">
                  <span class="info-label">Descripción</span>
                  <p class="info-value description">
                    {permisoDetail.descripcion || 'Sin descripción'}
                  </p>
                </div>
              </div>
            </div>
            
            <!-- Estadísticas -->
            <div class="detail-section">
              <div class="section-header">
                <h4 class="section-title">Estadísticas de Uso</h4>
              </div>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-icon roles" aria-hidden="true">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div class="stat-content">
                    <p class="stat-label">Roles con este Permiso</p>
                    <p class="stat-value">{permisoDetail.roles?.length || 0}</p>
                  </div>
                </div>
                
                <div class="stat-card">
                  <div class="stat-icon usuarios" aria-hidden="true">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div class="stat-content">
                    <p class="stat-label">Usuarios con este Permiso</p>
                    <p class="stat-value">{permisoDetail.usuariosCount || 0}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Roles que tienen este permiso -->
            {#if permisoDetail.roles && permisoDetail.roles.length > 0}
              <div class="detail-section">
                <div class="section-header">
                  <h4 class="section-title">Roles que tienen este permiso</h4>
                  <span class="badge">{permisoDetail.roles.length} roles</span>
                </div>
                <ul class="roles-list">
                  {#each permisoDetail.roles as rol}
                    <li class="rol-item">
                      <div class="rol-icon" aria-hidden="true">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div class="rol-info">
                        <p class="rol-name">{rol.nombre}</p>
                        {#if rol.descripcion}
                          <p class="rol-desc">{rol.descripcion}</p>
                        {/if}
                        {#if rol.usuariosCount !== undefined}
                          <p class="rol-usuarios">{rol.usuariosCount} usuarios con este rol</p>
                        {/if}
                      </div>
                    </li>
                  {/each}
                </ul>
              </div>
            {:else}
              <div class="detail-section">
                <div class="empty-message">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p>Este permiso no está asignado a ningún rol</p>
                </div>
              </div>
            {/if}
          </div>
        {/if}
      </div>
      
      {#if permisoDetail && !loading && !error}
  <div class="modal-footer">
    <button type="button" class="btn btn-primary" onclick={handleClose}>
      Cerrar
    </button>
  </div>
{/if}
    </div>
  </div>
{/if}

<style>
  @import './styles/PermissionDetailModal.css';
</style>
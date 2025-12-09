<script lang="ts">
  import type { Role } from '../../../../lib/types/Usuarios y Roles/users';
  import { RolesService } from '../../../../lib/services/Usuarios y Roles/rolesService';
  
  interface Props {
    role?: Role | null;
    isOpen?: boolean;
    onClose?: () => void;
    onEdit?: (role: Role) => void;
  }
  
  let { 
    role = null,
    isOpen = false,
    onClose = () => {},
    onEdit = () => {}
  }: Props = $props();
  
  let loading = $state(false);
  let error = $state<string | null>(null);
  let roleDetail = $state<any | null>(null);
  let openModule = $state<string | null>(null);
let showUsuarios = $state(false);
 // ✅ Cambiado a any temporalmente
  
 $effect(() => {
  if (isOpen && role) {
    loadRoleDetail();
  } else {
    // Resetear cuando se cierra
    openModule = null;
    showUsuarios = false;
  }
});

  
// Función para agrupar permisos por módulo
function groupPermisosByModule(permisos: any[]) {
  const grouped: Record<string, any[]> = {};
  
  permisos.forEach(permiso => {
    const module = permiso.modulo || 'otros';
    if (!grouped[module]) {
      grouped[module] = [];
    }
    grouped[module].push(permiso);
  });
  
  return grouped;
}

// Función para toggle de módulos (solo uno abierto a la vez)
function toggleModule(module: string) {
  openModule = openModule === module ? null : module;
}

// Función para toggle de usuarios
function toggleUsuarios() {
  showUsuarios = !showUsuarios;
  if (showUsuarios) {
    openModule = null; // Cerrar módulos si se abren usuarios
  }
}

// Función para obtener color del módulo
function getColorModulo(module: string): string {
  const colors: Record<string, string> = {
    usuarios: "blue",
    incidentes: "red",
    esquelas: "green",
    horarios: "yellow",
    aulas: "purple",
    materias: "cyan",
    recepcion: "indigo",
    retiros_tempranos: "orange",
    reportes: "pink",
    profesores: "teal",
    administracion: "slate",
    otros: "gray"
  };
  return colors[module.toLowerCase()] || "gray";
}

// Función para obtener el nombre del módulo
function getModuleName(module: string): string {
  const names: Record<string, string> = {
    usuarios: "Usuarios",
    incidentes: "Incidentes",
    esquelas: "Esquelas",
    horarios: "Horarios",
    aulas: "Aulas",
    materias: "Materias",
    recepcion: "Recepción",
    retiros_tempranos: "Retiros Tempranos",
    reportes: "Reportes",
    profesores: "Profesores",
    administracion: "Administración",
    otros: "Otros"
  };
  return names[module] || module;
}

  
async function loadRoleDetail() {
  if (!role) return;

  try {
    loading = true;
    error = null;
    
    // Cargar datos básicos del rol
    const data = await RolesService.obtenerRol(role.id_rol);
    
    // Cargar usuarios del rol
    const usuarios = await RolesService.obtenerUsuariosRol(role.id_rol);
    data.usuarios = usuarios;
    data.usuariosCount = usuarios?.length || 0;
    
    roleDetail = data;
  } catch (err) {
    error = err instanceof Error ? err.message : "Error al cargar el detalle del rol";
    console.error("❌ Error al cargar detalle:", err);
  } finally {
    loading = false;
  }
}
  
  const handleClose = () => {
    roleDetail = null;
    error = null;
    onClose();
  };
  
  const handleEdit = () => {
    if (roleDetail) {
      onEdit(roleDetail);
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
          <div class="role-icon" aria-hidden="true">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h3 id="modal-title" class="modal-title">Detalle del Rol</h3>
            <p class="modal-subtitle">Información completa del rol</p>
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
            <button type="button" class="btn btn-secondary" onclick={loadRoleDetail}>
              Reintentar
            </button>
          </div>
        {:else if roleDetail}
          <div class="detail-content">
            <div class="detail-section">
              <div class="section-header">
                <h4 class="section-title">Información General</h4>
              </div>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Nombre del Rol</span>
                  <p class="info-value">{roleDetail.nombre}</p>
                </div>
                <div class="info-item">
                  <span class="info-label">ID del Rol</span>
                  <!-- ✅ CORRECCIÓN: Usar id_rol en lugar de id -->
                  <p class="info-value">#{roleDetail.id_rol || roleDetail.id}</p>
                </div>
                <div class="info-item full-width">
                  <span class="info-label">Descripción</span>
                  <p class="info-value description">
                    {roleDetail.descripcion || 'Sin descripción'}
                  </p>
                </div>
              </div>
            </div>
            
            <div class="detail-section">
  <div class="section-header">
    <h4 class="section-title">Estadísticas</h4>
  </div>
  <div class="stats-grid">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="stat-card clickable" onclick={toggleUsuarios}>
      <div class="stat-icon usuarios" aria-hidden="true">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </div>
      <div class="stat-content">
        <p class="stat-label">Usuarios Asignados</p>
        <p class="stat-value">{roleDetail.usuariosCount || 0}</p>
      </div>
      <svg 
        class="chevron-icon {showUsuarios ? 'rotated' : ''}" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          stroke-linecap="round" 
          stroke-linejoin="round" 
          stroke-width="2" 
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </div>
    
    <div class="stat-card">
      <div class="stat-icon permisos" aria-hidden="true">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <div class="stat-content">
        <p class="stat-label">Permisos Asignados</p>
        <p class="stat-value">{roleDetail.permisosCount || 0}</p>
      </div>
    </div>
  </div>

  {#if showUsuarios && roleDetail.usuarios && roleDetail.usuarios.length > 0}
  <div class="usuarios-list">
    {#each roleDetail.usuarios as usuario}
      <div class="usuario-item">
        <div class="usuario-avatar">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              stroke-linecap="round" 
              stroke-linejoin="round" 
              stroke-width="2" 
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <div class="usuario-info">
          <p class="usuario-name">{usuario.nombre} {usuario.apellido}</p>
          <p class="usuario-email">{usuario.email}</p>
        </div>
        {#if usuario.activo}
          <span class="status-badge active">Activo</span>
        {:else}
          <span class="status-badge inactive">Inactivo</span>
        {/if}
      </div>
    {/each}
  </div>
{:else if showUsuarios}
  <div class="empty-list">
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
    <p>No hay usuarios asignados a este rol</p>
  </div>
{/if}
</div>

{#if roleDetail.permisos && roleDetail.permisos.length > 0}
  {@const permisosAgrupados = groupPermisosByModule(roleDetail.permisos)}
  
  <div class="detail-section">
    <div class="section-header">
      <h4 class="section-title">Permisos por Módulo</h4>
      <span class="badge">{roleDetail.permisos.length} permisos</span>
    </div>
    
    <div class="modules-list-view">
      {#each Object.entries(permisosAgrupados) as [module, permisos]}
        <div class="module-card-wrapper">
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div 
            class="module-card-view {getColorModulo(module)}" 
            onclick={() => {
              toggleModule(module);
              showUsuarios = false; // Cerrar usuarios al abrir módulo
            }}
          >
            <div class="module-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
              </svg>
            </div>
            <div class="module-info-view">
              <span class="module-name">{getModuleName(module)}</span>
              <span class="module-badge-view">{permisos.length} permisos</span>
            </div>
            <svg 
              class="chevron-icon {openModule === module ? 'rotated' : ''}" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                stroke-linecap="round" 
                stroke-linejoin="round" 
                stroke-width="2" 
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>

          {#if openModule === module}
            <div class="module-content-view">
              <div class="permisos-list-view">
                {#each permisos as permiso}
                  <div class="permiso-item-view">
                    <svg class="check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div class="permiso-info-view">
                      <p class="permiso-name">{permiso.nombre}</p>
                      {#if permiso.descripcion}
                        <p class="permiso-desc">{permiso.descripcion}</p>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
{/if}
          </div>
        {/if}
      </div>
      
      {#if roleDetail && !loading && !error}
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick={handleClose}>
            Cerrar
          </button>
          <button type="button" class="btn btn-primary" onclick={handleEdit}>
            <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar Rol
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}


<style>
  @import './styles/RoleDetailModal.css';
</style>
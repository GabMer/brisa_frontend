<script lang="ts">
  import type { Role, Permission } from '../../../../lib/types/Usuarios y Roles/users';
  import { RolesService } from '../../../../lib/services/Usuarios y Roles/rolesService';
  import { PermissionsService } from '../../../../lib/services/Usuarios y Roles/PermissionsService';
  import { onMount } from 'svelte';
  
  interface Props {
    role?: Role | null;
    isOpen?: boolean;
    onClose?: () => void;
    onSave?: (role: Role) => void;
  }
  
  let { 
    role = null,
    isOpen = false,
    onClose = () => {},
    onSave = () => {}
  }: Props = $props();
  
  let nombre = $state('');
  let descripcion = $state('');
  let permisosDisponibles = $state<Permission[]>([]);
  let permisosSeleccionados = $state<number[]>([]);
  let saving = $state(false);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let permisosLoaded = $state(false);
  let openModule = $state<string | null>(null);

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

  function groupPermisosByModule(permisos: Permission[]) {
    const grouped: Record<string, Permission[]> = {};
    
    permisos.forEach(permiso => {
      const module = permiso.modulo || 'otros';
      if (!grouped[module]) {
        grouped[module] = [];
      }
      grouped[module].push(permiso);
    });
    
    return grouped;
  }

  function toggleModule(module: string) {
    openModule = openModule === module ? null : module;
  }

  function getModuleIcon(module: string): string {
    const icons: Record<string, string> = {
      usuarios: "👥",
      incidentes: "⚠️",
      esquelas: "📋",
      horarios: "📅",
      aulas: "🏫",
      materias: "📚",
      recepcion: "🔔"
    };
    return icons[module] || "📦";
  }

  function getModuleName(module: string): string {
    const names: Record<string, string> = {
      usuarios: "Usuarios",
      incidentes: "Incidentes",
      esquelas: "Esquelas",
      horarios: "Horarios",
      aulas: "Aulas",
      materias: "Materias",
      recepcion: "Recepción"
    };
    return names[module] || module;
  }

  function toggleModulePermisos(permisos: Permission[]) {
    const permisosIds = permisos.map(p => p.id_permiso);
    const todosSeleccionados = permisosIds.every(id => permisosSeleccionados.includes(id));
    
    if (todosSeleccionados) {
      permisosSeleccionados = permisosSeleccionados.filter(id => !permisosIds.includes(id));
    } else {
      const nuevosPermisos = permisosIds.filter(id => !permisosSeleccionados.includes(id));
      permisosSeleccionados = [...permisosSeleccionados, ...nuevosPermisos];
    }
  }

  function moduloCompleto(permisos: Permission[]): boolean {
    return permisos.every(p => permisosSeleccionados.includes(p.id_permiso));
  }
  
  const isEditing = $derived(role !== null);
  const modalTitle = $derived(isEditing ? 'Editar Rol' : 'Crear Nuevo Rol');
  
  $effect(() => {
    if (isOpen) {
      if (!permisosLoaded) {
        loadPermisos();
      }
      
      if (role) {
        nombre = role.nombre;
        descripcion = role.descripcion || '';
        permisosSeleccionados = role.permisos?.map((p: any) => p.id_permiso) || [];
      } else {
        nombre = '';
        descripcion = '';
        permisosSeleccionados = [];
      }
      error = null;
    } else {
      openModule = null;
    }
  });
  
  async function loadPermisos() {
    try {
      loading = true;
      const permisos = await PermissionsService.listarPermisos(0, 100);
      
      const permisosUnicos = permisos.filter((permiso, index, self) =>
        index === self.findIndex((p) => p.id_permiso === permiso.id_permiso)
      );
      
      permisosDisponibles = permisosUnicos;
      permisosLoaded = true;
      
    } catch (err) {
      console.error('❌ Error al cargar permisos:', err);
      error = 'Error al cargar permisos disponibles';
    } finally {
      loading = false;
    }
  }
  
  function togglePermiso(permisoId: number) {
    if (permisosSeleccionados.includes(permisoId)) {
      permisosSeleccionados = permisosSeleccionados.filter(id => id !== permisoId);
    } else {
      permisosSeleccionados = [...permisosSeleccionados, permisoId];
    }
  }
  
  function toggleTodos() {
    if (permisosSeleccionados.length === permisosDisponibles.length) {
      permisosSeleccionados = [];
    } else {
      permisosSeleccionados = permisosDisponibles.map(p => p.id_permiso);
    }
  }
  
  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    
    // Validaciones
    if (!nombre.trim()) {
      error = 'El nombre del rol es obligatorio';
      return;
    }
    
    if (nombre.trim().length < 3) {
      error = 'El nombre del rol debe tener al menos 3 caracteres';
      return;
    }
    
    if (nombre.trim().length > 50) {
      error = 'El nombre del rol no puede superar los 50 caracteres';
      return;
    }
    
    if (descripcion.trim().length > 200) {
      error = 'La descripción no puede superar los 200 caracteres';
      return;
    }
    
    try {
      saving = true;
      error = null;
      
      const rolData = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim()
      };
      
      let savedRole: Role;
      
      if (isEditing && role) {
        savedRole = await RolesService.actualizarRol(role.id_rol, rolData);
        await RolesService.asignarPermisosRol(role.id_rol, permisosSeleccionados);
      } else {
        savedRole = await RolesService.crearRol(rolData);
        
        if (permisosSeleccionados.length > 0) {
          await RolesService.asignarPermisosRol(savedRole.id_rol, permisosSeleccionados);
        }
      }
      
      console.log('✅ Rol guardado con permisos:', savedRole);
      onSave(savedRole);
      handleClose();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error al guardar el rol';
      console.error('❌ Error al guardar rol:', err);
    } finally {
      saving = false;
    }
  };
  
  const handleClose = () => {
    if (!saving) {
      nombre = '';
      descripcion = '';
      permisosSeleccionados = [];
      error = null;
      onClose();
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
        <h3 id="modal-title" class="modal-title">{modalTitle}</h3>
        <button 
          type="button"
          class="btn-close" 
          onclick={handleClose} 
          disabled={saving}
          aria-label="Cerrar modal"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form class="modal-body" onsubmit={handleSubmit}>
        {#if error}
          <div class="alert alert-error" role="alert">
            <svg class="alert-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        {/if}
        
        <div class="form-group">
          <label for="nombre" class="form-label">
            Nombre del Rol <span class="required">*</span>
          </label>
          <input
            id="nombre"
            type="text"
            class="form-input"
            bind:value={nombre}
            placeholder="Ej: Administrador, Editor, Visitante"
            disabled={saving || loading}
            minlength="3"
            maxlength="50"
            required
          />
          <p class="form-hint">Mínimo 3 caracteres, máximo 50</p>
        </div>
        
        <div class="form-group">
          <label for="descripcion" class="form-label">
            Descripción
          </label>
          <textarea
            id="descripcion"
            class="form-textarea"
            bind:value={descripcion}
            placeholder="Describe las responsabilidades de este rol"
            rows="3"
            maxlength="200"
            disabled={saving || loading}
          ></textarea>
          <p class="form-hint">Máximo 200 caracteres</p>
        </div>
        
        <div class="form-group">
          <div class="section-header">
            <h4 class="section-title">Permisos del Rol</h4>
            <span class="modules-count">{permisosSeleccionados.length} de {permisosDisponibles.length} seleccionados</span>
          </div>
          
          {#if loading}
            <div class="permisos-loading">
              <div class="spinner-small"></div>
              <span>Cargando permisos...</span>
            </div>
          {:else if permisosDisponibles.length === 0}
            <div class="empty-modules">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
              </svg>
              <p>No hay permisos disponibles</p>
            </div>
          {:else}
            {@const permisosAgrupados = groupPermisosByModule(permisosDisponibles)}
            
            <div class="modules-list">
              {#each Object.entries(permisosAgrupados) as [module, permisos]}
                <div class="module-card-wrapper">
                  <!-- svelte-ignore a11y_click_events_have_key_events -->
                  <!-- svelte-ignore a11y_no_static_element_interactions -->
                  <div class="module-card {getColorModulo(module)}" onclick={() => toggleModule(module)}>
                    <div class="module-icon">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                      </svg>
                    </div>
                    <div class="module-info">
                      <span class="module-name">{getModuleName(module)}</span>
                      <span class="module-badge">
                        {permisos.filter(p => permisosSeleccionados.includes(p.id_permiso)).length}/{permisos.length} seleccionados
                      </span>
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
                    <div class="module-content">
                      <div class="module-actions-bar">
                        <button
                          type="button"
                          class="btn-select-all-module"
                          onclick={(e) => {
                            e.stopPropagation();
                            toggleModulePermisos(permisos);
                          }}
                          disabled={saving || loading}
                        >
                          {moduloCompleto(permisos) ? '✓ Todos Seleccionados' : 'Seleccionar Todos'}
                        </button>
                      </div>
                      
                      <div class="permisos-grid">
                        {#each permisos as permiso}
                          <label class="permiso-checkbox">
                            <input
                              type="checkbox"
                              checked={permisosSeleccionados.includes(permiso.id_permiso)}
                              onchange={() => togglePermiso(permiso.id_permiso)}
                              disabled={saving || loading}
                              class="checkbox-input"
                            />
                            <div class="permiso-info-grid">
                              <p class="permiso-name">{permiso.nombre}</p>
                              {#if permiso.descripcion}
                                <p class="permiso-desc">{permiso.descripcion}</p>
                              {/if}
                            </div>
                          </label>
                        {/each}
                      </div>
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        </div>
        
        <div class="modal-footer">
          <button 
            type="button" 
            class="btn btn-secondary" 
            onclick={handleClose}
            disabled={saving}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            class="btn btn-primary"
            disabled={saving || loading}
          >
            {#if saving}
              <div class="btn-spinner" aria-hidden="true"></div>
              <span>Guardando...</span>
            {:else}
              <span>{isEditing ? 'Actualizar' : 'Crear'} Rol</span>
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
    @import './styles/RoleModal.css';
</style>
<!--src/components/users/RolesTable.svelte - CORREGIDO Y FUNCIONAL-->
<script lang="ts">
  import type { Role } from '../../../../lib/types/Usuarios y Roles/users';
  import { onMount } from 'svelte';
  import { RolesService } from '../../../../lib/services/Usuarios y Roles/rolesService';
  import AsignarUsuarioRolModal from "../../users/modals/AsignarUsuarioRolModal.svelte";

  
  interface Props {
    role?: Role | null;
    isOpen?: boolean;
    selectedUserId?: number | null;
    roles?: Role[];
    onEdit?: (role: Role) => void;
    onDelete?: (roleId: number) => void;
    onViewDetail?: (role: Role) => void;
    onCreateNew?: () => void;
    onRoleCreated?: (role: Role) => void;
    onRoleUpdated?: (role: Role) => void;
  }
  
  let { 
    role = null,
    isOpen = false,
    selectedUserId = null, 
    roles: rolesFromProps,
    onEdit = () => {},
    onDelete = () => {},
    onViewDetail = () => {},
    onCreateNew = () => {},
    onRoleCreated = () => {},
    onRoleUpdated = () => {}
  }: Props = $props();
  
  let roles = $state<Role[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let deletingRoleId = $state<number | null>(null);
  let showAsignarModal = $state(false);
  let roleDetail = $state<Role | null>(null); 
  
  onMount(async () => {
    if (rolesFromProps && rolesFromProps.length > 0) {
      roles = [...rolesFromProps];
      loading = false;
    } else {
      await loadRoles();
    }
  });
  
  $effect(() => {
  // 👉 1. Escuchar cambios desde props
  if (rolesFromProps && rolesFromProps.length > 0) {
    console.log('📊 Roles actualizados desde props:', rolesFromProps);
    roles = [...rolesFromProps];
  }

  // 👉 2. Cargar detalle solo cuando el modal se abre
  if (isOpen && role) {
      loadRoleDetail();
    }
  });

  
  async function loadRoleDetail() {
    if (!role) return;

    try {
      loading = true;
      error = null;
      const data = await RolesService.obtenerRol(role.id_rol);
      
      // 👇 Eliminar permisos duplicados basándose en id_permiso
      if (data.permisos && Array.isArray(data.permisos)) {
        const permisosUnicos = data.permisos.filter((permiso: any, index: number, self: any[]) =>
          index === self.findIndex((p: any) => 
            p.id_permiso === permiso.id_permiso || p.id === permiso.id
          )
        );
        data.permisos = permisosUnicos;
      }
      
      roleDetail = data;
      console.log('✅ Rol cargado con permisos únicos:', roleDetail);
    } catch (err) {
      error =
        err instanceof Error
          ? err.message
          : "Error al cargar el detalle del rol";
      console.error("Error al cargar detalle:", err);
    } finally {
      loading = false;
    }
  }

  async function handleUsuarioAsignado() {
    showAsignarModal = false;
    // Recargar detalles del rol
    await loadRoleDetail();
  }

  function handleAsignarUsuario() {
    showAsignarModal = true;
  }

  function handleCloseAsignarModal() {
    showAsignarModal = false;
  }

  async function loadRoles() {
    try {
      loading = true;
      error = null;
      console.log('🔄 Cargando roles en RolesTable...');
      
      const rolesData = await RolesService.listarRoles();
      
      console.log('✅ Roles cargados:', rolesData);
      
      roles = [...rolesData];
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error al cargar los roles';
      console.error('❌ Error en RolesTable:', err);
    } finally {
      loading = false;
    }
  }
  
  const displayRoles = $derived(
    selectedUserId 
      ? roles.filter(r => r.id_rol === selectedUserId)
      : roles
  );
  
  const handleNuevoRol = () => {
    console.log('Creando nuevo rol...');
    onCreateNew();
  };
  
  const handleVerDetalle = (role: Role) => {
    console.log('Ver detalle del rol:', role);
    onViewDetail(role);
  };
  
  async function handleEditar(role: Role) {
  try {
    console.log('🔄 Cargando rol completo con permisos...');
    const rolCompleto = await RolesService.obtenerRol(role.id_rol);
    console.log('✅ Rol completo cargado:', rolCompleto);
    onEdit(rolCompleto); // Pasar rol completo, no solo el básico
  } catch (error) {
    console.error('❌ Error al cargar rol:', error);
    alert('Error al cargar el rol para editar');
  }
}
  
  const handleEliminar = async (role: Role) => {
    const confirmar = confirm(
      `¿Estás seguro de que deseas eliminar el rol "${role.nombre}"?\n\n` +
      `Esta acción no se puede deshacer.`
    );
    
    if (!confirmar) return;
    
    try {
      deletingRoleId = role.id_rol;
      
      await RolesService.eliminarRol(role.id_rol);
      
      // ✅ Actualizar lista localmente
      roles = roles.filter(r => r.id_rol !== role.id_rol);
      
      console.log('✅ Rol eliminado exitosamente');
      onDelete(role.id_rol);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al eliminar el rol';
      console.error('❌ Error al eliminar rol:', err);
      alert(`Error: ${errorMsg}`);
    } finally {
      deletingRoleId = null;
    }
  };
  
  // ✅ Función pública para agregar rol a la lista
  export function addRole(newRole: Role) {
    console.log('✅ Agregando nuevo rol a la tabla:', newRole);
    roles = [...roles, newRole];
    onRoleCreated(newRole);
  }
  
  // ✅ Función pública para actualizar rol en la lista
  export function updateRole(updatedRole: Role) {
    console.log('✅ Actualizando rol en la tabla:', updatedRole);
    roles = roles.map(r => r.id_rol === updatedRole.id_rol ? updatedRole : r);
    onRoleUpdated(updatedRole);
  }
  
  // ✅ Función pública para recargar
  export function reloadRoles() {
    return loadRoles();
  }
</script>

<div class="roles-container">
  <div class="roles-header">
    <div>
      <h2 class="title">Roles del Sistema</h2>
      <p class="subtitle">Gestiona los roles y sus permisos asociados</p>
    </div>
    <button class="btn-nuevo" onclick={handleNuevoRol}>
      <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      Nuevo Rol
    </button>
  </div>

  {#if loading}
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Cargando roles...</p>
    </div>
  {:else if error}
    <div class="error-state">
      <svg class="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p class="error-text">{error}</p>
      <button class="btn-retry" onclick={loadRoles}>
        Reintentar
      </button>
    </div>
  {:else if displayRoles.length === 0}
    <div class="empty-state">
      <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
      <p class="empty-text">No hay roles registrados</p>
      <button class="btn-nuevo" onclick={handleNuevoRol} style="margin-top: 16px;">
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Crear Primer Rol
      </button>
    </div>
  {:else}
    <div class="table-container">
      <table class="roles-table">
        <thead>
          <tr>
            <th class="col-nombre">Nombre del Rol</th>
            <th class="col-descripcion">Descripción</th>
            <th class="col-permisos">Permisos</th>
            <th class="col-acciones">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {#each displayRoles as role (role.id_rol)}
            <tr class="role-row" class:deleting={deletingRoleId === role.id_rol}>
              <td class="role-nombre">
                <div class="nombre-cell">
                  <div class="role-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <span>{role.nombre}</span>
                </div>
              </td>
              <td class="role-descripcion">{role.descripcion || 'Sin descripción'}</td>
              <td class="role-permisos">
                <span class="permisos-badge">{role.permisosCount ?? 0} permisos</span>
              </td>
              <td class="role-acciones">
                <div class="action-buttons">
                  <button 
                    class="btn-action btn-view" 
                    onclick={() => handleVerDetalle(role)} 
                    title="Ver detalle"
                    disabled={deletingRoleId === role.id_rol}
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button 
                    class="btn-action btn-edit" 
                    title="Editar" 
                    onclick={() => handleEditar(role)}
                    disabled={deletingRoleId === role.id_rol}
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button 
                    class="btn-action btn-assign" 
                    title="Asignar Usuario" 
                    onclick={() => {
                      roleDetail = role;
                      showAsignarModal = true;
                    }}
                    disabled={deletingRoleId === role.id_rol}
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                    </svg>
                  </button>
                  <button 
                    class="btn-action btn-delete" 
                    title="Eliminar" 
                    onclick={() => handleEliminar(role)}
                    disabled={deletingRoleId === role.id_rol}
                  >
                    {#if deletingRoleId === role.id_rol}
                      <div class="btn-spinner"></div>
                    {:else}
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    {/if}
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<AsignarUsuarioRolModal
  role={roleDetail}
  isOpen={showAsignarModal}
  onClose={handleCloseAsignarModal}
  onSuccess={handleUsuarioAsignado}
/>

<style>
  @import './RolesTable.css';
</style>
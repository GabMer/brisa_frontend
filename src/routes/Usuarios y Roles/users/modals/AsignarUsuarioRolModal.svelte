<script lang="ts">
  import type { Role, User } from '../../../../lib/types/Usuarios y Roles/users';
  import { RolesService } from '../../../../lib/services/Usuarios y Roles/rolesService';
  import { UsersService } from '../../../../lib/services/Usuarios y Roles/usersService';
  import { onMount } from 'svelte';
  
  interface Props {
    role?: Role | null;
    isOpen?: boolean;
    onClose?: () => void;
    onSuccess?: () => void;
  }
  
  let { 
    role = null,
    isOpen = false,
    onClose = () => {},
    onSuccess = () => {}
  }: Props = $props();
  
  let usuarios = $state<any[]>([]); // ✅ Cambiado a any[] porque incluye persona
  let usuariosFiltrados = $state<any[]>([]);
  let searchTerm = $state('');
  let usuarioSeleccionado = $state<number | null>(null);
  let loading = $state(false);
  let assigning = $state(false);
  let error = $state<string | null>(null);
  
  $effect(() => {
    if (isOpen && role) {
      loadUsuarios();
    } else {
      resetModal();
    }
  });
  
  $effect(() => {
    if (searchTerm.trim() === '') {
      usuariosFiltrados = usuarios;
    } else {
      const term = searchTerm.toLowerCase();
      usuariosFiltrados = usuarios.filter(u => 
        // ✅ Buscar en usuario y correo (que sí existen en User)
        u.usuario.toLowerCase().includes(term) ||
        (u.correo && u.correo.toLowerCase().includes(term)) ||
        // ✅ Si tiene persona asociada, buscar también ahí
        (u.persona_nombre && u.persona_nombre.toLowerCase().includes(term))
      );
    }
  });
  
  async function loadUsuarios() {
    try {
      loading = true;
      error = null;
      
      // Cargar todos los usuarios
      const data = await UsersService.listarUsuarios();
      usuarios = data;
      usuariosFiltrados = data;
      
      console.log('✅ Usuarios cargados:', usuarios.length);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error al cargar usuarios';
      console.error('❌ Error al cargar usuarios:', err);
    } finally {
      loading = false;
    }
  }
  
  async function handleAsignar() {
    if (!usuarioSeleccionado || !role) {
      error = 'Debe seleccionar un usuario';
      return;
    }
    
    try {
      assigning = true;
      error = null;
      
      await RolesService.asignarRolUsuario(usuarioSeleccionado, role.id_rol);
      
      console.log('✅ Rol asignado exitosamente');
      onSuccess();
      handleClose();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error al asignar rol';
      console.error('❌ Error al asignar rol:', err);
    } finally {
      assigning = false;
    }
  }
  
  function seleccionarUsuario(usuarioId: number) {
    usuarioSeleccionado = usuarioId;
  }
  
  function resetModal() {
    searchTerm = '';
    usuarioSeleccionado = null;
    error = null;
  }
  
  function handleClose() {
    if (!assigning) {
      resetModal();
      onClose();
    }
  }
  
  // ✅ Función para obtener iniciales del usuario
  function getIniciales(usuario: any): string {
    if (usuario.persona_nombre) {
      // Si tiene nombre de persona, usar primeras 2 letras
      return usuario.persona_nombre.substring(0, 2).toUpperCase();
    }
    // Si no, usar las primeras 2 letras del usuario
    return usuario.usuario.substring(0, 2).toUpperCase();
  }
  
  // ✅ Función para obtener el nombre a mostrar
  function getNombreDisplay(usuario: any): string {
    return usuario.persona_nombre || usuario.usuario;
  }
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
          <div class="role-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <h3 id="modal-title" class="modal-title">Asignar Usuario al Rol</h3>
            <p class="modal-subtitle">Rol: {role?.nombre || 'Sin nombre'}</p>
          </div>
        </div>
        <button 
          type="button"
          class="btn-close" 
          onclick={handleClose}
          disabled={assigning}
          aria-label="Cerrar modal"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div class="modal-body">
        {#if error}
          <div class="alert alert-error" role="alert">
            <svg class="alert-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        {/if}
        
        <!-- Buscador -->
        <div class="search-box">
          <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            class="search-input"
            placeholder="Buscar por usuario o correo..."
            bind:value={searchTerm}
            disabled={loading || assigning}
          />
        </div>
        
        <!-- Lista de usuarios -->
        {#if loading}
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Cargando usuarios...</p>
          </div>
        {:else if usuariosFiltrados.length === 0}
          <div class="empty-state">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p>No se encontraron usuarios</p>
          </div>
        {:else}
          <div class="usuarios-list">
            {#each usuariosFiltrados as usuario (usuario.id_usuario)}
              <button
                class="usuario-item"
                class:selected={usuarioSeleccionado === usuario.id_usuario}
                onclick={() => seleccionarUsuario(usuario.id_usuario)}
                disabled={assigning}
              >
                <div class="usuario-avatar">
                  {getIniciales(usuario)}
                </div>
                <div class="usuario-info">
                  <!-- ✅ Mostrar nombre de persona o usuario -->
                  <p class="usuario-nombre">{getNombreDisplay(usuario)}</p>
                  <p class="usuario-detail">@{usuario.usuario}</p>
                  {#if usuario.correo}
                    <p class="usuario-email">{usuario.correo}</p>
                  {/if}
                </div>
                {#if usuarioSeleccionado === usuario.id_usuario}
                  <svg class="check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                {/if}
              </button>
            {/each}
          </div>
        {/if}
      </div>
      
      <div class="modal-footer">
        <button 
          type="button" 
          class="btn btn-secondary" 
          onclick={handleClose}
          disabled={assigning}
        >
          Cancelar
        </button>
        <button 
          type="button" 
          class="btn btn-primary"
          onclick={handleAsignar}
          disabled={!usuarioSeleccionado || assigning || loading}
        >
          {#if assigning}
            <div class="btn-spinner"></div>
            <span>Asignando...</span>
          {:else}
            <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Asignar Rol</span>
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  @import './styles/AsignarUsuarioRolModal.css';  
</style>
<!--src/components/users/PersonasTable.svelte - CORREGIDO FINAL-->
<script lang="ts">
  import type { Persona } from "../../../types/personas";
  import ModalCrearUsuario from "../modals/ModalCrearUsuario.svelte";
  import ModalEditarUsuario from "../modals/ModalEditarUsuario.svelte";
  import ModalMostrarPassword from '../modals/ModalMostrarPassword.svelte';



  interface Props {
    personas: Persona[];
    loading?: boolean;
    onEdit: (persona: Persona) => void;
    onDelete: (id: number) => void;
    onViewDetail: (persona: Persona) => void;
    onRefresh: () => void;
    onReactivar?: (id: number) => void;
  }

  let {
    personas,
    loading = false,
    onEdit,
    onDelete,
    onViewDetail,
    onRefresh,
    onReactivar,
  }: Props = $props();

  let showPasswordModal = $state(false);
  let passwordTemporal = $state<string | null>(null);
  let modalCrearUsuarioOpen = $state(false);
  let modalEditarUsuarioOpen = $state(false);
  let personaSeleccionada = $state<Persona | null>(null);
  let searchQuery = $state("");
  let personaPasswordReset = $state<Persona | null>(null); // ✅ NUEVA VARIABLE


  // Personas filtradas según búsqueda
  let filteredPersonas = $derived(
    personas.filter((persona) => {
      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase();
      return (
        persona.nombre_completo.toLowerCase().includes(query) ||
        persona.ci.toString().includes(query) ||
        (persona.correo?.toLowerCase() || "").includes(query) ||
        (persona.telefono?.toLowerCase() || "").includes(query) ||
        persona.tipo_persona.toLowerCase().includes(query)
      );
    }),
  );

  function getTipoPersonaLabel(tipo: string): string {
    const tipos: Record<string, string> = {
      profesor: "Profesor",
      administrativo: "Administrativo",
    };
    return tipos[tipo] || tipo;
  }

  function getEstado(persona: Persona): string {
    return persona.is_active ? "activo" : "inactivo";
  }

  function getInitials(persona: Persona): string {
    const first = persona.nombres?.charAt(0) || "";
    const last = persona.apellido_paterno?.charAt(0) || "";
    return (first + last).toUpperCase();
  }

  function handleCreated() {
    onRefresh();
  }

  function handleCreateUser(persona: Persona) {
    console.log("📝 Crear usuario para:", persona.nombre_completo);
    personaSeleccionada = persona;
    modalCrearUsuarioOpen = true;
  }

  function handleEditUser(persona: Persona) {
    console.log("✏️ Editar usuario:", persona.nombre_completo);
    personaSeleccionada = persona;
    modalEditarUsuarioOpen = true;
  }

  function handleCloseCrearUsuario() {
    modalCrearUsuarioOpen = false;
    personaSeleccionada = null;
  }

  function handleCloseEditarUsuario() {
    modalEditarUsuarioOpen = false;
    personaSeleccionada = null;
  }

  function handlePasswordReset(persona: Persona, nuevaPassword: string) {
    console.log('🔔 handlePasswordReset llamado');
    console.log('📋 Persona:', persona);
    console.log('🔑 Password:', nuevaPassword);
    
    personaPasswordReset = persona;  // ✅ Usar variable separada
    passwordTemporal = nuevaPassword;
    showPasswordModal = true;
  }

  // ✅ FUNCIÓN CORREGIDA
  function handleClosePasswordModal() {
    showPasswordModal = false;
    passwordTemporal = null;
    personaPasswordReset = null;  // ✅ Limpiar esta también
    onRefresh(); // Refrescar la lista
  }

  function handleUsuarioCreated() {
    handleCreated();
    handleCloseCrearUsuario();
  }

  function handleUsuarioUpdated() {
    handleCreated();
    handleCloseEditarUsuario();
  }
</script>

<div class="personas-table-container">
  <!-- Header -->
  <div class="personas-header">
    <div>
      <h2 class="title">Gestión de Personas</h2>
      <p class="subtitle">
        Administra la información de personas y sus usuarios
      </p>
    </div>
  </div>

  <!-- Barra de búsqueda -->
  <div class="search-container">
    <div class="search-wrapper">
      <svg
        class="search-icon"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        class="search-input"
        placeholder="Buscar por nombre, CI, email, teléfono o tipo..."
        bind:value={searchQuery}
      />
      {#if searchQuery}
        <button
          class="clear-button"
          onclick={() => (searchQuery = "")}
          title="Limpiar búsqueda"
          aria-label="Limpiar búsqueda"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      {/if}
    </div>
    {#if searchQuery}
      <p class="search-results">
        {filteredPersonas.length} resultado{filteredPersonas.length !== 1
          ? "s"
          : ""} encontrado{filteredPersonas.length !== 1 ? "s" : ""}
      </p>
    {/if}
  </div>

  <!-- Loading State -->
  {#if loading}
    <div class="loading-state">
      <svg
        class="animate-spin"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
      <p>Cargando personas...</p>
    </div>
  {:else}
    <!-- Tabla -->
    <div class="table-wrapper">
      {#if filteredPersonas.length === 0}
        <div class="empty-state">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <p>
            {searchQuery
              ? "No se encontraron personas con ese criterio"
              : "No hay personas registradas"}
          </p>
        </div>
      {:else}
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Persona</th>
              <th>CI</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Tipo</th>
              <th>Usuario</th>
              <th>Estado</th>
              <th class="actions-column">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {#each filteredPersonas as persona (persona.id_persona)}
              <tr class:inactive={persona.tiene_usuario && persona.usuario_activo === false}>
                <td>
                  <span class="id-badge">#{persona.id_persona}</span>
                </td>
                <td>
                  <div class="persona-cell">
                    <div class="avatar">
                      {getInitials(persona)}
                    </div>
                    <div>
                      <!-- ✅ CORRECCIÓN: Usar nombre_completo -->
                      <div class="persona-name">
                        {persona.nombre_completo}
                      </div>
                      <div class="persona-detail">
                        {persona.direccion || "Sin dirección"}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="ci-badge">{persona.ci}</span>
                </td>
                <td>
                  <span class="email">{persona.correo || "N/A"}</span>
                </td>
                <td>
                  <span class="telefono">{persona.telefono || "N/A"}</span>
                </td>
                <td>
                  <span class="tipo-badge tipo-{persona.tipo_persona}">
                    {getTipoPersonaLabel(persona.tipo_persona)}
                  </span>
                </td>
                <td>
                  <!-- ✅ CORRECCIÓN: Usar tiene_usuario directamente -->
                  <span
                    class="usuario-badge {persona.tiene_usuario
                      ? 'tiene-usuario'
                      : 'sin-usuario'}"
                  >
                    {#if persona.tiene_usuario}
                      <svg
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Sí ({persona.usuario || "N/A"})
                    {:else}
                      <svg
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      No
                    {/if}
                  </span>
                </td>
                <td>
                  {#if persona.tiene_usuario && persona.usuario_activo !== null}
                    <!-- ✅ Mostrar estado del USUARIO -->
                    <span class="status-badge status-{persona.usuario_activo ? 'activo' : 'inactivo'}">
                      {persona.usuario_activo ? 'Activo' : 'Inactivo'}
                    </span>
                  {:else}
                    <!-- Si no tiene usuario -->
                    <span class="status-badge status-inactivo">
                      Sin Usuario
                    </span>
                  {/if}
                </td>
                <td class="actions-column">
                  <div class="action-buttons">
                    <!-- ✅ CORRECCIÓN CRÍTICA: Verificar solo tiene_usuario e id_usuario -->
                    {#if persona.tiene_usuario && persona.id_usuario}
                      <!-- Usuario existe: Mostrar botón editar -->
                      <button
                        class="btn-action btn-edit-user"
                        onclick={() => handleEditUser(persona)}
                        title="Editar usuario de {persona.nombre_completo}"
                      >
                        <svg
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        <span>Editar Usuario</span>
                      </button>
                    {:else}
                      <!-- Usuario no existe: Mostrar botón crear -->
                      <button
                        class="btn-action btn-create-user"
                        onclick={() => handleCreateUser(persona)}
                        title="Crear usuario para {persona.nombre_completo}"
                        disabled={!persona.is_active}
                      >
                        <svg
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                          />
                        </svg>
                        <span>Crear Usuario</span>
                      </button>
                    {/if}
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
  {/if}
</div>

<!-- Modales -->
<ModalCrearUsuario
  bind:open={modalCrearUsuarioOpen}
  persona={personaSeleccionada}
  onclose={handleCloseCrearUsuario}
  oncreated={handleUsuarioCreated}
/>

<ModalEditarUsuario
  bind:open={modalEditarUsuarioOpen}
  persona={personaSeleccionada}
  onclose={handleCloseEditarUsuario}
  onupdated={handleUsuarioUpdated}
  onpasswordreset={handlePasswordReset}
  onRefresh={onRefresh}
/>

<ModalMostrarPassword
  bind:open={showPasswordModal}
  persona={personaPasswordReset}
  passwordTemporal={passwordTemporal}
  onclose={handleClosePasswordModal}
/>

<style>
  @import './PersonasTable.css';
</style>

<!--components/users/ModalMostrarPassword.svelte-->
<script lang="ts">
  import type { Persona } from '../../../../lib/types/Usuarios y Roles/personas';
  
  interface Props {
    open?: boolean;
    persona: Persona | null;
    passwordTemporal: string | null;
    onclose?: () => void;
  }

  let { 
    open = $bindable(false),
    persona = null,
    passwordTemporal = null,
    onclose = () => {}
  }: Props = $props();

  let copiedPassword = $state(false);
  let copiedUser = $state(false);

  function copiarPassword() {
    if (passwordTemporal) {
      navigator.clipboard.writeText(passwordTemporal);
      copiedPassword = true;
      setTimeout(() => copiedPassword = false, 2000);
    }
  }

  function copiarUsuario() {
    if (persona?.usuario) {
      navigator.clipboard.writeText(persona.usuario);
      copiedUser = true;
      setTimeout(() => copiedUser = false, 2000);
    }
  }

  function handleClose() {
    onclose();
  }
</script>

{#if open && persona && passwordTemporal}
  <div class="modal-overlay">
    <button 
      class="modal-backdrop"
      onclick={handleClose}
      aria-label="Cerrar modal"
      tabindex="-1"
    ></button>
    
    <div class="modal-container" role="dialog" aria-modal="true">
      <div class="modal-content">
        <!-- Icono -->
        <div class="icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h3 class="title">¡Contraseña Restablecida!</h3>
        <p class="subtitle">Para: <strong>{persona.nombre_completo}</strong></p>
        
        <!-- Alerta -->
        <div class="alert">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Esta contraseña solo se muestra UNA VEZ. Guárdela ahora.</span>
        </div>
        
        <!-- Credenciales -->
        <div class="credentials">
          <div class="field">
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label>Usuario</label>
            <div class="input-group">
              <code>{persona.usuario}</code>
              <button 
                class="btn-copy"
                class:copied={copiedUser}
                onclick={copiarUsuario}
              >
                {#if copiedUser}
                  ✓
                {:else}
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                {/if}
              </button>
            </div>
          </div>
          
          <div class="field">
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label>Contraseña Temporal</label>
            <div class="input-group highlight">
              <code>{passwordTemporal}</code>
              <button 
                class="btn-copy"
                class:copied={copiedPassword}
                onclick={copiarPassword}
              >
                {#if copiedPassword}
                  ✓
                {:else}
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                {/if}
              </button>
            </div>
          </div>
        </div>
        
        <!-- Info -->
        <p class="info">
          El usuario deberá cambiar esta contraseña en su próximo inicio de sesión.
        </p>
        
        <button class="btn-primary" onclick={handleClose}>
          Entendido
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  @import './styles/ModalMostrarPassword.css';
</style>
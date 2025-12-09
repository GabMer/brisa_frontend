<!--src/components/users/ModalCrearUsuario.svelte - ACTUALIZADO-->
<script lang="ts">
  import type { Persona, UsuarioConCredenciales } from '../../../../lib/types/Usuarios y Roles/personas';
  import { UsersService } from '../../../../lib/services/Usuarios y Roles/usersService';
  
  interface Props {
    open?: boolean;
    persona: Persona | null;
    onclose?: () => void;
    oncreated?: () => void;
  }

  let { 
    open = $bindable(false),
    persona = null,
    onclose = () => {},
    oncreated = () => {}
  }: Props = $props();

  let loading = $state(false);
  let error = $state<string | null>(null);
  let showSuccess = $state(false);
  let credencialesGeneradas = $state<UsuarioConCredenciales | null>(null);

  // Datos del formulario
  let usuario = $state('');
  let correo = $state('');

  // ✅ Cargar datos cuando se abre el modal
  $effect(() => {
    if (open && persona) {
      usuario = generarUsuarioSugerido();
      correo = persona.correo || '';
      error = null;
      showSuccess = false;
      credencialesGeneradas = null;
    }
  });

  function generarUsuarioSugerido(): string {
    if (!persona) return '';
    
    // Generar: primera_letra_apellido + nombre
    const primeraLetraApellido = persona.apellido_paterno.charAt(0).toLowerCase();
    const nombreLimpio = persona.nombres.toLowerCase().replace(/\s+/g, '');
    
    return primeraLetraApellido + nombreLimpio;
  }

  function resetForm() {
    usuario = '';
    correo = '';
    error = null;
    showSuccess = false;
    credencialesGeneradas = null;
  }

  function handleClose() {
    if (!loading && !showSuccess) {
      resetForm();
      onclose();
    }
  }

  function handleCloseSuccess() {
    resetForm();
    oncreated();
    onclose();
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    
    if (!persona) {
      error = 'No se encontró información de la persona';
      return;
    }
    
    // Validaciones
    if (!usuario.trim()) {
      error = 'El nombre de usuario es obligatorio';
      return;
    }
    
    if (usuario.length < 3) {
      error = 'El usuario debe tener al menos 3 caracteres';
      return;
    }
    
    if (!correo.trim()) {
      error = 'El correo es obligatorio';
      return;
    }
    
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(correo.trim())) {
      error = 'El formato del correo no es válido';
      return;
    }

    try {
      loading = true;
      error = null;

      // ✅ Llamar al servicio ACTUALIZADO (sin password)
      const resultado = await UsersService.crearUsuario({
        id_persona: persona.id_persona,
        usuario: usuario.trim(),
        correo: correo.trim(),
        is_active: true
      });

      // ✅ Mostrar credenciales generadas
      credencialesGeneradas = resultado;
      showSuccess = true;

    } catch (err) {
      error = err instanceof Error ? err.message : 'Error al crear usuario';
      console.error('Error:', err);
    } finally {
      loading = false;
    }
  }

  function copiarPassword() {
    if (credencialesGeneradas) {
      navigator.clipboard.writeText(credencialesGeneradas.password_temporal);
      alert('Contraseña copiada al portapapeles');
    }
  }
</script>

{#if open && persona}
  <div class="modal-overlay">
    <button 
      class="modal-backdrop"
      onclick={showSuccess ? handleCloseSuccess : handleClose}
      aria-label="Cerrar modal"
      tabindex="-1"
    ></button>
    
    <div class="modal-container" role="dialog" aria-modal="true">
      {#if showSuccess && credencialesGeneradas}
        <!-- ✅ PANTALLA DE ÉXITO CON CREDENCIALES -->
        <div class="success-screen">
          <div class="success-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h3 class="success-title">¡Usuario Creado Exitosamente!</h3>
          <p class="success-subtitle">Para: <strong>{persona.nombre_completo}</strong></p>
          
          <div class="credentials-card">
            <div class="warning-banner">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Esta contraseña solo se mostrará UNA VEZ. Guárdela en un lugar seguro.</span>
            </div>
            
            <div class="credential-row">
              <span class="credential-label">Usuario:</span>
              <span class="credential-value">{credencialesGeneradas.usuario.usuario}</span>
            </div>
            
            <div class="credential-row">
              <span class="credential-label">Contraseña Temporal:</span>
              <div class="password-display">
                <code class="credential-password">{credencialesGeneradas.password_temporal}</code>
                <button class="btn-copy" onclick={copiarPassword} title="Copiar contraseña">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div class="info-note">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>El usuario deberá cambiar esta contraseña en su primer inicio de sesión.</span>
            </div>
          </div>
          
          <button class="btn btn-primary btn-block" onclick={handleCloseSuccess}>
            Entendido
          </button>
        </div>
      {:else}
        <!-- ✅ FORMULARIO DE CREACIÓN -->
        <div class="modal-header">
          <div>
            <h3 class="modal-title">Crear Usuario</h3>
            <p class="modal-subtitle">
              Para: <strong>{persona.nombre_completo}</strong>
            </p>
          </div>
          <button 
            type="button"
            class="btn-close" 
            onclick={handleClose} 
            disabled={loading}
            aria-label="Cerrar modal"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form class="modal-body" onsubmit={handleSubmit}>
          {#if error}
            <div class="alert alert-error" role="alert">
              <svg class="alert-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          {/if}
          
          <!-- Información de la persona -->
          <div class="info-card">
            <div class="info-row">
              <span class="info-label">CI:</span>
              <span class="info-value">{persona.ci}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Tipo:</span>
              <span class="info-value tipo-badge tipo-{persona.tipo_persona}">
                {persona.tipo_persona === 'profesor' ? 'Profesor' : 'Administrativo'}
              </span>
            </div>
          </div>
          
          <div class="info-banner">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            <span>Se generará automáticamente una contraseña temporal segura</span>
          </div>
          
          <!-- Usuario -->
          <div class="form-group">
            <label for="usuario" class="form-label">
              Nombre de Usuario <span class="required">*</span>
            </label>
            <input
              id="usuario"
              type="text"
              class="form-input"
              bind:value={usuario}
              placeholder="Ej: pjuan"
              minlength="3"
              maxlength="50"
              disabled={loading}
              required
            />
            <p class="help-text">Mínimo 3 caracteres, solo letras minúsculas, números y guiones</p>
          </div>
          
          <!-- Correo -->
          <div class="form-group">
            <label for="correo" class="form-label">
              Correo Electrónico <span class="required">*</span>
            </label>
            <input
              id="correo"
              type="email"
              class="form-input"
              bind:value={correo}
              placeholder="Ej: usuario@ejemplo.com"
              maxlength="50"
              disabled={loading}
              required
            />
          </div>
          
          <div class="modal-footer">
            <button 
              type="button" 
              class="btn btn-secondary" 
              onclick={handleClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              class="btn btn-primary"
              disabled={loading}
            >
              {#if loading}
                <div class="btn-spinner"></div>
                <span>Creando...</span>
              {:else}
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <span>Crear Usuario</span>
              {/if}
            </button>
          </div>
        </form>
      {/if}
    </div>
  </div>
{/if}

<style>
  @import './styles/ModalCrearUsuario.css';
</style>
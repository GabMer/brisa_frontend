<!--components/users/ModalEditarUsuario.svelte - VERSIÓN CORREGIDA-->
<script lang="ts">
  import type { Persona } from '../../../../lib/types/Usuarios y Roles/personas';
  import { UsersService } from '../../../../lib/services/Usuarios y Roles/usersService';

  interface Props {
    open?: boolean;
    persona: Persona | null;
    onclose?: () => void;
    onupdated?: () => void;
    onRefresh: () => void;
    onpasswordreset?: (persona: Persona, nuevaPassword: string) => void;
  }

  let { 
    open = $bindable(false),
    persona = null,
    onclose = () => {},
    onupdated = () => {},
    onRefresh,
    onpasswordreset = () => {}
  }: Props = $props();

  let loading = $state(false);
  let error = $state<string | null>(null);
  let showSuccess = $state(false);
  
  // Datos del formulario
  let usuario = $state('');
  let correo = $state('');
  let isActive = $state(true);
  let cambiarPassword = $state(false);
  let password = $state('');
  let confirmarPassword = $state('');
  let showPassword = $state(false);
  let showConfirmPassword = $state(false);

  // Cargar datos cuando se abre el modal
  $effect(() => {
    if (open && persona && persona.id_usuario) {
      usuario = persona.usuario || '';
      correo = persona.correo || '';
      cambiarPassword = false;
      password = '';
      confirmarPassword = '';
      error = null;
      showPassword = false;
      isActive = persona.usuario_activo ?? true;  
      showConfirmPassword = false;
      showSuccess = false;
    }
  });

  function resetForm() {
    usuario = '';
    correo = '';
    cambiarPassword = false;
    password = '';
    confirmarPassword = '';
    error = null;
    showPassword = false;
    showConfirmPassword = false;
    showSuccess = false;
    isActive = true;
  }

  function handleClose() {
    if (!loading) {
      resetForm();
      onclose();
    }
  }

  function handleCloseSuccess() {
    resetForm();
    onRefresh();
    onupdated();
    onclose();
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    
    if (!persona?.id_usuario) {
      error = 'No se encontró información del usuario';
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
    
    // Validar contraseña solo si se quiere cambiar
    if (cambiarPassword) {
      if (!password) {
        error = 'La contraseña es obligatoria';
        return;
      }
      
      if (password.length < 8) {
        error = 'La contraseña debe tener al menos 8 caracteres';
        return;
      }
      
      if (password !== confirmarPassword) {
        error = 'Las contraseñas no coinciden';
        return;
      }
    }

    try {
      loading = true;
      error = null;

      const updateData: any = {
        usuario: usuario.trim(),
        correo: correo.trim(),
        is_active: isActive
      };

      if (cambiarPassword && password) {
        updateData.password = password;
      }

      await UsersService.actualizarUsuario(persona.id_usuario, updateData);

      showSuccess = true;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error al actualizar usuario';
      console.error('Error:', err);
    } finally {
      loading = false;
    }
  }

  // ✅ FUNCIÓN CORREGIDA PARA RESTABLECER CONTRASEÑA
  async function handleRestablecerPassword() {
    if (!persona?.id_usuario) {
      console.error('❌ No hay persona o id_usuario');
      return;
    }

    console.log('🔄 Iniciando restablecimiento de contraseña para:', persona.nombre_completo);

    try {
      loading = true;
      error = null;

      const resultado = await UsersService.restablecerPassword(persona.id_usuario);
      
      console.log('✅ Contraseña restablecida exitosamente');
      console.log('📤 Llamando a onpasswordreset con:', {
        persona: persona.nombre_completo,
        password: resultado.nueva_password_temporal
      });
      
      // ✅ PRIMERO: Cerrar este modal
      open = false;
      resetForm();
      
      // ✅ SEGUNDO: Llamar a onpasswordreset para abrir ModalMostrarPassword
      setTimeout(() => {
        onpasswordreset(persona, resultado.nueva_password_temporal);
      }, 100); // Pequeño delay para asegurar que el modal se cierre primero
      
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error al restablecer contraseña';
      console.error('❌ Error al restablecer:', err);
    } finally {
      loading = false;
    }
  }

  

</script>

{#if open && persona && persona.id_usuario}
  <div class="modal-overlay">
    <button 
      class="modal-backdrop"
      onclick={showSuccess ? handleCloseSuccess : handleClose}
      aria-label="Cerrar modal"
      tabindex="-1"
    ></button>
    
    <div class="modal-container" role="dialog" aria-modal="true">
      {#if showSuccess}
        <!-- PANTALLA DE ÉXITO -->
        <div class="success-screen">
          <div class="success-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h3 class="success-title">¡Usuario Actualizado!</h3>
          <p class="success-subtitle">Para: <strong>{persona.nombre_completo}</strong></p>
          
          <button class="btn btn-primary btn-block" onclick={handleCloseSuccess}>
            Cerrar
          </button>
        </div>
      {:else}
        <!-- FORMULARIO DE EDICIÓN -->
        <div class="modal-header">
          <div>
            <h3 class="modal-title">Editar Usuario</h3>
            <p class="modal-subtitle">
              Persona: <strong>{persona.nombre_completo}</strong>
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
          </div>

          <!-- Estado del Usuario -->
          <div class="form-group">
            <label class="checkbox-label estado-toggle">
              <input
                type="checkbox"
                class="checkbox-input"
                bind:checked={isActive}
                disabled={loading}
              />
              <span>Usuario {isActive ? 'Activo' : 'Inactivo'}</span>
            </label>
            <p class="help-text">
              {isActive 
                ? '✅ El usuario puede iniciar sesión normalmente' 
                : '⚠️ El usuario no podrá iniciar sesión'}
            </p>
          </div>

          <!-- Separador -->
          <div class="divider"></div>
          
          <!-- BOTÓN PARA RESTABLECER CONTRASEÑA -->
          <div class="reset-password-section">
            <div class="reset-info">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <div>
                <p class="reset-title">¿Usuario olvidó su contraseña?</p>
                <p class="reset-description">Genere una nueva contraseña temporal automáticamente</p>
              </div>
            </div>
            <button 
              type="button"
              class="btn btn-warning"
              onclick={handleRestablecerPassword}
              disabled={loading}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Restablecer Contraseña</span>
            </button>
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
                <span>Actualizando...</span>
              {:else}
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Guardar Cambios</span>
              {/if}
            </button>
          </div>
        </form>
      {/if}
    </div>
  </div>
{/if}

<style>
  @import './styles/ModalEditarUsuario.css';
</style>
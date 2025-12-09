<script lang="ts">
  import { api } from '../../../../lib/services/Usuarios y Roles/api';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
  }

  let { isOpen = $bindable(), onClose }: Props = $props();

  let passwordActual = $state('');
  let passwordNueva = $state('');
  let confirmarPassword = $state('');
  let loading = $state(false);
  let error = $state<string | null>(null);
  let validationErrors = $state<string[]>([]); // ✅ Para errores de validación específicos
  let success = $state(false);

  async function handleSubmit() {
    error = null;
    validationErrors = [];

    // Validaciones básicas
    if (!passwordActual || !passwordNueva || !confirmarPassword) {
        error = 'Todos los campos son obligatorios';
        return;
    }

    if (passwordNueva !== confirmarPassword) {
        error = 'Las contraseñas nuevas no coinciden';
        return;
    }

    if (passwordNueva.length < 8) {
        error = 'La contraseña debe tener al menos 8 caracteres';
        return;
    }

    // Validaciones de seguridad (frontend)
    const errors: string[] = [];
    
    if (!/[A-Z]/.test(passwordNueva)) {
        errors.push('Debe contener al menos una letra mayúscula');
    }
    
    if (!/[a-z]/.test(passwordNueva)) {
        errors.push('Debe contener al menos una letra minúscula');
    }
    
    if (!/[0-9]/.test(passwordNueva)) {
        errors.push('Debe contener al menos un número');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(passwordNueva)) {
        errors.push('Debe contener al menos un carácter especial (!@#$%^&*...)');
    }

    // Validar contraseñas comunes
    const commonPasswords = ['12345678', 'password', 'qwerty', '11111111', 'abc123', 'password123'];
    if (commonPasswords.includes(passwordNueva.toLowerCase())) {
        errors.push('La contraseña es demasiado común, elige una más segura');
    }

    if (errors.length > 0) {
        validationErrors = errors;
        error = 'La contraseña no cumple con los requisitos de seguridad';
        return;
    }

    loading = true;

    try {
        await api.post('/api/auth/cambiar-password', {
            password_actual: passwordActual,
            password_nueva: passwordNueva,
            confirmar_password_nueva: confirmarPassword
        });

        success = true;
        setTimeout(() => {
            handleClose();
        }, 2000);
    } catch (err: any) {
        // ✅ Manejo inteligente de errores del backend
        if (err.response?.status === 422) {
            const details = err.response?.data?.detail;
            
            if (Array.isArray(details)) {
                // Extraer mensajes de validación de Pydantic
                const messages = details.map((detail: any) => {
                    if (detail.msg) {
                        // Limpiar el mensaje técnico
                        return detail.msg
                            .replace('Value error, ', '')
                            .split('; ')
                            .filter((msg: string) => msg.trim());
                    }
                    return [];
                }).flat();
                
                if (messages.length > 0) {
                    validationErrors = messages;
                    error = 'La contraseña no cumple con los requisitos de seguridad';
                } else {
                    error = 'Error de validación. Verifica los datos ingresados.';
                }
            } else if (typeof details === 'string') {
                error = details;
            } else {
                error = 'Error de validación. Verifica los datos ingresados.';
            }
        } else if (err.response?.data?.detail) {
            error = err.response.data.detail;
        } else if (err.response?.status === 401) {
            error = 'La contraseña actual es incorrecta';
        } else if (err.response?.status === 403) {
            error = 'No tienes permisos para realizar esta acción';
        } else {
            error = 'Error al cambiar contraseña. Intenta nuevamente.';
        }
    } finally {
        loading = false;
    }
  }

  function handleClose() {
    passwordActual = '';
    passwordNueva = '';
    confirmarPassword = '';
    error = null;
    validationErrors = [];
    success = false;
    onClose();
  }
</script>

{#if isOpen}
  <!-- Overlay -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal-overlay" onclick={handleClose}></div>

  <!-- Modal -->
  <div class="modal-container">
    <div class="modal-content">
      <!-- Header -->
      <div class="modal-header">
        <h2>Cambiar Contraseña</h2>
        <!-- svelte-ignore a11y_consider_explicit_label -->
        <button class="btn-close" onclick={handleClose}>
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="modal-body">
        {#if success}
          <div class="success-message">
            <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>¡Contraseña cambiada exitosamente!</p>
          </div>
        {:else}
          <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <!-- ✅ Requisitos de seguridad siempre visibles -->
            <div class="password-requirements">
              <h4>📋 Requisitos de seguridad:</h4>
              <ul>
                <li class:valid={passwordNueva.length >= 8}>Mínimo 8 caracteres</li>
                <li class:valid={/[A-Z]/.test(passwordNueva)}>Al menos una letra mayúscula (A-Z)</li>
                <li class:valid={/[a-z]/.test(passwordNueva)}>Al menos una letra minúscula (a-z)</li>
                <li class:valid={/[0-9]/.test(passwordNueva)}>Al menos un número (0-9)</li>
                <li class:valid={/[!@#$%^&*(),.?":{}|<>]/.test(passwordNueva)}>Al menos un carácter especial (!@#$%...)</li>
                <li class:valid={passwordNueva && !['12345678', 'password', 'qwerty', '11111111', 'abc123', 'password123'].includes(passwordNueva.toLowerCase())}>
                  No usar contraseñas comunes
                </li>
              </ul>
            </div>

            {#if error}
              <div class="error-message">
                ⚠️ {error}
              </div>
            {/if}

            <!-- ✅ Mostrar errores de validación específicos -->
            {#if validationErrors.length > 0}
              <div class="validation-errors">
                <h4>❌ Errores encontrados:</h4>
                <ul>
                  {#each validationErrors as validationError}
                    <li>{validationError}</li>
                  {/each}
                </ul>
              </div>
            {/if}

            <div class="form-group">
              <label for="password-actual">Contraseña Actual</label>
              <input
                id="password-actual"
                type="password"
                bind:value={passwordActual}
                placeholder="Ingresa tu contraseña actual"
                disabled={loading}
              />
            </div>

            <div class="form-group">
              <label for="password-nueva">Nueva Contraseña</label>
              <input
                id="password-nueva"
                type="password"
                bind:value={passwordNueva}
                placeholder="Ej: MiPassword123!"
                disabled={loading}
              />
            </div>

            <div class="form-group">
              <label for="confirmar-password">Confirmar Nueva Contraseña</label>
              <input
                id="confirmar-password"
                type="password"
                bind:value={confirmarPassword}
                placeholder="Repite la nueva contraseña"
                disabled={loading}
              />
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-cancel" onclick={handleClose} disabled={loading}>
                Cancelar
              </button>
              <button type="submit" class="btn-submit" disabled={loading}>
                {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
              </button>
            </div>
          </form>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  @import './styles/ModalCambiarPassword.css';
</style>
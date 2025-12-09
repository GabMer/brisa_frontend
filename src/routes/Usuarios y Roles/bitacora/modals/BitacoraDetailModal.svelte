<!-- src/components/bitacora/BitacoraDetailModal.svelte -->
<script lang="ts">
  import type { RegistroBitacora } from '../../../../lib/types/Usuarios y Roles/bitacora';

  interface Props {
    registro: RegistroBitacora | null;
    isOpen: boolean;
    onClose: () => void;
  }

  let { registro = null, isOpen = false, onClose }: Props = $props();

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  function formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleString('es-BO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  function getBadgeClass(accion: string): string {
    const accionLower = accion.toLowerCase();
    
    if (accionLower.includes('crear') || accionLower.includes('login')) {
      return 'badge-success';
    } else if (accionLower.includes('editar') || accionLower.includes('actualizar')) {
      return 'badge-info';
    } else if (accionLower.includes('eliminar') || accionLower.includes('logout')) {
      return 'badge-danger';
    } else if (accionLower.includes('asignar') || accionLower.includes('revocar')) {
      return 'badge-warning';
    }
    
    return 'badge-default';
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copiado al portapapeles');
    });
  }
</script>

{#if isOpen && registro}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal-backdrop" onclick={handleBackdropClick}>
    <div class="modal-content">
      <!-- Header -->
      <div class="modal-header">
        <div class="header-title">
          <span class="header-icon">{registro.icono}</span>
          <h2>Detalle del Registro de Auditoría</h2>
        </div>
        <button class="btn-close" onclick={onClose} title="Cerrar">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="modal-body">
        <!-- ID del Registro -->
        <div class="detail-section">
          <div class="section-header">
            <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"/>
            </svg>
            <h3>Identificador</h3>
          </div>
          <div class="detail-row">
            <span class="detail-label">ID Registro:</span>
            <div class="detail-value-group">
              <code class="detail-code">#{registro.id_bitacora}</code>
              <button
                class="btn-copy"
                onclick={() => copyToClipboard(String(registro.id_bitacora))}
                title="Copiar ID"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Información Temporal -->
        <div class="detail-section">
          <div class="section-header">
            <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <h3>Fecha y Hora</h3>
          </div>
          <div class="detail-row">
            <div class="timestamp-box">
              <svg class="timestamp-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <span class="timestamp-text">{formatearFecha(registro.fecha_hora)}</span>
            </div>
          </div>
        </div>

        <!-- Información del Usuario -->
        <div class="detail-section">
          <div class="section-header">
            <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            <h3>Usuario que Realizó la Acción</h3>
          </div>
          <div class="detail-rows">
            <div class="detail-row">
              <span class="detail-label">ID Usuario:</span>
              <code class="detail-code">#{registro.id_usuario_admin}</code>
            </div>
            <div class="detail-row">
              <span class="detail-label">Usuario:</span>
              <span class="detail-value strong">{registro.usuario}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Nombre Completo:</span>
              <span class="detail-value">{registro.nombre_completo}</span>
            </div>
          </div>
        </div>

        <!-- Información de la Acción -->
        <div class="detail-section">
          <div class="section-header">
            <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            <h3>Detalles de la Acción</h3>
          </div>
          <div class="detail-rows">
            <div class="detail-row">
              <span class="detail-label">Tipo de Acción:</span>
              <span class="badge {getBadgeClass(registro.accion)}">
                {registro.accion}
              </span>
            </div>
            <div class="detail-row full-width">
              <span class="detail-label">Descripción:</span>
              <div class="description-box">
                <p>{registro.descripcion}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Información del Objetivo -->
        <div class="detail-section">
          <div class="section-header">
            <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <h3>Objeto Afectado</h3>
          </div>
          <div class="detail-rows">
            <div class="detail-row">
              <span class="detail-label">Tipo de Objeto:</span>
              {#if registro.tipo_objetivo}
                <span class="tipo-badge">{registro.tipo_objetivo}</span>
              {:else}
                <span class="no-data">No especificado</span>
              {/if}
            </div>
            <div class="detail-row">
              <span class="detail-label">ID del Objeto:</span>
              {#if registro.id_objetivo}
                <code class="detail-code">#{registro.id_objetivo}</code>
              {:else}
                <span class="no-data">No aplica</span>
              {/if}
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button class="btn btn-primary" onclick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
   @import './styles/BitacoraDetailModal.css';
</style>
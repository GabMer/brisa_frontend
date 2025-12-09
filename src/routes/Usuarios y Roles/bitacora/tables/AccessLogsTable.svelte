<!--src/components/users.AccesLogsTable-->
<script lang="ts">
  import type { AccessLog } from '../../../../lib/types/Usuarios y Roles/users';
  
  interface Props {
    logs: AccessLog[];
    selectedUserId?: number | null;
  }
  
  let { logs, selectedUserId = null }: Props = $props();
  
  // Debug: Ver qué logs estamos recibiendo
  $effect(() => {
    console.log('📊 Logs recibidos en componente:', logs.length);
    console.log('🔍 Primeros 3 logs:', logs.slice(0, 3));
  });
  
  // Filtrar logs del usuario seleccionado si existe
  const displayLogs = $derived(
    selectedUserId 
      ? logs.filter(log => log.usuarioId === selectedUserId)
      : logs
  );
  
  const getStatusColor = (accion: string) => {
    const accionLower = accion.toLowerCase();
    if (accionLower.includes('exitoso') || accionLower.includes('inicio_sesion') || accionLower.includes('inicio sesion')) return 'success';
    if (accionLower.includes('fallido') || accionLower.includes('intento')) return 'error';
    if (accionLower.includes('bloqueado')) return 'blocked';
    return 'default';
  };
  
  const getActionIcon = (accion: string) => {
    const accionLower = accion.toLowerCase();
    if (accionLower.includes('login') || accionLower.includes('ingreso') || accionLower.includes('inicio')) return 'login';
    if (accionLower.includes('logout') || accionLower.includes('salida') || accionLower.includes('cerrar')) return 'logout';
    if (accionLower.includes('crear')) return 'create';
    if (accionLower.includes('actualizar') || accionLower.includes('editar')) return 'edit';
    if (accionLower.includes('eliminar')) return 'delete';
    if (accionLower.includes('fallido') || accionLower.includes('intento')) return 'error';
    return 'default';
  };
  
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };
</script>

<div class="logs-container">
  {#if displayLogs.length === 0}
    <div class="empty-state">
      <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <p class="empty-text">No hay registros de acceso</p>
      <p class="empty-hint">Los registros aparecerán aquí cuando los usuarios realicen acciones</p>
    </div>
  {:else}
    <div class="logs-timeline">
      {#each displayLogs as log (log.id)}
        <div class="log-item">
          <div class="log-marker">
            <div class="marker-icon marker-{getActionIcon(log.accion)}">
              {#if getActionIcon(log.accion) === 'login'}
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              {:else if getActionIcon(log.accion) === 'logout'}
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              {:else if getActionIcon(log.accion) === 'create'}
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
              {:else if getActionIcon(log.accion) === 'edit'}
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              {:else if getActionIcon(log.accion) === 'delete'}
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              {:else if getActionIcon(log.accion) === 'error'}
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              {:else}
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              {/if}
            </div>
          </div>
          
          <div class="log-content">
            <div class="log-header">
              <div class="log-main-info">
                <h4 class="log-action">{log.accion}</h4>
                <span class="status-badge status-{getStatusColor(log.accion)}">
                  {getStatusColor(log.accion)}
                </span>
              </div>
              <time class="log-time">
                {formatDate(log.fecha)}
              </time>
            </div>
            
            <div class="log-details">
              <div class="detail-row">
                <svg class="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
                <span class="detail-text">IP: <strong>{log.ip}</strong></span>
              </div>
              
              {#if log.detalles}
                <div class="detail-row">
                  <svg class="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="detail-text">{log.detalles}</span>
                </div>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  @import './styles/AccessLogsTable.css';
</style>
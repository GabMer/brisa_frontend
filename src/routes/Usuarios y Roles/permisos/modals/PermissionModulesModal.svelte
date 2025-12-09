<!--src/components/users/PermissionModulesModal.svelte-->
<script lang="ts">
    interface Props {
        isOpen: boolean;
        accion: string;
        descripcion: string;
        modulos: string[];
        onClose: () => void;
    }

    let { isOpen, accion, descripcion, modulos, onClose }: Props = $props();

    // Obtener icono según el tipo de permiso
    function getIconoPermiso(accion: string) {
        if (accion === "Lectura") {
            return `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
      </svg>`;
        } else if (accion === "Agregar") {
            return `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
      </svg>`;
        } else if (accion === "Modificar") {
            return `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
      </svg>`;
        } else if (accion === "Eliminar") {
            return `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
      </svg>`;
        }
        return `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
    </svg>`;
    }

    // Obtener color del módulo
    function getColorModulo(modulo: string): string {
        const colors: Record<string, string> = {
            usuarios: "blue",
            esquelas: "green",
            incidentes: "red",
            retiros_tempranos: "yellow",
            reportes: "purple",
            profesores: "cyan",
            administracion: "gray",
            "sin módulo": "gray",
        };
        return colors[modulo.toLowerCase()] || "indigo";
    }

    // Formatear nombre del módulo
    function formatModuleName(modulo: string): string {
        return modulo
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());
    }

    // Cerrar modal al presionar Escape
    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") {
            onClose();
        }
    }

    // Cerrar al hacer clic en el backdrop
    function handleBackdropClick(e: MouseEvent) {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
    <div
        class="modal-overlay"
        onclick={handleBackdropClick}
        onkeydown={(e) => e.key === "Escape" && onClose()}
        role="dialog"
        aria-modal="true"
        tabindex="-1"
    >
        <div class="modal-container">
            <!-- Header del Modal -->
            <div class="modal-header">
                <div class="header-content">
                    <div class="permission-icon-large {accion.toLowerCase()}">
                        {@html getIconoPermiso(accion)}
                    </div>
                    <div class="header-text">
                        <h2 class="modal-title">{accion}</h2>
                        <p class="modal-subtitle">{descripcion}</p>
                    </div>
                </div>
                <button
                    class="btn-close"
                    onclick={onClose}
                    aria-label="Cerrar modal"
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
            </div>

            <!-- Contenido del Modal -->
            <div class="modal-body">
                <div class="section-header">
                    <h3 class="section-title">Módulos donde aplica</h3>
                    <span class="modules-count">{modulos.length} módulos</span>
                </div>

                {#if modulos.length === 0}
                    <div class="empty-modules">
                        <svg
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                            />
                        </svg>
                        <p>No hay módulos asignados a este permiso</p>
                    </div>
                {:else}
                    <div class="modules-list">
                        {#each modulos as modulo}
                            <div class="module-card {getColorModulo(modulo)}">
                                <div class="module-icon">
                                    <svg
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                        />
                                    </svg>
                                </div>
                                <div class="module-info">
                                    <span class="module-name"
                                        >{formatModuleName(modulo)}</span
                                    >
                                    <span class="module-badge">{accion}</span>
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>

            <!-- Footer del Modal -->
            <div class="modal-footer">
                <button class="btn-secondary" onclick={onClose}>Cerrar</button>
            </div>
        </div>
    </div>
{/if}

<style>
    @import './styles/PermissionModulesModal.css';
</style>

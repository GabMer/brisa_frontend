<!-- src/components/bitacora/BitacoraFilters.svelte -->
<script lang="ts">
    import type { FiltrosBitacora } from "../../../../lib/types/Usuarios y Roles/bitacora";
    import type { User } from "../../../../lib/types/Usuarios y Roles/users";

    interface Props {
        usuarios?: User[];
        tiposAcciones?: string[];
        onBuscar?: (filtros: FiltrosBitacora) => void;
        onLimpiar?: () => void;
    }

    let {
        usuarios = [],
        tiposAcciones = [],
        onBuscar,
        onLimpiar,
    }: Props = $props();

    // Filtros locales
    let usuario_admin = $state<number | undefined>(undefined);
    let accion = $state<string>("");
    let tipo_objetivo = $state<string>("");
    let fecha_inicio = $state<string>("");
    let fecha_fin = $state<string>("");

    // Estado del panel de filtros
    let showFilters = $state(true);

    $effect(() => {
        console.log("🔍 Estado de filtros:", showFilters);
    });
    // Tipos de objetivo comunes
    const tiposObjetivo = ["Usuario", "Rol", "Permiso", "Persona"];

    function handleBuscar() {
        const filtros: FiltrosBitacora = {};

        if (usuario_admin) filtros.usuario_admin = usuario_admin;
        if (accion) filtros.accion = accion;
        if (tipo_objetivo) filtros.tipo_objetivo = tipo_objetivo;
        if (fecha_inicio) filtros.fecha_inicio = fecha_inicio;
        if (fecha_fin) filtros.fecha_fin = fecha_fin;

        console.log("🔍 Aplicando filtros:", filtros);
        onBuscar?.(filtros);
    }

    function handleLimpiar() {
        usuario_admin = undefined;
        accion = "";
        tipo_objetivo = "";
        fecha_inicio = "";
        fecha_fin = "";

        onLimpiar?.();
    }

    function toggleFilters() {
        showFilters = !showFilters;
    }

    // Computed: hay filtros activos
    let hayFiltrosActivos = $derived(
        usuario_admin !== undefined ||
            accion !== "" ||
            tipo_objetivo !== "" ||
            fecha_inicio !== "" ||
            fecha_fin !== "",
    );
</script>

<div class="filters-container">
    <div class="filters-header">
        <div class="filters-title">
            <svg
                class="title-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
            </svg>
            <h3>Filtros de Búsqueda</h3>
            {#if hayFiltrosActivos}
                <span class="filters-badge">Activos</span>
            {/if}
        </div>

        <button
            class="btn-toggle"
            onclick={toggleFilters}
            title={showFilters ? "Ocultar filtros" : "Mostrar filtros"}
        >
            <svg
                class="toggle-icon"
                class:rotated={!showFilters}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                />
            </svg>
        </button>
    </div>

    {#if showFilters}
        <div class="filters-content">
            <div class="filters-grid">
                <!-- Filtro: Usuario -->
                <div class="filter-group">
                    <label for="filter-usuario" class="filter-label">
                        <svg
                            class="label-icon"
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
                        Usuario
                    </label>
                    <select
                        id="filter-usuario"
                        class="filter-select"
                        bind:value={usuario_admin}
                    >
                        <option value={undefined}>Todos los usuarios</option>
                        {#each usuarios as user (user.id_usuario)}
                            <option value={user.id_usuario}
                                >{user.usuario}</option
                            >
                        {/each}
                    </select>
                </div>

                <!-- Filtro: Acción -->
                <div class="filter-group">
                    <label for="filter-accion" class="filter-label">
                        <svg
                            class="label-icon"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                        </svg>
                        Tipo de Acción
                    </label>
                    <select
                        id="filter-accion"
                        class="filter-select"
                        bind:value={accion}
                    >
                        <option value="">Todas las acciones</option>
                        {#each tiposAcciones as tipoAccion (tipoAccion)}
                            <option value={tipoAccion}>{tipoAccion}</option>
                        {/each}
                    </select>
                </div>

                <!-- Filtro: Tipo de Objetivo -->
                <div class="filter-group">
                    <label for="filter-tipo" class="filter-label">
                        <svg
                            class="label-icon"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                            />
                        </svg>
                        Tipo de Objetivo
                    </label>
                    <select
                        id="filter-tipo"
                        class="filter-select"
                        bind:value={tipo_objetivo}
                    >
                        <option value="">Todos los tipos</option>
                        {#each tiposObjetivo as tipo (tipo)}
                            <option value={tipo}>{tipo}</option>
                        {/each}
                    </select>
                </div>

                <!-- Filtro: Fecha Inicio -->
                <div class="filter-group">
                    <label for="filter-fecha-inicio" class="filter-label">
                        <svg
                            class="label-icon"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        </svg>
                        Fecha Inicio
                    </label>
                    <input
                        id="filter-fecha-inicio"
                        type="date"
                        class="filter-input"
                        bind:value={fecha_inicio}
                    />
                </div>

                <!-- Filtro: Fecha Fin -->
                <div class="filter-group">
                    <label for="filter-fecha-fin" class="filter-label">
                        <svg
                            class="label-icon"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        </svg>
                        Fecha Fin
                    </label>
                    <input
                        id="filter-fecha-fin"
                        type="date"
                        class="filter-input"
                        bind:value={fecha_fin}
                    />
                </div>
            </div>

            <!-- Botones de acción -->
            <div class="filters-actions">
                <button
                    class="btn btn-secondary"
                    onclick={handleLimpiar}
                    disabled={!hayFiltrosActivos}
                >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                    Limpiar Filtros
                </button>

                <button class="btn btn-primary" onclick={handleBuscar}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                    Buscar
                </button>
            </div>
        </div>
    {/if}
</div>

<style>
    @import './styles/BitacoraFilters.css';
</style>

<!--src/components/users/PermissionsTable.svelte-->
<script lang="ts">
  import type { Permission } from "../../../../lib/types/Usuarios y Roles/users";

  interface Props {
    permissions: Permission[];
    selectedUserId?: number | null;
    onEdit?: (permission: Permission) => void;
    onDelete?: (permissionId: number) => void;
    onRefresh?: () => void;
    onViewDetail?: (modulos: string[], accion: string, descripcion: string) => void;
  }

  let {
    permissions,
    selectedUserId = null,
    onEdit = () => {},
    onDelete = () => {},
    onRefresh = () => {},
    onViewDetail = () => {},
  }: Props = $props();

  let searchTerm = $state("");

  // 🎯 AGRUPACIÓN POR TIPO DE PERMISO (sin duplicados)
  interface PermisoUnico {
    accion: string;
    descripcion: string;
    modulos: string[];
    permisos: Permission[];
  }

  // Agrupar permisos únicos por acción
  const permisosUnicos = $derived(() => {
    const grupos = new Map<string, PermisoUnico>();

    permissions.forEach((permiso) => {
      const accion = permiso.nombre;
      const modulo = permiso.modulo || "Sin módulo";

      if (!grupos.has(accion)) {
        grupos.set(accion, {
          accion: accion,
          descripcion: getDescripcion(accion),
          modulos: [],
          permisos: [],
        });
      }

      const grupo = grupos.get(accion)!;
      grupo.permisos.push(permiso);

      if (!grupo.modulos.includes(modulo)) {
        grupo.modulos.push(modulo);
      }
    });

    // Ordenar en orden lógico
    const ordenAcciones = ["Lectura", "Agregar", "Modificar", "Eliminar"];
    const resultado = Array.from(grupos.values());

    resultado.sort((a, b) => {
      const indexA = ordenAcciones.indexOf(a.accion);
      const indexB = ordenAcciones.indexOf(b.accion);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });

    return resultado;
  });

  // Filtrar por búsqueda
  const permisosFiltrados = $derived(() => {
    if (searchTerm === "") {
      return permisosUnicos();
    }

    return permisosUnicos().filter((permiso) => {
      const accionMatch = permiso.accion
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const descripcionMatch = permiso.descripcion
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      return accionMatch || descripcionMatch;
    });
  });

  // Obtener descripción del permiso
  function getDescripcion(accion: string): string {
    const descripciones: Record<string, string> = {
      "Lectura": "Permite ver y consultar información",
      "Agregar": "Permite crear nuevos registros",
      "Modificar": "Permite editar registros existentes",
      "Eliminar": "Permite eliminar registros",
    };
    return descripciones[accion] || "Permiso del sistema";
  }

  // Manejar ver detalle
  function handleVerDetalle(permiso: PermisoUnico) {
    onViewDetail(permiso.modulos, permiso.accion, permiso.descripcion);
  }
</script>

<div class="permissions-container">

  <!-- Header -->
  <div class="content-header">
    <div class="header-info">
      <h2 class="section-title">Permisos del Sistema</h2>
      <p class="section-subtitle">
        {permisosUnicos().length} tipos de permisos disponibles
      </p>
    </div>
  </div>

  <!-- Tabla de permisos simplificada -->
  {#if permisosFiltrados().length === 0}
    <div class="empty-state">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
        />
      </svg>
      <p>No se encontraron permisos con esos criterios</p>
    </div>
  {:else}
    <div class="table-wrapper">
      <table class="permissions-table">
        <thead>
          <tr>
            <th class="col-icon"></th>
            <th class="col-permiso">Tipo de Permiso</th>
            <th class="col-descripcion">Descripción</th>
            <th class="col-acciones">Nivel de Acceso</th>
          </tr>
        </thead>
        <tbody>
          {#each permisosFiltrados() as permiso (permiso.accion)}
            <tr class="permission-row">
              <!-- Icono del permiso -->
              <td class="icon-cell">
                <div class="permission-icon {permiso.accion.toLowerCase()}">
                  {#if permiso.accion === "Lectura"}
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  {:else if permiso.accion === "Agregar"}
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  {:else if permiso.accion === "Modificar"}
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  {:else if permiso.accion === "Eliminar"}
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  {:else}
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  {/if}
                </div>
              </td>

              <!-- Nombre del permiso -->
              <td class="permission-cell">
                <span class="permission-name">{permiso.accion}</span>
              </td>

              <!-- Descripción -->
              <td class="description-cell">
                <span class="permission-description">
                  {permiso.descripcion}
                </span>
              </td>

              <!-- Acciones -->
              <td class="acciones-btn-cell">
                <div class="action-buttons">
                  <button
                    onclick={() => handleVerDetalle(permiso)}
                    class="btn-accion btn-ver"
                    title="Ver módulos donde aplica"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Ver detalles
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  @import './PermissionsTable.css';
</style>
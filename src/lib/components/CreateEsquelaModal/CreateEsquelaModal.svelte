<!--src/lib/components/CreateEsquelaModal/CreateEsquelaModal.svelte - CORREGIDO-->
<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { apiClient } from "$lib/services/api.js";
  import { authService } from "$lib/services/Usuarios_Roles/auth";
  import type {
    EsquelaCreate,
    CodigoEsquela,
    Estudiante,
    Profesor,
  } from "$lib/types/api.js";
  import "./CreateEsquelaModal.css";

  const dispatch = createEventDispatcher();

  export let show = false;
  export let codigos: CodigoEsquela[] = [];

  // Obtener usuario correctamente
  let currentUser: any = null;
  let userRole = "";
  let isProfesor = false;
  let isAdmin = false;
  let isRegente = false;

  // Listas para los dropdowns
  let estudiantes: Estudiante[] = [];
  let profesores: Profesor[] = [];
  let cursos: any[] = [];

  // Campos del formulario
  let idEstudiante = 0;
  let idProfesor = 0;
  let fecha = new Date().toISOString().split("T")[0];
  let observaciones = "";
  let codigosSeleccionados: number[] = [];

  // Estados de búsqueda
  let searchEstudiante = "";
  let searchProfesor = "";
  let filtroCurso: number | null = null;
  let showEstudianteDropdown = false;
  let showProfesorDropdown = false;

  // Selecciones actuales
  let estudianteSeleccionado: Estudiante | null = null;
  let profesorSeleccionado: Profesor | null = null;

  // Mostrar/ocultar campo profesor según rol
  let mostrarCampoProfesor = false;

  let loading = false;
  let error = "";

  // Inicializar usuario al abrir el modal
  onMount(async () => {
    await cargarUsuario();
  });

  async function cargarUsuario() {
    try {
      const response = await authService.getMe();
      currentUser = response.data;

      // Determinar rol
      if (currentUser.rol) {
        userRole = currentUser.rol;
      } else if (currentUser.roles && currentUser.roles.length > 0) {
        userRole = currentUser.roles[0].nombre || currentUser.roles[0];
      }

      isProfesor = userRole === "Profesor";
      isAdmin = userRole === "Administrativo";
      isRegente = userRole === "Regente";

      // Mostrar campo profesor solo si NO es profesor
      mostrarCampoProfesor = !isProfesor;
    } catch (err) {
      console.error("Error cargando usuario:", err);
      error = "Error al cargar información del usuario";
    }
  }

  // Variables reactivas para los dropdowns filtrados
  $: estudiantesFiltrados = searchEstudiante
    ? estudiantes
        .filter((est) => {
          const nombreCompleto = est.nombre_completo || "";
          const ci = est.ci || "";
          return (
            nombreCompleto
              .toLowerCase()
              .includes(searchEstudiante.toLowerCase()) ||
            ci.includes(searchEstudiante)
          );
        })
        .slice(0, 10)
    : estudiantes.slice(0, 10);

  $: profesoresFiltrados = searchProfesor
    ? profesores
        .filter(
          (prof) =>
            prof.nombre_completo
              .toLowerCase()
              .includes(searchProfesor.toLowerCase()) ||
            prof.ci.includes(searchProfesor),
        )
        .slice(0, 10)
    : profesores.slice(0, 10);

  $: if (show) {
    cargarListas();
  }

  async function cargarListas() {
    try {
      // Cargar cursos según el rol:
      // - Profesor: solo sus cursos asignados usando /courses/mis_cursos/{id_usuario}
      // - Regente/Administrativo: todos los cursos usando /courses/
      let cursosData;
      
      if (isProfesor) {
        // Obtener id_usuario del usuario actual (asignador)
        const idUsuario = currentUser?.id_usuario;
        
        if (!idUsuario) {
          error = "No se pudo obtener la información del usuario.";
          console.error("❌ id_usuario no disponible:", currentUser);
          return;
        }

        cursosData = await apiClient.getCourseTeachersList(idUsuario);
      } else {
        // Regente/Administrativo: todos los cursos
        cursosData = await apiClient.getCourses();
      }

      cursos = Array.isArray(cursosData) ? cursosData : [];

      // Para Regente y Administrativo, cargar lista de profesores
      if (!isProfesor) {
        const profesoresData = await apiClient.getProfesores();
        // Construir nombre_completo si no existe
        profesores = profesoresData.map((prof: any) => {
          if (!prof.nombre_completo && prof.nombres) {
            prof.nombre_completo = `${prof.nombres} ${prof.apellido_paterno || ''} ${prof.apellido_materno || ''}`.trim();
          }
          return prof;
        });
      }
    } catch (err: any) {
      console.error("Error cargando listas:", err);
      error = err.message;
    }
  }

  async function cargarEstudiantesPorCurso(cursoId: number) {
    try {
      const response = await apiClient.get(
        `/courses/${cursoId}/students?page=1&page_size=1000`,
      );
      console.log("Response completo:", response);

      let estudiantesData = [];

      if (Array.isArray(response)) {
        estudiantesData = response;
      } else if (response && typeof response === "object") {
        if ("data" in response && Array.isArray(response.data)) {
          estudiantesData = response.data;
        } else if ("items" in response && Array.isArray(response.items)) {
          estudiantesData = response.items;
        } else if (
          "estudiantes" in response &&
          Array.isArray(response.estudiantes)
        ) {
          estudiantesData = response.estudiantes;
        }
      }

      estudiantes = estudiantesData.map((est: any) => {
        if (!est.nombre_completo && est.nombres) {
          est.nombre_completo =
            `${est.nombres} ${est.apellido_paterno || ""} ${est.apellido_materno || ""}`.trim();
        }
        return est;
      });

      estudiantes = [...estudiantes];

      if (estudiantes.length > 0) {
        showEstudianteDropdown = true;
      }

      error = "";
    } catch (err: any) {
      console.error("❌ Error cargando estudiantes:", err);
      error = `Error al cargar estudiantes: ${err.message}`;
      estudiantes = [];
    }
  }

  async function handleCursoChange() {
    deseleccionarEstudiante();

    if (filtroCurso) {
      await cargarEstudiantesPorCurso(filtroCurso);
    } else {
      try {
        const estudiantesData = await apiClient.getEstudiantes();
        estudiantes = estudiantesData.map((est: any) => {
          if (!est.nombre_completo && est.nombres) {
            est.nombre_completo =
              `${est.nombres} ${est.apellido_paterno || ""} ${est.apellido_materno || ""}`.trim();
          }
          return est;
        });
        error = "";
      } catch (err: any) {
        console.error("Error cargando todos los estudiantes:", err);
        estudiantes = [];
      }
    }
  }

  function seleccionarEstudiante(estudiante: Estudiante) {
    estudianteSeleccionado = estudiante;
    idEstudiante = estudiante.id_estudiante;
    searchEstudiante = estudiante.nombre_completo;
    showEstudianteDropdown = false;
  }

  function deseleccionarEstudiante() {
    estudianteSeleccionado = null;
    idEstudiante = 0;
    searchEstudiante = "";
  }

  function seleccionarProfesor(profesor: Profesor) {
    profesorSeleccionado = profesor;
    idProfesor = profesor.id_persona;
    searchProfesor = profesor.nombre_completo;
    showProfesorDropdown = false;
  }

  function deseleccionarProfesor() {
    profesorSeleccionado = null;
    idProfesor = 0;
    searchProfesor = "";
  }

  function toggleCodigo(codigoId: number) {
    if (codigosSeleccionados.includes(codigoId)) {
      codigosSeleccionados = codigosSeleccionados.filter(
        (id) => id !== codigoId,
      );
    } else {
      codigosSeleccionados = [...codigosSeleccionados, codigoId];
    }
  }

  async function crearEsquela() {
    if (isProfesor) {
      if (
        !idEstudiante ||
        !observaciones ||
        codigosSeleccionados.length === 0
      ) {
        error = "Todos los campos son obligatorios";
        return;
      }
    } else {
      if (
        !idEstudiante ||
        !idProfesor ||
        !observaciones ||
        codigosSeleccionados.length === 0
      ) {
        error = "Todos los campos son obligatorios";
        return;
      }
    }

    try {
      loading = true;
      error = "";

      const payload: any = {
        id_estudiante: idEstudiante,
        fecha: fecha,
        observaciones,
        codigos: codigosSeleccionados,
      };

      if (!isProfesor && idProfesor) {
        payload.id_profesor = idProfesor;
      }

      console.log("📤 Payload para crear esquela:", payload);

      await apiClient.createEsquela(payload);

      dispatch("created");
      cerrarModal();
    } catch (err: any) {
      console.error("❌ Error creando esquela:", err);
      error = err.message || "Error creando esquela";
    } finally {
      loading = false;
    }
  }

  function cerrarModal() {
    show = false;
    idEstudiante = 0;
    idProfesor = 0;
    fecha = new Date().toISOString().split("T")[0];
    observaciones = "";
    codigosSeleccionados = [];
    searchEstudiante = "";
    searchProfesor = "";
    filtroCurso = null;
    estudianteSeleccionado = null;
    profesorSeleccionado = null;
    error = "";
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      cerrarModal();
    }
  }

  function handleClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest(".dropdown-container")) {
      showEstudianteDropdown = false;
      showProfesorDropdown = false;
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} on:click={handleClickOutside} />

{#if show}
  <!-- ✅ CORREGIDO: Agregar role="presentation" -->
  <div class="modal-overlay" on:click={cerrarModal} role="presentation">
    <div class="modal" on:click|stopPropagation role="dialog" aria-modal="true">
      <div class="modal-header">
        <h2>Nueva Esquela</h2>
        <button class="btn-close" on:click={cerrarModal}>&times;</button>
      </div>

      <div class="modal-content">
        {#if error}
          <div class="alert alert-error">
            ❌ {error}
          </div>
        {/if}

        <form on:submit|preventDefault={crearEsquela}>
          <!-- Filtro por Curso -->
          <div class="form-group">
            <label for="filtroCurso">Filtrar Estudiantes por Curso</label>
            <select
              id="filtroCurso"
              bind:value={filtroCurso}
              on:change={handleCursoChange}
              class="curso-select"
            >
              <option value={null}>-- Todos los cursos --</option>
              {#each cursos as curso}
                <option value={curso.id_curso}>
                  {curso.nombre_curso || `${curso.grado}${curso.paralelo}`}
                </option>
              {/each}
            </select>
          </div>

          <!-- Estudiante -->
          <div class="form-group">
            <!-- ✅ CORREGIDO: Label tiene control asociado -->
            <label for="search-estudiante">Estudiante *</label>
            <div class="dropdown-container">
              <div class="input-with-clear">
                <input
                  id="search-estudiante"
                  type="text"
                  placeholder="Buscar estudiante por nombre o cédula..."
                  bind:value={searchEstudiante}
                  on:focus={() => (showEstudianteDropdown = true)}
                  on:input={() => (showEstudianteDropdown = true)}
                  class="search-input"
                  class:selected={estudianteSeleccionado}
                />
                {#if estudianteSeleccionado}
                  <button
                    type="button"
                    class="clear-btn"
                    on:click={deseleccionarEstudiante}
                    title="Limpiar selección"
                  >
                    ✕
                  </button>
                {/if}
              </div>
              {#if showEstudianteDropdown}
                {#if estudiantesFiltrados.length > 0}
                  <!-- ✅ CORREGIDO: Usar botones en lugar de div clickeable -->
                  <div class="dropdown" role="listbox">
                    {#each estudiantesFiltrados as estudiante}
                      <button
                        type="button"
                        class="dropdown-item"
                        on:click={() => seleccionarEstudiante(estudiante)}
                        role="option"
                      >
                        <div class="item-main">
                          <strong>{estudiante.nombre_completo}</strong>
                          <span class="item-detail">CI: {estudiante.ci}</span>
                        </div>
                      </button>
                    {/each}
                  </div>
                {:else}
                  <div class="dropdown">
                    <div
                      class="dropdown-item"
                      style="color: #666; cursor: default;"
                    >
                      {#if filtroCurso}
                        No hay estudiantes en este curso
                      {:else}
                        No se encontraron estudiantes
                      {/if}
                    </div>
                  </div>
                {/if}
              {/if}
            </div>
          </div>

          <!-- Profesor - Solo visible para Regente/Administrativo -->
          {#if mostrarCampoProfesor}
            <div class="form-group">
              <!-- ✅ CORREGIDO: Label tiene control asociado -->
              <label for="search-profesor"
                >Profesor que manda la esquela *</label
              >
              <div class="dropdown-container">
                <div class="input-with-clear">
                  <input
                    id="search-profesor"
                    type="text"
                    placeholder="Buscar profesor por nombre o cédula..."
                    bind:value={searchProfesor}
                    on:focus={() => (showProfesorDropdown = true)}
                    on:input={() => (showProfesorDropdown = true)}
                    class="search-input"
                    class:selected={profesorSeleccionado}
                  />
                  {#if profesorSeleccionado}
                    <button
                      type="button"
                      class="clear-btn"
                      on:click={deseleccionarProfesor}
                      title="Limpiar selección"
                    >
                      ✕
                    </button>
                  {/if}
                </div>
                {#if showProfesorDropdown && profesoresFiltrados.length > 0}
                  <!-- ✅ CORREGIDO: Usar botones -->
                  <div class="dropdown" role="listbox">
                    {#each profesoresFiltrados as profesor}
                      <button
                        type="button"
                        class="dropdown-item"
                        on:click={() => seleccionarProfesor(profesor)}
                        role="option"
                      >
                        <div class="item-main">
                          <strong>{profesor.nombre_completo}</strong>
                          <span class="item-detail"
                            >CI: {profesor.ci} | Tel: {profesor.telefono}</span
                          >
                        </div>
                      </button>
                    {/each}
                  </div>
                {/if}
              </div>
            </div>
          {/if}

          <!-- Fecha -->
          <div class="form-group">
            <label for="fecha">Fecha *</label>
            <input type="date" id="fecha" bind:value={fecha} required />
          </div>

          <div class="form-group">
            <label for="observaciones">Observaciones *</label>
            <textarea
              id="observaciones"
              bind:value={observaciones}
              required
              rows="4"
              placeholder="Descripción del reconocimiento o esquela..."
            ></textarea>
          </div>

          <div class="form-group">
            <span class="form-label">Códigos de Esquela *</span>
            <div class="codigos-grid">
              {#each codigos as codigo}
                <label class="codigo-checkbox">
                  <input
                    type="checkbox"
                    checked={codigosSeleccionados.includes(codigo.id_codigo)}
                    on:change={() => toggleCodigo(codigo.id_codigo)}
                  />
                  <div class="codigo-info">
                    <span class="codigo-codigo">{codigo.codigo}</span>
                    <span class="codigo-descripcion">{codigo.descripcion}</span>
                    <span class="codigo-tipo">{codigo.tipo}</span>
                  </div>
                </label>
              {/each}
            </div>
          </div>

          <div class="form-actions">
            <button
              type="button"
              class="btn btn-secondary"
              on:click={cerrarModal}
            >
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" disabled={loading}>
              {loading ? "Creando..." : "Crear Esquela"}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}

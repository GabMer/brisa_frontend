<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { apiClient } from '$lib/services/api.js';
  import { authService } from '$lib/services/auth.js';
  import type { EsquelaCreate, CodigoEsquela, Estudiante, Profesor } from '$lib/types/api.js';

  export let show = false;
  export let codigos: CodigoEsquela[] = [];

  const dispatch = createEventDispatcher();

  // Obtener usuario actual
  let currentUser = authService.getUserData();
  let userRole = currentUser?.roles?.[0]?.nombre || '';
  let isProfesor = userRole === 'Profesor';
  let isAdmin = userRole === 'Administrativo';
  let isRegente = userRole === 'Regente';

  // Listas para los dropdowns
  let estudiantes: Estudiante[] = [];
  let profesores: Profesor[] = [];
  let cursos: any[] = [];

  // Campos del formulario
  let idEstudiante = 0;
  let idProfesor = 0;
  let fecha = new Date().toISOString().split('T')[0];
  let observaciones = '';
  let codigosSeleccionados: number[] = [];

  // Estados de búsqueda
  let searchEstudiante = '';
  let searchProfesor = '';
  let filtroCurso: number | null = null; // Curso seleccionado
  let showEstudianteDropdown = false;
  let showProfesorDropdown = false;

  // Selecciones actuales
  let estudianteSeleccionado: Estudiante | null = null;
  let profesorSeleccionado: Profesor | null = null;

  // Mostrar/ocultar campo profesor según rol
  let mostrarCampoProfesor = !isProfesor;

  let loading = false;
  let error = '';

  // Variables reactivas para los dropdowns filtrados
  $: estudiantesFiltrados = searchEstudiante 
    ? estudiantes.filter(est => {
        const nombreCompleto = est.nombre_completo || '';
        const ci = est.ci || '';
        return nombreCompleto.toLowerCase().includes(searchEstudiante.toLowerCase()) ||
               ci.includes(searchEstudiante);
      }).slice(0, 10)
    : estudiantes.slice(0, 10);

  $: profesoresFiltrados = searchProfesor
    ? profesores.filter(prof => 
        prof.nombre_completo.toLowerCase().includes(searchProfesor.toLowerCase()) ||
        prof.ci.includes(searchProfesor)
      ).slice(0, 10)
    : profesores.slice(0, 10);

  $: if (show) {
    cargarListas();
  }

  async function cargarListas() {
    try {
      // Cargar cursos según el rol
      let cursosData;
      if (isProfesor) {
        // Obtener id_persona del profesor
        let idPersona = currentUser?.id_persona;
        
        // Si no tenemos id_persona, buscar por CI en la lista de profesores
        if (!idPersona && currentUser?.ci) {
          const profesoresData = await apiClient.getProfesores();
          const profesorEncontrado = profesoresData.find((p: any) => p.ci === currentUser.ci);
          if (profesorEncontrado) {
            idPersona = profesorEncontrado.id_persona;
          }
        }
        
        if (idPersona) {
          cursosData = await apiClient.get(`/courses/teacher/${idPersona}/courses`);
        } else {
          error = 'No se pudo cargar los cursos del profesor';
          return;
        }
      } else {
        cursosData = await apiClient.getCourses();
      }
      cursos = Array.isArray(cursosData) ? cursosData : [];

      // Para Regente y Administrativo, cargar lista de profesores
      if (!isProfesor) {
        const profesoresData = await apiClient.getProfesores();
        profesores = profesoresData;
      }
    } catch (err: any) {
      console.error('Error cargando listas:', err);
      error = err.message;
    }
  }

  async function cargarEstudiantesPorCurso(cursoId: number) {
    try {
      const response = await apiClient.get(`/courses/${cursoId}/students?page=1&page_size=1000`);
      console.log('Response completo:', response);
      
      // Extraer estudiantes según el formato de respuesta
      let estudiantesData = [];
      
      if (Array.isArray(response)) {
        estudiantesData = response;
      } else if (response && typeof response === 'object') {
        if ('data' in response && Array.isArray(response.data)) {
          estudiantesData = response.data;
        } else if ('items' in response && Array.isArray(response.items)) {
          estudiantesData = response.items;
        } else if ('estudiantes' in response && Array.isArray(response.estudiantes)) {
          estudiantesData = response.estudiantes;
        }
      }
      
      console.log('📊 estudiantesData extraído:', estudiantesData);
      
      // Construir nombre_completo si no existe
      estudiantes = estudiantesData.map((est: any) => {
        if (!est.nombre_completo && est.nombres) {
          est.nombre_completo = `${est.nombres} ${est.apellido_paterno || ''} ${est.apellido_materno || ''}`.trim();
        }
        return est;
      });
      
      console.log('✅ Array estudiantes final:', estudiantes.length, estudiantes);
      
      // Forzar actualización del estado reactivo
      estudiantes = [...estudiantes];
      
      // Abrir dropdown automáticamente si hay estudiantes
      if (estudiantes.length > 0) {
        showEstudianteDropdown = true;
      }
      
      // Limpiar error siempre al cargar estudiantes exitosamente
      error = '';
    } catch (err: any) {
      console.error('❌ Error cargando estudiantes:', err);
      error = `Error al cargar estudiantes: ${err.message}`;
      estudiantes = [];
    }
  }

  async function handleCursoChange() {
    // Limpiar selección de estudiante al cambiar curso
    deseleccionarEstudiante();
    
    if (filtroCurso) {
      await cargarEstudiantesPorCurso(filtroCurso);
    } else {
      // Recargar todos los estudiantes
      try {
        const estudiantesData = await apiClient.getEstudiantes();
        // Construir nombre_completo si no existe
        estudiantes = estudiantesData.map((est: any) => {
          if (!est.nombre_completo && est.nombres) {
            est.nombre_completo = `${est.nombres} ${est.apellido_paterno || ''} ${est.apellido_materno || ''}`.trim();
          }
          return est;
        });
        error = '';
      } catch (err: any) {
        console.error('Error cargando todos los estudiantes:', err);
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
    searchEstudiante = '';
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
    searchProfesor = '';
  }

  function toggleCodigo(codigoId: number) {
    if (codigosSeleccionados.includes(codigoId)) {
      codigosSeleccionados = codigosSeleccionados.filter(id => id !== codigoId);
    } else {
      codigosSeleccionados = [...codigosSeleccionados, codigoId];
    }
  }

  async function crearEsquela() {
    // Validar campos según el rol
    if (isProfesor) {
      // Profesor no necesita seleccionar profesor (backend lo asigna automáticamente)
      if (!idEstudiante || !observaciones || codigosSeleccionados.length === 0) {
        error = 'Todos los campos son obligatorios';
        return;
      }
    } else {
      // Regente/Administrativo necesitan seleccionar profesor
      if (!idEstudiante || !idProfesor || !observaciones || codigosSeleccionados.length === 0) {
        error = 'Todos los campos son obligatorios';
        return;
      }
    }

    try {
      loading = true;
      error = '';

      const payload: any = {
        id_estudiante: idEstudiante,
        fecha: fecha + 'T00:00:00.000Z',
        observaciones,
        codigos: codigosSeleccionados
      };

      // Solo incluir id_profesor si no es Profesor (Regente/Administrativo)
      if (!isProfesor) {
        payload.id_profesor = idProfesor;
      }

      await apiClient.createEsquela(payload);

      dispatch('created');
      cerrarModal();
    } catch (err: any) {
      error = err.message || 'Error creando esquela';
    } finally {
      loading = false;
    }
  }

  function cerrarModal() {
    show = false;
    // Reset form
    idEstudiante = 0;
    idProfesor = 0;
    fecha = new Date().toISOString().split('T')[0];
    observaciones = '';
    codigosSeleccionados = [];
    searchEstudiante = '';
    searchProfesor = '';
    filtroCurso = null;
    estudianteSeleccionado = null;
    profesorSeleccionado = null;
    error = '';
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      cerrarModal();
    }
  }

  // Cerrar dropdowns al hacer clic fuera
  function handleClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-container')) {
      showEstudianteDropdown = false;
      showProfesorDropdown = false;
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} on:click={handleClickOutside} />

{#if show}
  <div class="modal-overlay" on:click={cerrarModal} on:keydown={handleKeydown} role="dialog" aria-modal="true" tabindex="-1">
    <div class="modal" on:click|stopPropagation on:keydown={handleKeydown} role="document" tabindex="-1">
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
            <label>Estudiante *</label>
            <div class="dropdown-container">
              <div class="input-with-clear">
                <input
                  type="text"
                  placeholder="Buscar estudiante por nombre o cédula..."
                  bind:value={searchEstudiante}
                  on:focus={() => showEstudianteDropdown = true}
                  on:input={() => showEstudianteDropdown = true}
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
                  <div class="dropdown">
                    {#each estudiantesFiltrados as estudiante}
                      <div class="dropdown-item" on:click={() => seleccionarEstudiante(estudiante)}>
                        <div class="item-main">
                          <strong>{estudiante.nombre_completo}</strong>
                          <span class="item-detail">CI: {estudiante.ci}</span>
                        </div>
                      </div>
                    {/each}
                  </div>
                {:else}
                  <div class="dropdown">
                    <div class="dropdown-item" style="color: #666; cursor: default;">
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

          <!-- Profesor que manda la esquela - Solo visible para Regente/Administrativo -->
        {#if mostrarCampoProfesor}
          <div class="form-group">
            <label>Profesor que manda la esquela *</label>
            <div class="dropdown-container">
              <div class="input-with-clear">
                <input
                  type="text"
                  placeholder="Buscar profesor por nombre o cédula..."
                  bind:value={searchProfesor}
                  on:focus={() => showProfesorDropdown = true}
                  on:input={() => showProfesorDropdown = true}
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
              {#if showProfesorDropdown && filtrarProfesores().length > 0}
                <div class="dropdown">
                  {#each filtrarProfesores() as profesor}
                    <div class="dropdown-item" on:click={() => seleccionarProfesor(profesor)}>
                      <div class="item-main">
                        <strong>{profesor.nombre_completo}</strong>
                        <span class="item-detail">CI: {profesor.ci} | Tel: {profesor.telefono}</span>
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          </div>
        {/if}

          <!-- Fecha -->
          <div class="form-group">
            <label for="fecha">Fecha *</label>
            <input 
              type="date" 
              id="fecha"
              bind:value={fecha} 
              required
            />
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
            <button type="button" class="btn btn-secondary" on:click={cerrarModal}>
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Esquela'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal {
    background: white;
    border-radius: 12px;
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  @media (max-width: 640px) {
    .modal {
      width: 95%;
      max-height: 95vh;
      border-radius: 8px;
    }

    .modal-header {
      padding: 1rem;
    }

    .modal-content {
      padding: 1rem;
    }

    .form-actions {
      flex-direction: column;
    }

    .btn {
      width: 100%;
    }

    .codigos-grid {
      max-height: 150px;
    }
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .modal-header h2 {
    margin: 0;
    color: #1e293b;
  }

  .btn-close {
    background: none;
    border: none;
    font-size: 2rem;
    color: #64748b;
    cursor: pointer;
    line-height: 1;
  }

  .btn-close:hover {
    color: #dc2626;
  }

  .modal-content {
    padding: 1.5rem;
  }

  .alert {
    padding: 0.75rem 1rem;
    border-radius: 6px;
    margin-bottom: 1rem;
  }

  .alert-error {
    background: #fef2f2;
    color: #dc2626;
    border: 1px solid #fca5a5;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-group label,
  .form-label {
    display: block;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.5rem;
  }

  .form-group input,
  .form-group textarea,
  .form-group select {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e2e8f0;
    border-radius: 6px;
    font-size: 0.95rem;
    transition: border-color 0.2s;
  }

  .form-group input:focus,
  .form-group textarea:focus,
  .form-group select:focus {
    outline: none;
    border-color: #22d3ee;
  }

  .curso-select {
    background-color: #f8fafc;
    cursor: pointer;
  }

  .curso-select:hover {
    background-color: #f1f5f9;
  }

  .codigos-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.75rem;
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 1rem;
  }

  .codigo-checkbox {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 6px;
    transition: background-color 0.2s;
  }

  .codigo-checkbox:hover {
    background: #f8fafc;
  }

  .codigo-checkbox input[type="checkbox"] {
    margin-top: 0.25rem;
    width: auto;
  }

  .codigo-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
  }

  .codigo-codigo {
    font-weight: 600;
    color: #1e293b;
  }

  .codigo-descripcion {
    font-size: 0.9rem;
    color: #475569;
  }

  .codigo-tipo {
    font-size: 0.8rem;
    color: #64748b;
    text-transform: uppercase;
  }

  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-secondary {
    background: #f1f5f9;
    color: #475569;
  }

  .btn-secondary:hover {
    background: #e2e8f0;
  }

  .btn-primary {
    background: linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(34, 211, 238, 0.4);
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Dropdown Styles */
  .dropdown-container {
    position: relative;
  }

  .input-with-clear {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-input {
    width: 100%;
    padding: 0.75rem;
    padding-right: 2.5rem; /* Espacio para el botón de limpiar */
    border: 2px solid #e2e8f0;
    border-radius: 6px;
    font-size: 0.95rem;
    transition: border-color 0.2s;
  }

  .search-input:focus {
    outline: none;
    border-color: #22d3ee;
  }

  .search-input.selected {
    background-color: #f0f9ff;
    border-color: #0ea5e9;
  }

  .clear-btn {
    position: absolute;
    right: 0.75rem;
    background: none;
    border: none;
    color: #64748b;
    cursor: pointer;
    font-size: 1rem;
    padding: 0.25rem;
    border-radius: 4px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
  }

  .clear-btn:hover {
    background: #f1f5f9;
    color: #dc2626;
    transform: scale(1.1);
  }

  .dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    max-height: 320px;
    overflow-y: auto;
    z-index: 1000;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    margin-top: 4px;
  }

  .dropdown-item {
    padding: 1rem;
    cursor: pointer;
    border-bottom: 1px solid #f1f5f9;
    transition: all 0.15s ease;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .dropdown-item:hover {
    background: #f0f9ff;
    transform: translateX(2px);
  }

  .dropdown-item:active {
    background: #e0f2fe;
  }

  .dropdown-item:last-child {
    border-bottom: none;
  }

  .item-main {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .item-main strong {
    color: #1e293b;
    font-size: 0.95rem;
  }

  .item-detail {
    color: #64748b;
    font-size: 0.85rem;
  }

  .item-cedula {
    color: #64748b;
    font-size: 0.85rem;
    font-family: monospace;
    background: #f1f5f9;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }
</style>
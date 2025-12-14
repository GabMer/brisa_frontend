<script lang="ts">
    import './page.css';
    import '$lib/components/svg'
	import { onMount } from 'svelte';
	import { apiClient } from '$lib/services/api';
	import type { EstudianteListadoDTO, EstudianteListadoItem } from '$lib/types/api';
    import { getIconSvg } from '$lib/components/svg';

	let loading = false;
	let error: string | null = null;
	let reporte: EstudianteListadoDTO | null = null;

	// Filtros
	let cursoId: number | undefined = undefined;
	let nivel: 'inicial' | 'primaria' | 'secundaria' | '' = '';
	let gestion: string = '';
	
	// Cursos disponibles
	let cursos: any[] = [];
	let loadingCursos = false;

	// Para exportar
	let exportFormat: 'csv' | 'excel' = 'csv';

	async function cargarCursos() {
		loadingCursos = true;
		try {
			const data = await apiClient.getCourses();
			cursos = Array.isArray(data) ? data : [];
		} catch (err) {
			console.error('Error cargando cursos:', err);
			cursos = [];
		} finally {
			loadingCursos = false;
		}
	}

	async function cargarReporte() {
		loading = true;
		error = null;
		
		try {
			const params: any = {};
			if (cursoId) params.curso_id = cursoId;
			if (nivel) params.nivel = nivel;
			if (gestion) params.gestion = gestion;

			reporte = await apiClient.getReporteEstudiantes(params);
		} catch (err: any) {
			error = err.message || 'Error al cargar el reporte';
			console.error('Error:', err);
		} finally {
			loading = false;
		}
	}

	function limpiarFiltros() {
		cursoId = undefined;
		nivel = '';
		gestion = '';
		cargarReporte();
	}

	function exportarDatos() {
		if (!reporte || !reporte.estudiantes.length) return;

		if (exportFormat === 'csv') {
			exportarCSV();
		} else {
			alert('Exportación a Excel próximamente disponible');
		}
	}

	function exportarCSV() {
		if (!reporte) return;

		const headers = ['ID', 'CI', 'Nombre Completo', 'Fecha Nacimiento', 'Edad', 'Cursos'];
		const rows = reporte.estudiantes.map(est => [
			est.id_estudiante,
			est.ci,
			est.nombre_completo,
			est.fecha_nacimiento || '',
			est.edad || '',
			est.cursos.join('; ') || ''
		]);

		const csvContent = [
			headers.join(','),
			...rows.map(row => row.map(cell => `"${cell}"`).join(','))
		].join('\n');

		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		const url = URL.createObjectURL(blob);
		link.setAttribute('href', url);
		link.setAttribute('download', `estudiantes_${new Date().toISOString().split('T')[0]}.csv`);
		link.style.visibility = 'hidden';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	onMount(() => {
		cargarCursos();
		cargarReporte();
	});
</script>

<div class="reporte-container">
	<div class="reporte-header">
		<h2><span class="icon">{@html getIconSvg('clipboard-list')}</span> Listado General de Estudiantes</h2>
		<p>Filtra y consulta estudiantes por curso, nivel educativo o gestión</p>
	</div>

	<div class="filtros-section">
		<div class="filtros-grid">
			<div class="form-group">
				<label for="curso">Curso</label>
				<select id="curso" bind:value={cursoId} disabled={loadingCursos}>
					<option value={undefined}>Todos los cursos</option>
					{#each cursos as curso}
						<option value={curso.id_curso}>
							{curso.nombre_curso || `${curso.grado}° ${curso.paralelo} - ${curso.nivel}`}
						</option>
					{/each}
				</select>
			</div>

			<div class="form-group">
				<label for="nivel">Nivel Educativo</label>
				<select id="nivel" bind:value={nivel}>
					<option value="">Todos los niveles</option>
					<option value="inicial">Inicial</option>
					<option value="primaria">Primaria</option>
					<option value="secundaria">Secundaria</option>
				</select>
			</div>

			<div class="form-group">
				<label for="gestion">Gestión (Año)</label>
				<input 
					type="text" 
					id="gestion"
					bind:value={gestion}
					placeholder="Ej: 2024"
				/>
			</div>
		</div>

		<div class="filtros-actions">
			<button class="btn btn-primary" on:click={cargarReporte} disabled={loading}>
				{#if loading}
					<span class="icon">{@html getIconSvg('clock')}</span> Cargando...
				{:else}
					<span class="icon">{@html getIconSvg('search')}</span> Buscar
				{/if}
			</button>
			<button class="btn btn-secondary" on:click={limpiarFiltros} disabled={loading}>
				<span class="icon">{@html getIconSvg('refresh')}</span> Limpiar Filtros
			</button>
		</div>
	</div>

	{#if error}
		<div class="error-message">
			<span class="icon">{@html getIconSvg('alert-triangle')}</span> {error}
		</div>
	{/if}

	{#if loading}
		<div class="loading-spinner">
			<div class="spinner"></div>
			<p>Cargando reporte...</p>
		</div>
	{:else if reporte}
		<div class="resultados-section">
			<div class="resultados-header">
				<div class="resultados-info">
					<h3>Resultados: {reporte.total} estudiante{reporte.total !== 1 ? 's' : ''}</h3>
					{#if reporte.curso || reporte.nivel || reporte.gestion}
						<p class="filtros-aplicados">
							Filtros: 
							{#if reporte.curso}Curso ID {reporte.curso}{/if}
							{#if reporte.nivel} | Nivel: {reporte.nivel}{/if}
							{#if reporte.gestion} | Gestión: {reporte.gestion}{/if}
						</p>
					{/if}
				</div>

				<div class="export-controls">
					<select bind:value={exportFormat} class="export-select">
						<option value="csv">CSV</option>
						<option value="excel">Excel</option>
					</select>
					<button 
						class="btn btn-export" 
						on:click={exportarDatos}
						disabled={!reporte.estudiantes.length}
					>
						<span class="icon">{@html getIconSvg('download')}</span> Exportar
					</button>
				</div>
			</div>

			{#if reporte.estudiantes.length === 0}
				<div class="empty-state">
					<p>No se encontraron estudiantes con los filtros aplicados</p>
				</div>
			{:else}
				<div class="table-container">
					<table class="estudiantes-table">
						<thead>
							<tr>
								<th>ID</th>
								<th>CI</th>
								<th>Nombres Completos</th>
								<th>Fecha Nac.</th>
								<th>Edad</th>
								<th>Cursos</th>
							</tr>
						</thead>
						<tbody>
							{#each reporte.estudiantes as estudiante}
								<tr>
									<td>{estudiante.id_estudiante}</td>
									<td>{estudiante.ci}</td>
									<td class="nombre-completo">
										{estudiante.nombre_completo}
									</td>
									<td>{estudiante.fecha_nacimiento || '-'}</td>
									<td>
										{#if estudiante.edad !== null}
											{estudiante.edad} años
										{:else}
											-
										{/if}
									</td>
									<td class="cursos-cell">
										{#if estudiante.cursos && estudiante.cursos.length > 0}
											{#each estudiante.cursos as curso}
												<span class="curso-badge">{curso}</span>
											{/each}
										{:else}
											-
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	{/if}
</div>


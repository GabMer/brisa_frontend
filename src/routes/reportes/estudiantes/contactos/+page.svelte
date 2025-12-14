<script lang="ts">
    import './contactos.css'
	import { onMount } from 'svelte';
	import { apiClient } from '$lib/services/api';
	import type { ContactoApoderadoItem, ContactosApoderadosResponseDTO, TipoApoderado } from '$lib/types/api';
	import { getIconSvg } from '$lib/components/svg';

	let loading = false;
	let error: string | null = null;
	let reporte: ContactosApoderadosResponseDTO | null = null;

	// Cursos disponibles
	let cursos: any[] = [];

	// Filtros
	let cursoId: number | null = null;
	let nivel: 'inicial' | 'primaria' | 'secundaria' | '' = '';
	let gestion: string = '';

	type ContactosPorEstudiante = {
		id_estudiante: number;
		estudiante_ci: string;
		estudiante_nombre: string;
		padre?: ContactoResumido;
		madre?: ContactoResumido;
	};

	let expandedByStudentId: Record<number, boolean> = {};

	function agruparPorEstudiante(contactos: ContactoApoderadoItem[]): ContactosPorEstudiante[] {
		const map = new Map<number, ContactosPorEstudiante>();

		for (const contacto of contactos) {
			const current = map.get(contacto.id_estudiante) ?? {
				id_estudiante: contacto.id_estudiante,
				estudiante_ci: contacto.estudiante_ci,
				estudiante_nombre: contacto.estudiante_nombre
			};

			const resumen: ContactoResumido = {
				tipo: contacto.tipo_apoderado,
				nombre: contacto.apoderado_nombre,
				telefono: contacto.telefono
			};

			if (contacto.tipo_apoderado === 'padre') current.padre = resumen;
			if (contacto.tipo_apoderado === 'madre') current.madre = resumen;

			map.set(contacto.id_estudiante, current);
		}

		return Array.from(map.values()).sort((a, b) => a.estudiante_nombre.localeCompare(b.estudiante_nombre));
	}

	$: contactosAgrupados = reporte ? agruparPorEstudiante(reporte.contactos) : [];

	function toggleExpanded(idEstudiante: number) {
		expandedByStudentId = {
			...expandedByStudentId,
			[idEstudiante]: !expandedByStudentId[idEstudiante]
		};
	}

	async function cargarReporte() {
		loading = true;
		error = null;
		
		try {
			const params: any = {};
			if (cursoId) params.curso_id = cursoId;
			if (nivel) params.nivel = nivel;
			if (gestion) params.gestion = gestion;

			reporte = await apiClient.getReporteContactosApoderados(params);
			expandedByStudentId = {};
		} catch (err: any) {
			error = err.message || 'Error al cargar el reporte';
			console.error('Error:', err);
		} finally {
			loading = false;
		}
	}

	async function cargarCursos() {
		try {
			const cursosData = await apiClient.getCourses();
			cursos = Array.isArray(cursosData) ? cursosData : [];
		} catch (err: any) {
			console.error('Error cargando cursos:', err);
			cursos = [];
		}
	}

	function limpiarFiltros() {
		cursoId = null;
		nivel = '';
		gestion = '';
		expandedByStudentId = {};
		cargarReporte();
	}

	function exportarCSV() {
		if (!reporte) return;

		const headers = [
			'Estudiante ID',
			'CI Estudiante',
			'Estudiante',
			'Padre - Nombre',
			'Padre - Teléfono',
			'Madre - Nombre',
			'Madre - Teléfono'
		];

		const rows = contactosAgrupados.map(item => [
			item.id_estudiante,
			item.estudiante_ci,
			item.estudiante_nombre,
			item.padre?.nombre ?? '',
			item.padre?.telefono ?? '',
			item.madre?.nombre ?? '',
			item.madre?.telefono ?? ''
		]);

		const csvContent = [
			headers.join(','),
			...rows.map(row => row.map(cell => `"${cell}"`).join(','))
		].join('\n');

		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		const url = URL.createObjectURL(blob);
		link.setAttribute('href', url);
		link.setAttribute('download', `contactos_apoderados_${new Date().toISOString().split('T')[0]}.csv`);
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
		<h2><span class="icon">{@html getIconSvg('phone')}</span> Contactos de Apoderados</h2>
		<p>Información de contacto de padres y madres registrados</p>
	</div>

	<div class="filtros-section">
		<div class="filtros-grid">
			<div class="form-group">
				<label for="curso">Curso</label>
				<select 
					id="curso"
					bind:value={cursoId}
				>
					<option value={undefined}>-- Todos los cursos --</option>
					{#each cursos as curso}
						<option value={curso.id_curso}>
							{curso.nombre_curso || `${curso.grado}° ${curso.paralelo}`}
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
					<h3>Total Contactos: {reporte.total} • Estudiantes: {contactosAgrupados.length}</h3>
				</div>

				<button 
					class="btn btn-export" 
					on:click={exportarCSV}
					disabled={!reporte.contactos.length}
				>
					<span class="icon">{@html getIconSvg('download')}</span> Exportar CSV
				</button>
			</div>

			{#if reporte.contactos.length === 0}
				<div class="empty-state">
					<p>No se encontraron contactos con los filtros aplicados</p>
				</div>
			{:else}
				<div class="table-container">
					<table class="contactos-table">
						<thead>
							<tr>
								<th>Estudiante</th>
								<th>CI Estudiante</th>
								<th>Contactos</th>
							</tr>
						</thead>
						<tbody>
							{#each contactosAgrupados as item (item.id_estudiante)}
								<tr class:row-expanded={!!expandedByStudentId[item.id_estudiante]}>
									<td class="nombre-estudiante">
										<button
											type="button"
											class="estudiante-toggle"
											on:click={() => toggleExpanded(item.id_estudiante)}
										>
											<span class="estudiante-nombre">{item.estudiante_nombre}</span>
										</button>
									</td>
									<td>{item.estudiante_ci}</td>
									<td>
										<div class="contactos-resumen">
											{#if item.padre}
												<span class="tipo-badge tipo-padre">Padre</span>
											{/if}
											{#if item.madre}
												<span class="tipo-badge tipo-madre">Madre</span>
											{/if}
											{#if !item.padre && !item.madre}
												<span class="sin-contactos">Sin contactos</span>
											{/if}
										</div>
									</td>
								</tr>
								{#if expandedByStudentId[item.id_estudiante]}
									<tr class="detalle-row">
										<td colspan="3">
											<div class="contactos-detalle">
												<div class="contacto-card">
													<span class="tipo-badge tipo-padre">Padre</span>
													<div class="contacto-info">
														<div class="contacto-nombre">{item.padre?.nombre ?? 'No registrado'}</div>
														{#if item.padre?.telefono}
															<a href="tel:{item.padre.telefono}" class="telefono-link">
																<span class="icon">{@html getIconSvg('smartphone')}</span> {item.padre.telefono}
															</a>
														{:else}
															<span class="telefono-vacio">Teléfono no registrado</span>
														{/if}
													</div>
												</div>

												<div class="contacto-card">
													<span class="tipo-badge tipo-madre">Madre</span>
													<div class="contacto-info">
														<div class="contacto-nombre">{item.madre?.nombre ?? 'No registrado'}</div>
														{#if item.madre?.telefono}
															<a href="tel:{item.madre.telefono}" class="telefono-link">
																<span class="icon">{@html getIconSvg('smartphone')}</span> {item.madre.telefono}
															</a>
														{:else}
															<span class="telefono-vacio">Teléfono no registrado</span>
														{/if}
													</div>
												</div>
											</div>
										</td>
									</tr>
								{/if}
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	{/if}
</div>


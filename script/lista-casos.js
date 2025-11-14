document.addEventListener('DOMContentLoaded', function () {
    // Elementos del DOM
    const searchClientInput = document.getElementById('searchClientInput');
    const searchRUCInput = document.getElementById('searchRUCInput');
    const employeeContainer = document.querySelector('.employee-container');
    const paginationContainer = document.getElementById('pagination');

    // Variables de estado
    let currentPage = 1;
    const itemsPerPage = 4;
    let allCases = [];
    let filteredCases = [];
    let filterTimeout;

    // Mapeos para tipos, estados y etapas
    const tipoMap = {
        1: "Esquela ",
        2: "Fiscalización Parcial-IGV ",
        3: "Fiscalización Total-IGV",
        4: "Fiscalización Parcial-RENTA",
        5: "Fiscalización Total-RENTA ",
        6: "Cruce de Información  "
    };
    const estadoMap = {
        1: "Notificado",
        2: "Presentado",
        3: "Prórroga",
        4: "Anulado",
        5: "Eliminado"
    };

    const etapaMap = {
        1: "1er Requerimiento",
        2: "2do Requerimiento",
        3: "3ro Requerimiento",
        4: "4to Requerimiento",
        5: "Cierre",
        6: "Reclamación",
        7: "Apelación",
        8: "Proceso Contencioso",
        10: "Finalizado",
        11: "5to Requerimiento",
        12: "6to Requerimiento",
        13: "7mo Requerimiento"
    };

    // Función para cargar los casos
    async function loadCases() {
        try {
            showLoading(true);
            const response = await fetch('../app/casos/get_cases.php');
            const data = await response.json();

            if (data.success) {
                allCases = data.data;
                filteredCases = allCases.filter(caso => caso.id_estado != 5); // Excluir eliminados
                loadSavedFilters(); // Cargar filtros guardados
                renderCases();
                renderPagination();
                updateResultsCounter();
            } else {
                throw new Error(data.message || 'Error al cargar casos');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Error al cargar casos: ' + error.message);
        } finally {
            showLoading(false);
        }
    }

    // Función para renderizar los casos
    function renderCases() {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const casesToShow = filteredCases.slice(start, end);

        employeeContainer.innerHTML = '<h4>Lista de casos</h4>';

        if (casesToShow.length === 0) {
            employeeContainer.innerHTML += '<p class="no-results">No se encontraron casos</p>';
            return;
        }

        casesToShow.forEach(caso => {
            const caseElement = document.createElement('div');
            caseElement.className = 'client-item';
            caseElement.dataset.caseId = caso.id_fiscalizacion;

            // Icono de premio solo para etapa 1
            const awardIcon = caso.id_etapa == 1 ? '<i class="bi bi-award-fill"></i>' : '';

            caseElement.innerHTML = `
                <div class="client-info">
                    <div class="client-details">
                        <h3>${caso.razon_social || 'Sin nombre'} ${awardIcon}</h3>
                        <p><strong>RUC:</strong> ${caso.RUC || 'Sin RUC'}</p>
                        <p><strong>N° Doc:</strong> ${caso.numero}</p>
                        <p><strong>Tipo:</strong> ${tipoMap[caso.id_tipo] || 'Desconocido'}</p>
                        <p><strong>Estado:</strong> ${estadoMap[caso.id_estado] || 'Desconocido'}</p>
                        <p><strong>Etapa:</strong> ${etapaMap[caso.id_etapa] || 'Desconocida'}</p>
                        <p><strong>Periodo:</strong> ${formatPeriod(caso.periodo_inicio, caso.periodo_final)}</p>  
                        <p><strong>Fecha Notif.:</strong> ${formatDate(caso.fecha_notificacion) || 'Sin fecha'}</p>
                        
                        <!-- NUEVO: Mostrar agentes asignados -->
                        <div class="assigned-agents">
                            <strong>Agentes:</strong> 
                            ${formatAgentsPreview(caso.agentes_sunat)}
                        </div>
                    </div>
                    <div class="client-actions">
                        <button class="preview-btn"><i class="bi bi-eye"></i> Vista Previa</button>
                        <button class="edit-btn"><i class="bi bi-pencil"></i> Editar</button>
                        ${caso.id_etapa == 1 ? '<button class="complaint-btn"><i class="bi bi-emoji-frown-fill"></i> Quejas</button>' : ''}
                        <button class="delete-btn"><i class="bi bi-trash"></i> ${caso.id_estado == 5 ? 'Eliminado' : 'Eliminar'}</button>
                    </div>
                </div>
            `;

            employeeContainer.appendChild(caseElement);
        });

        addEventListeners();
    }

    // FUNCIÓN PARA FORMATEAR VISTA PREVIA DE AGENTES
    function formatAgentsPreview(agentes) {
        if (!agentes || !Array.isArray(agentes) || agentes.length === 0) {
            return '<span class="no-agents">Sin agentes asignados</span>';
        }
        
        const agentNames = agentes.map(agente => 
            agente.nombre_completo || 'Agente sin nombre'
        ).join(', ');
        
        // Limitar a 50 caracteres para vista previa
        const displayNames = agentNames.length > 50 ? agentNames.substring(0, 50) + '...' : agentNames;
        
        return `<span class="agents-list" title="${agentNames}">${displayNames}</span>`;
    }

    // FUNCIÓN PARA BUSCAR EN AGENTES SUNAT
    function searchInAgents(agentes, searchTerm) {
        if (!agentes || !Array.isArray(agentes)) return false;
        
        return agentes.some(agente => 
            agente.nombre_completo?.toLowerCase().includes(searchTerm) ||
            agente.cargo?.toLowerCase().includes(searchTerm) ||
            agente.area?.toLowerCase().includes(searchTerm)
        );
    }

    // Función para formatear el periodo (inicio - fin)
    function formatPeriod(start, end) {
        if (!start || !end) return 'Sin periodo';
        return `${start} - ${end}`;
    }

    // Función para formatear fechas
    function formatDate(dateString) {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toLocaleDateString('es-PE');
    }

    // Función para formatear montos de IGV
    function formatIGV(igvValue) {
        if (!igvValue) return 'N/A';
        return 'S/ ' + parseFloat(igvValue).toFixed(2);
    }

    // FUNCIÓN MEJORADA: Filtrado con debounce
    function filterCases() {
        clearTimeout(filterTimeout);
        filterTimeout = setTimeout(performFiltering, 300);
    }

    // FUNCIÓN PRINCIPAL DE FILTRADO MEJORADA
    function performFiltering() {
        const clientSearch = searchClientInput.value.toLowerCase();
        const rucSearch = searchRUCInput.value.toLowerCase();
        const numberSearch = document.getElementById('searchNumberInput')?.value.toLowerCase() || '';
        const agentSearch = document.getElementById('searchAgentInput')?.value.toLowerCase() || '';
        const typeFilter = document.getElementById('filterType')?.value || '';
        const statusFilter = document.getElementById('filterStatus')?.value || '';
        const stageFilter = document.getElementById('filterStage')?.value || '';
        const dateFrom = document.getElementById('filterDateFrom')?.value;
        const dateTo = document.getElementById('filterDateTo')?.value;

        filteredCases = allCases.filter(caso => {
            const matchesClient = !clientSearch || caso.razon_social?.toLowerCase().includes(clientSearch);
            const matchesRUC = !rucSearch || caso.RUC?.includes(rucSearch);
            const matchesNumber = !numberSearch || caso.numero?.toLowerCase().includes(numberSearch);
            const matchesAgent = !agentSearch || searchInAgents(caso.agentes_sunat, agentSearch);
            const matchesType = !typeFilter || caso.id_tipo == typeFilter;
            const matchesStatus = !statusFilter || caso.id_estado == statusFilter;
            const matchesStage = !stageFilter || caso.id_etapa == stageFilter;
            const matchesDate = filterByDate(caso.fecha_notificacion, dateFrom, dateTo);

            return matchesClient && matchesRUC && matchesNumber && matchesAgent && 
                   matchesType && matchesStatus && matchesStage && matchesDate;
        });

        currentPage = 1;
        renderCases();
        renderPagination();
        updateResultsCounter();
        saveFilters(); // Guardar filtros
    }

    // FUNCIÓN PARA FILTRAR POR FECHA
    function filterByDate(caseDate, dateFrom, dateTo) {
        if (!dateFrom && !dateTo) return true;
        if (!caseDate) return false;
        
        const caseDateObj = new Date(caseDate);
        const fromObj = dateFrom ? new Date(dateFrom) : null;
        const toObj = dateTo ? new Date(dateTo) : null;
        
        let matches = true;
        if (fromObj) matches = matches && caseDateObj >= fromObj;
        if (toObj) matches = matches && caseDateObj <= toObj;
        
        return matches;
    }

    // FUNCIÓN PARA ACTUALIZAR CONTADOR DE RESULTADOS
    function updateResultsCounter() {
        const counter = document.getElementById('resultsCounter') || createResultsCounter();
        
        const agentSearch = document.getElementById('searchAgentInput')?.value;
        const typeFilter = document.getElementById('filterType')?.value;
        let additionalInfo = '';
        
        if (agentSearch) {
            additionalInfo += ` • Agente: "${agentSearch}"`;
        }
        if (typeFilter) {
            additionalInfo += ` • Tipo: "${tipoMap[typeFilter]}"`;
        }
        
        counter.textContent = `Mostrando ${filteredCases.length} de ${allCases.length} casos${additionalInfo}`;
    }

    function createResultsCounter() {
        const counter = document.createElement('div');
        counter.id = 'resultsCounter';
        counter.className = 'results-counter';
        document.querySelector('.content-complaint').insertBefore(counter, document.querySelector('.complaint-list'));
        return counter;
    }

    // Función para renderizar paginación
    function renderPagination() {
        const totalPages = Math.ceil(filteredCases.length / itemsPerPage);
        paginationContainer.innerHTML = '';

        if (totalPages <= 1) return;

        // Botón Anterior
        if (currentPage > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.innerHTML = '&laquo; Anterior';
            prevBtn.addEventListener('click', () => {
                currentPage--;
                renderCases();
                renderPagination();
            });
            paginationContainer.appendChild(prevBtn);
        }

        // Botones de página - TODAS LAS PÁGINAS
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.className = i === currentPage ? 'active' : '';
            pageBtn.addEventListener('click', () => {
                currentPage = i;
                renderCases();
                renderPagination();
            });
            paginationContainer.appendChild(pageBtn);
        }

        // Botón Siguiente
        if (currentPage < totalPages) {
            const nextBtn = document.createElement('button');
            nextBtn.innerHTML = 'Siguiente &raquo;';
            nextBtn.addEventListener('click', () => {
                currentPage++;
                renderCases();
                renderPagination();
            });
            paginationContainer.appendChild(nextBtn);
        }
    }

    // PERSISTENCIA DE FILTROS
    function saveFilters() {
        const filters = {
            client: searchClientInput.value,
            ruc: searchRUCInput.value,
            number: document.getElementById('searchNumberInput')?.value || '',
            agent: document.getElementById('searchAgentInput')?.value || '',
            type: document.getElementById('filterType')?.value || '',
            status: document.getElementById('filterStatus')?.value || '',
            stage: document.getElementById('filterStage')?.value || '',
            dateFrom: document.getElementById('filterDateFrom')?.value || '',
            dateTo: document.getElementById('filterDateTo')?.value || ''
        };
        localStorage.setItem('caseFilters', JSON.stringify(filters));
    }

    function loadSavedFilters() {
        const saved = JSON.parse(localStorage.getItem('caseFilters') || '{}');
        if (saved.client) searchClientInput.value = saved.client;
        if (saved.ruc) searchRUCInput.value = saved.ruc;
        if (saved.number) document.getElementById('searchNumberInput').value = saved.number;
        if (saved.agent) document.getElementById('searchAgentInput').value = saved.agent;
        if (saved.type) document.getElementById('filterType').value = saved.type;
        if (saved.status) document.getElementById('filterStatus').value = saved.status;
        if (saved.stage) document.getElementById('filterStage').value = saved.stage;
        if (saved.dateFrom) document.getElementById('filterDateFrom').value = saved.dateFrom;
        if (saved.dateTo) document.getElementById('filterDateTo').value = saved.dateTo;
    }

    function clearAllFilters() {
        searchClientInput.value = '';
        searchRUCInput.value = '';
        if (document.getElementById('searchNumberInput')) document.getElementById('searchNumberInput').value = '';
        if (document.getElementById('searchAgentInput')) document.getElementById('searchAgentInput').value = '';
        if (document.getElementById('filterType')) document.getElementById('filterType').value = '';
        if (document.getElementById('filterStatus')) document.getElementById('filterStatus').value = '';
        if (document.getElementById('filterStage')) document.getElementById('filterStage').value = '';
        if (document.getElementById('filterDateFrom')) document.getElementById('filterDateFrom').value = '';
        if (document.getElementById('filterDateTo')) document.getElementById('filterDateTo').value = '';
        
        localStorage.removeItem('caseFilters');
        performFiltering();
    }

    // Función para agregar eventos a los botones
    function addEventListeners() {
        // Vista Previa
        document.querySelectorAll('.preview-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const caseId = this.closest('.client-item').dataset.caseId;
                openPreviewModal(caseId);
            });
        });

        // Editar
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const caseId = this.closest('.client-item').dataset.caseId;
                window.location.href = `modificar-caso.php?id=${caseId}`;
            });
        });

        // Quejas (solo para etapa 1)
        document.querySelectorAll('.complaint-btn').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                const caseId = this.closest('.client-item').dataset.caseId;
                if (typeof window.openComplaintModal === 'function') {
                    window.openComplaintModal(caseId);
                } else {
                    console.error('Error: openComplaintModal no está definido');
                    document.getElementById('myModalComplaint').style.display = 'block';
                }
            });
        });

        // Eliminar (borrado lógico)
        document.querySelectorAll('.delete-btn').forEach(btn => {
            if (!btn.textContent.includes('Eliminado')) {
                btn.addEventListener('click', async function () {
                    const caseId = this.closest('.client-item').dataset.caseId;
                    if (confirm('¿Estás seguro de marcar este caso como eliminado?')) {
                        await updateCaseStatus(caseId, 5); // 5 = Estado "Eliminado"
                    }
                });
            }
        });
    }

    // TU FUNCIÓN ORIGINAL - SIN MODIFICACIONES
    function openPreviewModal(caseId) {
        const caso = allCases.find(c => c.id_fiscalizacion == caseId);

        if (!caso) {
            showError('Caso no encontrado');
            return;
        }

        // Generar HTML para agentes SUNAT
        let agentesHTML = '';
        if (caso.agentes_sunat && caso.agentes_sunat.length > 0) {
            agentesHTML = `
            <div class="preview-section">
                <h3>👥 Agentes SUNAT Asignados</h3>
                <div class="agentes-list">
                    ${caso.agentes_sunat.map(agente => `
                        <div class="agente-item">
                            <strong>${agente.cargo}:</strong> ${agente.nombre_completo}
                            ${agente.area ? `<br><small>Área: ${agente.area}</small>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        } else {
            agentesHTML = `
            <div class="preview-section">
                <h3>👥 Agentes SUNAT</h3>
                <p style="color: #7f8c8d; font-style: italic;">No hay agentes asignados</p>
            </div>
        `;
        }

        // Determinar texto para el caso padre
        let casoPadreTexto = 'No tiene';
        if (caso.numero_padre) {
            casoPadreTexto = `${caso.numero_padre}`;
        } else if (caso.id_fiscalizacion_padre) {
            casoPadreTexto = `ID: ${caso.id_fiscalizacion_padre} (Número no disponible)`;
        }

        // Crear modal de vista previa actualizado
        const modalHTML = `
        <div id="previewModal" class="modal" style="display: flex;">
            <div class="modal-content" style="max-width: 750px;">
                <span class="close" onclick="closePreviewModal()">&times;</span>
                <h2>Vista Previa del Caso - ${caso.numero || 'N/A'}</h2>
                <div class="preview-details">
                    <!-- Información Básica -->
                    <div class="preview-section">
                        <h3>📋 Información Básica</h3>
                        <p><strong>Número:</strong> ${caso.numero || 'N/A'}</p>
                        <p><strong>Tipo:</strong> ${tipoMap[caso.id_tipo] || 'N/A'}</p>
                        <p><strong>Razón Social:</strong> ${caso.razon_social || 'N/A'}</p>
                        <p><strong>RUC:</strong> ${caso.RUC || 'N/A'}</p>
                        <p><strong>Caso Padre:</strong> ${casoPadreTexto}</p>
                    </div>

                    <!-- Fechas -->
                    <div class="preview-section">
                        <h3>📅 Fechas</h3>
                        <p><strong>Fecha Notificación:</strong> ${formatDate(caso.fecha_notificacion) || 'N/A'}</p>
                        <p><strong>Fecha Presentación:</strong> ${formatDate(caso.fecha_presentacion) || 'N/A'}</p>
                        <p><strong>Nueva Fecha:</strong> ${formatDate(caso.fecha_prorroga) || 'N/A'}</p>
                    </div>

                    <!-- Estado y Proceso -->
                    <div class="preview-section">
                        <h3>📊 Estado y Proceso</h3>
                        <p><strong>Estado:</strong> ${estadoMap[caso.id_estado] || 'N/A'}</p>
                        <p><strong>Etapa:</strong> ${etapaMap[caso.id_etapa] || 'N/A'}</p>
                        <p><strong>Periodo:</strong> ${formatPeriod(caso.periodo_inicio, caso.periodo_final)}</p>
                        <p><strong>IGV:</strong> ${formatIGV(caso.IGV)}</p>
                    </div>

                    <!-- Agentes SUNAT -->
                    ${agentesHTML}

                    <!-- Información Adicional -->
                    <div class="preview-section">
                        <h3>🔗 Información Adicional</h3>
                        <p><strong>Cliente Cruce:</strong> ${caso.cliente_cruce || 'No aplica'}</p>
                    </div>
                </div>
                <div class="modal-actions">
                    <button onclick="closePreviewModal()" class="btn-secondary">Cerrar</button>
                    <button onclick="window.location.href='modificar-caso.php?id=${caseId}'" class="btn-primary">
                        <i class="bi bi-pencil"></i> Editar Caso
                    </button>
                </div>
            </div>
        </div>
    `;

        // Agregar modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Cerrar modal al hacer clic fuera
        document.getElementById('previewModal').addEventListener('click', function (e) {
            if (e.target === this) {
                closePreviewModal();
            }
        });
    }

    // Función para actualizar estado (borrado lógico)
    async function updateCaseStatus(caseId, status) {
        try {
            showLoading(true);
            const response = await fetch('../app/casos/update_case_status.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id_fiscalizacion: caseId,
                    id_estado: status
                })
            });

            const result = await response.json();

            if (result.success) {
                loadCases(); // Recargar lista
                showSuccess('Estado del caso actualizado correctamente');
            } else {
                throw new Error(result.message || 'Error al actualizar estado');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Error: ' + error.message);
        } finally {
            showLoading(false);
        }
    }

    // Mostrar/ocultar loading
    function showLoading(show) {
        const loader = document.getElementById('loading-overlay');
        if (loader) {
            loader.style.display = show ? 'flex' : 'none';
        }
    }

    // Mostrar mensaje de éxito
    function showSuccess(message) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-success';
        alert.textContent = message;
        document.querySelector('.content-complaint').prepend(alert);
        setTimeout(() => alert.remove(), 3000);
    }

    // Mostrar mensaje de error
    function showError(message) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-error';
        alert.textContent = message;
        document.querySelector('.content-complaint').prepend(alert);
        setTimeout(() => alert.remove(), 5000);
    }

    // EVENT LISTENERS MEJORADOS
    searchClientInput.addEventListener('input', filterCases);
    searchRUCInput.addEventListener('input', filterCases);

    // Event listeners para nuevos filtros
    const searchNumberInput = document.getElementById('searchNumberInput');
    const searchAgentInput = document.getElementById('searchAgentInput');
    const filterType = document.getElementById('filterType');
    const filterStatus = document.getElementById('filterStatus');
    const filterStage = document.getElementById('filterStage');
    const filterDateFrom = document.getElementById('filterDateFrom');
    const filterDateTo = document.getElementById('filterDateTo');

    if (searchNumberInput) searchNumberInput.addEventListener('input', filterCases);
    if (searchAgentInput) searchAgentInput.addEventListener('input', filterCases);
    if (filterType) filterType.addEventListener('change', filterCases);
    if (filterStatus) filterStatus.addEventListener('change', filterCases);
    if (filterStage) filterStage.addEventListener('change', filterCases);
    if (filterDateFrom) filterDateFrom.addEventListener('change', filterCases);
    if (filterDateTo) filterDateTo.addEventListener('change', filterCases);

    // Event listeners para filtros rápidos
    document.querySelectorAll('.quick-filter[data-clear]').forEach(btn => {
        btn.addEventListener('click', clearAllFilters);
    });

    document.querySelectorAll('.quick-filter[data-agent]').forEach(btn => {
        btn.addEventListener('click', function() {
            if (searchAgentInput) {
                searchAgentInput.value = this.dataset.agent;
                performFiltering();
            }
        });
    });

    // Cargar los casos al iniciar
    loadCases();
});

// FUNCIÓN GLOBAL PARA CERRAR EL MODAL
function closePreviewModal() {
    const modal = document.getElementById('previewModal');
    if (modal) {
        modal.remove();
    }
}
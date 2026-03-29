document.addEventListener('DOMContentLoaded', function () {
    // Elementos del DOM
    const searchClientInput = document.getElementById('searchClientInput');
    const searchRUCInput = document.getElementById('searchRUCInput');
    const employeeContainer = document.querySelector('.employee-container');
    const paginationContainer = document.getElementById('pagination');

    // Variables de estado
    let currentPage = 1;
    const itemsPerPage = 8;
    let allCases = [];
    let filteredCases = [];
    let filterTimeout;

    // Mapeos para tipos, estados y etapas
    const tipoMap = {
        1: "Esquela",
        2: "Fiscalización Parcial-IGV",
        3: "Fiscalización Total-IGV",
        4: "Fiscalización Parcial-RENTA",
        5: "Fiscalización Total-RENTA",
        6: "Cruce de Información"
    };
    const estadoMap = {
        1: "Notificado",
        2: "Presentado",
        3: "Prórroga",
        4: "Anulado",
        5: "Eliminado",
        6: "No presentado"
    };

    const etapaMap = {
        1: "1er Requerimiento",
        2: "2do Requerimiento",
        3: "3ro Requerimiento",
        4: "4to Requerimiento",
        5: "Cierre/Valores",
        6: "R.Reclamación",
        7: "R. Apelación",
        8: "Proceso Contencioso",
        10: "Finalizado",
        11: "5to Requerimiento",
        12: "6to Requerimiento",
        13: "7mo Requerimiento",
        14: "Coactiva x R",
        15: "Coactiva x TF",
        16: "Coactiva sin R"
    };

    // ⚠️ CONFIGURACIÓN DRIVE - Actualiza con tus valores reales
    const DRIVE_CONFIG = {
        apiUrl: 'https://beula-aortal-undiscernably.ngrok-free.dev/api/v1/search-folder',
        apiToken: 'aB3xK9mP2qR7sT4vW8yZ1nL5jH6gF0dC'
    };

    // Inyectar estilos CSS para Drive
    injectDriveStyles();

    // Función para cargar los casos
    async function loadCases() {
        try {
            showLoading(true);
            const response = await fetch('../app/casos/get_cases.php');
            const data = await response.json();

            if (data.success) {
                allCases = data.data;
                filteredCases = allCases.filter(caso => caso.id_estado != 5); // Excluir eliminados
                localStorage.removeItem('caseFilters'); // Limpiar filtros al entrar a la página
                updatePeriodSelects(); // Poblar los selects de periodo con todos los valores
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
            const awardIcon = caso.id_etapa == 1 ? '<i class="bi bi-award-fill" style="color: #f39c12;"></i>' : '';

            // Badge para casos con archivos en Drive
            const driveBadge = caso.hasDriveFiles ? '<span class="drive-badge" title="Tiene archivos en Drive"><i class="bi bi-cloud-check"></i></span>' : '';

            caseElement.innerHTML = `
                <div class="client-info">
                    <div class="client-details">
                        <h3>${caso.razon_social || 'Sin nombre'} ${awardIcon} ${driveBadge}</h3>
                        <p><strong>RUC:</strong> ${caso.RUC || 'Sin RUC'}</p>
                        <p><strong>N° Doc:</strong> ${caso.numero}</p>
                        <p><strong>Tipo:</strong> ${tipoMap[caso.id_tipo] || 'Desconocido'}</p>
                        <p><strong>Etapa:</strong> ${etapaMap[caso.id_etapa] || 'Desconocida'}</p>
                        <p><strong>Estado:</strong> ${estadoMap[caso.id_estado] || 'Desconocido'}</p>
                        <p><strong>Periodo:</strong> ${formatPeriod(caso.periodo_inicio, caso.periodo_final)}</p>  
                        <p><strong>Fecha Notif.:</strong> ${formatDate(caso.fecha_notificacion) || 'Sin fecha'}</p>
                        
                        <!-- Mostrar agentes asignados -->
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

        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('es-PE', {
            timeZone: 'UTC',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
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
        const periodoFilter = document.getElementById('filterPeriodo')?.value || '';

        filteredCases = allCases.filter(caso => {
            const matchesClient = !clientSearch || caso.razon_social?.toLowerCase().includes(clientSearch);
            const matchesRUC = !rucSearch || caso.RUC?.includes(rucSearch);
            const matchesNumber = !numberSearch || caso.numero?.toLowerCase().includes(numberSearch);
            const matchesAgent = !agentSearch || searchInAgents(caso.agentes_sunat, agentSearch);
            const matchesType = !typeFilter || caso.id_tipo == typeFilter;
            const matchesStatus = !statusFilter || caso.id_estado == statusFilter;
            const matchesStage = !stageFilter || caso.id_etapa == stageFilter;
            const matchesDate = filterByDate(caso.fecha_notificacion, dateFrom, dateTo);
            const matchesPeriodo = !periodoFilter ||
                (caso.periodo_inicio + '|' + caso.periodo_final) === periodoFilter;

            return matchesClient && matchesRUC && matchesNumber && matchesAgent &&
                matchesType && matchesStatus && matchesStage && matchesDate &&
                matchesPeriodo;
        });

        currentPage = 1;
        renderCases();
        renderPagination();
        updateResultsCounter();
        updatePeriodSelects(); // Actualizar opciones de periodos según el filtro actual
        saveFilters();
    }

    // FUNCIÓN PARA ACTUALIZAR EL SELECT DE PERIODO DINÁMICAMENTE
    function updatePeriodSelects() {
        const periodoSelect = document.getElementById('filterPeriodo');
        if (!periodoSelect) return;

        const selectedValue = periodoSelect.value;

        // Calcular contexto sin el filtro de periodo
        const clientSearch = searchClientInput.value.toLowerCase();
        const rucSearch = searchRUCInput.value.toLowerCase();
        const numberSearch = document.getElementById('searchNumberInput')?.value.toLowerCase() || '';
        const agentSearch = document.getElementById('searchAgentInput')?.value.toLowerCase() || '';
        const typeFilter = document.getElementById('filterType')?.value || '';
        const statusFilter = document.getElementById('filterStatus')?.value || '';
        const stageFilter = document.getElementById('filterStage')?.value || '';
        const dateFrom = document.getElementById('filterDateFrom')?.value;
        const dateTo = document.getElementById('filterDateTo')?.value;

        const contextCases = allCases.filter(caso => {
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

        // Recolectar rangos únicos inicio|fin
        const rangosSet = new Set();
        contextCases.forEach(caso => {
            if (caso.periodo_inicio && caso.periodo_final) {
                rangosSet.add(caso.periodo_inicio + '|' + caso.periodo_final);
            }
        });

        // Ordenar por periodo_inicio (MMYYYY → YYYYMM para comparar)
        const sortPeriodo = (a, b) => {
            const toNum = p => parseInt(p.slice(2) + p.slice(0, 2));
            return toNum(a.split('|')[0]) - toNum(b.split('|')[0]);
        };

        const rangos = [...rangosSet].sort(sortPeriodo);

        // Formatear MMYYYY → MM/YYYY
        const fmt = p => (p && p.length === 6) ? `${p.slice(0, 2)}/${p.slice(2)}` : p;

        // Repoblar select
        periodoSelect.innerHTML = '<option value="">Todos los periodos</option>';
        rangos.forEach(rango => {
            const [inicio, fin] = rango.split('|');
            const opt = document.createElement('option');
            opt.value = rango;
            opt.textContent = inicio === fin
                ? fmt(inicio)
                : `${fmt(inicio)} — ${fmt(fin)}`;
            if (rango === selectedValue) opt.selected = true;
            periodoSelect.appendChild(opt);
        });
    }


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

        const addBtn = (label, page, active = false, disabled = false) => {
            const btn = document.createElement('button');
            btn.innerHTML = label;
            if (active)   btn.classList.add('active');
            if (disabled) btn.disabled = true;
            btn.addEventListener('click', () => {
                if (disabled) return;
                currentPage = page;
                renderCases();
                renderPagination();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            paginationContainer.appendChild(btn);
        };

        const addEllipsis = () => {
            const span = document.createElement('span');
            span.textContent = '…';
            span.style.cssText = 'padding:6px 4px;color:#999;align-self:center;';
            paginationContainer.appendChild(span);
        };

        // Anterior
        addBtn('&laquo;', currentPage - 1, false, currentPage === 1);

        // Siempre primera página
        addBtn(1, 1, currentPage === 1);

        // Elipsis izquierda
        if (currentPage > 4) addEllipsis();

        // Páginas del medio
        const start = Math.max(2, currentPage - 2);
        const end   = Math.min(totalPages - 1, currentPage + 2);
        for (let i = start; i <= end; i++) {
            addBtn(i, i, i === currentPage);
        }

        // Elipsis derecha
        if (currentPage < totalPages - 3) addEllipsis();

        // Siempre última página
        if (totalPages > 1) addBtn(totalPages, totalPages, currentPage === totalPages);

        // Siguiente
        addBtn('&raquo;', currentPage + 1, false, currentPage === totalPages);
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
            dateTo: document.getElementById('filterDateTo')?.value || '',
            periodo: document.getElementById('filterPeriodo')?.value || ''
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
        if (saved.periodo) document.getElementById('filterPeriodo').value = saved.periodo;
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
        if (document.getElementById('filterPeriodo')) document.getElementById('filterPeriodo').value = '';

        localStorage.removeItem('caseFilters');
        performFiltering();
    }

    // FUNCIÓN PARA OBTENER INFORMACIÓN DE DRIVE DE UN CASO
    async function getDriveInfo(caseId) {
        try {
            const response = await fetch(`../app/casos/get_case_drive_info.php?id_fiscalizacion=${caseId}`);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Error al obtener información de Drive');
            }

            return data;

        } catch (error) {
            console.error('Error obteniendo info de Drive:', error);
            return null;
        }
    }

    // FUNCIÓN PARA BUSCAR ARCHIVOS EN DRIVE
    async function searchDriveFiles(driveData) {
        try {
            const response = await fetch(DRIVE_CONFIG.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api_token': DRIVE_CONFIG.apiToken
                },
                body: JSON.stringify(driveData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }

            const result = await response.json();
            return result;

        } catch (error) {
            console.error('Error buscando en Drive:', error);
            return null;
        }
    }

    // FUNCIÓN MODIFICADA: openPreviewModal con Drive
    async function openPreviewModal(caseId) {
        const caso = allCases.find(c => c.id_fiscalizacion == caseId);

        if (!caso) {
            showError('Caso no encontrado');
            return;
        }

        // 1. Obtener información para Drive
        const driveInfo = await getDriveInfo(caseId);
        
        // 2. Buscar archivos en Drive (si tenemos la información)
        let driveFiles = null;
        let driveFolderInfo = null;
        
        if (driveInfo && driveInfo.success && driveInfo.drive_data) {
            driveFiles = await searchDriveFiles(driveInfo.drive_data);
            
            if (driveFiles && driveFiles.found) {
                driveFolderInfo = {
                    folder_link: driveFiles.folder_link,
                    files: driveFiles.files || [],
                    file_count: driveFiles.file_count || 0
                };
            }
        }

        // Generar HTML para archivos de Drive
        let driveSectionHTML = '';
        if (driveFolderInfo) {
            driveSectionHTML = generateDriveFilesHTML(driveFolderInfo, driveInfo.drive_data);
        } else {
            driveSectionHTML = `
                <div class="preview-section drive-section no-drive">
                    <div class="drive-header">
                        <h3>📁 Archivos en Google Drive</h3>
                    </div>
                    <div class="drive-content">
                        <p style="color: #e74c3c; font-style: italic;">
                            <i class="bi bi-exclamation-triangle"></i> No se encontró carpeta en Drive
                        </p>
                        <div class="drive-path">
                            <small>Ruta esperada: Documentos/${driveInfo?.drive_data?.ruc || 'N/A'}/${driveInfo?.drive_data?.numero_requerimiento || 'N/A'}/${driveInfo?.drive_data?.etapa || 'N/A'}</small>
                        </div>
                    </div>
                </div>
            `;
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
                <div class="modal-content" style="max-width: 900px;">
                    <span class="close" onclick="closePreviewModal()">&times;</span>
                    <h2>Vista Previa del Caso - ${caso.numero || 'N/A'}</h2>
                    <div class="preview-details">
                        <!-- Información Básica -->
                        <div class="preview-section">
                            <h3>📋 Información Básica</h3>
                            <div class="info-grid">
                                <div class="info-item">
                                    <span class="info-label">Número:</span>
                                    <span class="info-value">${caso.numero || 'N/A'}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Tipo:</span>
                                    <span class="info-value">${tipoMap[caso.id_tipo] || 'N/A'}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Razón Social:</span>
                                    <span class="info-value">${caso.razon_social || 'N/A'}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">RUC:</span>
                                    <span class="info-value">${caso.RUC || 'N/A'}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Caso Padre:</span>
                                    <span class="info-value">${casoPadreTexto}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Fechas -->
                        <div class="preview-section">
                            <h3>📅 Fechas</h3>
                            <div class="info-grid">
                                <div class="info-item">
                                    <span class="info-label">Notificación:</span>
                                    <span class="info-value">${formatDate(caso.fecha_notificacion) || 'N/A'}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">A presentar:</span>
                                    <span class="info-value">${formatDate(caso.fecha_presentacion) || 'N/A'}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Nueva Fecha:</span>
                                    <span class="info-value">${formatDate(caso.fecha_prorroga) || 'N/A'}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Presentado:</span>
                                    <span class="info-value">${formatDate(caso.fecha_presentado) || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Estado y Proceso -->
                        <div class="preview-section">
                            <h3>📊 Estado y Proceso</h3>
                            <div class="info-grid">
                                
                                <div class="info-item">
                                    <span class="info-label">Etapa:</span>
                                    <span class="info-value">${etapaMap[caso.id_etapa] || 'N/A'}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Estado:</span>
                                    <span class="info-value">${estadoMap[caso.id_estado] || 'N/A'}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Periodo:</span>
                                    <span class="info-value">${formatPeriod(caso.periodo_inicio, caso.periodo_final)}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">IGV:</span>
                                    <span class="info-value">${formatIGV(caso.IGV)}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Archivos en Google Drive -->
                        ${driveSectionHTML}

                        <!-- Agentes SUNAT -->
                        ${agentesHTML}

                        <!-- Información Adicional -->
                        <div class="preview-section">
                            <h3>🔗 Información Adicional</h3>
                            <p><strong>Cliente Cruce:</strong> ${caso.cliente_cruce || 'No aplica'}</p>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button onclick="closePreviewModal()" class="btn-secondary">
                            <i class="bi bi-x-circle"></i> Cerrar
                        </button>
                        <button onclick="window.location.href='modificar-caso.php?id=${caseId}'" class="btn-primary">
                            <i class="bi bi-pencil"></i> Editar Caso
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Agregar modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Agregar event listeners para botones de Drive
        if (driveFolderInfo) {
            addDriveEventListeners(driveFolderInfo);
        }

        // Cerrar modal al hacer clic fuera
        document.getElementById('previewModal').addEventListener('click', function (e) {
            if (e.target === this) {
                closePreviewModal();
            }
        });
    }

    // FUNCIÓN PARA GENERAR HTML DE ARCHIVOS DE DRIVE
    function generateDriveFilesHTML(driveInfo, driveData) {
        const { files, file_count, folder_link } = driveInfo;
        const { ruc, etapa, numero_requerimiento } = driveData;

        let filesHTML = '';
        
        if (file_count > 0) {
            filesHTML = `
                <div class="drive-files-list">
                    <p><strong>${file_count} archivo(s) encontrado(s):</strong></p>
                    <div class="files-container">
                        ${files.map((file, index) => `
                            <div class="file-item" data-file-id="${file.id}" data-file-link="${file.webViewLink}">
                                <div class="file-icon">
                                    <i class="bi ${getFileIcon(file.mimeType)}"></i>
                                </div>
                                <div class="file-details">
                                    <div class="file-name">${file.name}</div>
                                    <div class="file-meta">
                                        <span class="file-size">${formatFileSize(file.size)}</span>
                                        <span class="file-date">${formatDriveDate(file.createdTime)}</span>
                                    </div>
                                </div>
                                <div class="file-actions">
                                    <button class="btn-open-file" title="Abrir archivo en Google Drive">
                                        <i class="bi bi-box-arrow-up-right"></i>
                                    </button>
                                    <button class="btn-copy-link" title="Copiar enlace al portapapeles">
                                        <i class="bi bi-link-45deg"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } else {
            filesHTML = `
                <div class="no-files">
                    <i class="bi bi-folder2-open" style="font-size: 2em; color: #95a5a6;"></i>
                    <p style="color: #95a5a6; font-style: italic; margin-top: 10px;">
                        No hay archivos en esta carpeta
                    </p>
                </div>
            `;
        }

        return `
            <div class="preview-section drive-section">
                <div class="drive-header">
                    <h3><i class="bi bi-google"></i> Archivos en Google Drive</h3>
                    <button class="btn-open-folder" data-folder-link="${folder_link}">
                        <i class="bi bi-folder2-open"></i> Abrir Carpeta
                    </button>
                </div>
                <div class="drive-path">
                    <small><i class="bi bi-folder"></i> Ruta: <code>Documentos/${ruc}/${numero_requerimiento}/${etapa}</code></small>
                </div>
                <div class="drive-content">
                    ${filesHTML}
                </div>
            </div>
        `;
    }

    // FUNCIÓN PARA AGREGAR EVENT LISTENERS A LOS BOTONES DE DRIVE
    function addDriveEventListeners(driveInfo) {
        // Botón "Abrir Carpeta"
        const openFolderBtn = document.querySelector('.btn-open-folder');
        if (openFolderBtn) {
            openFolderBtn.addEventListener('click', function() {
                const folderLink = this.getAttribute('data-folder-link');
                if (folderLink) {
                    window.open(folderLink, '_blank');
                }
            });
        }

        // Botones "Abrir Archivo"
        document.querySelectorAll('.btn-open-file').forEach(btn => {
            btn.addEventListener('click', function() {
                const fileItem = this.closest('.file-item');
                const fileLink = fileItem.getAttribute('data-file-link');
                if (fileLink) {
                    window.open(fileLink, '_blank');
                }
            });
        });

        // Botones "Copiar Enlace"
        document.querySelectorAll('.btn-copy-link').forEach(btn => {
            btn.addEventListener('click', async function() {
                const fileItem = this.closest('.file-item');
                const fileLink = fileItem.getAttribute('data-file-link');
                
                if (fileLink) {
                    try {
                        await navigator.clipboard.writeText(fileLink);
                        showToast('Enlace copiado al portapapeles', 'success');
                    } catch (err) {
                        console.error('Error al copiar:', err);
                        // Fallback para navegadores antiguos
                        const textArea = document.createElement('textarea');
                        textArea.value = fileLink;
                        document.body.appendChild(textArea);
                        textArea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textArea);
                        showToast('Enlace copiado al portapapeles', 'success');
                    }
                }
            });
        });
    }

    // FUNCIONES AUXILIARES PARA DRIVE
    function getFileIcon(mimeType) {
        const icons = {
            'application/pdf': 'bi-file-earmark-pdf',
            'application/msword': 'bi-file-earmark-word',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'bi-file-earmark-word',
            'application/vnd.ms-excel': 'bi-file-earmark-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'bi-file-earmark-excel',
            'image/jpeg': 'bi-file-earmark-image',
            'image/png': 'bi-file-earmark-image',
            'image/gif': 'bi-file-earmark-image',
            'text/plain': 'bi-file-earmark-text',
            'application/zip': 'bi-file-earmark-zip',
            'application/vnd.google-apps.folder': 'bi-folder'
        };
        
        return icons[mimeType] || 'bi-file-earmark';
    }

    function formatFileSize(bytes) {
        if (bytes === 0 || !bytes) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function formatDriveDate(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('es-PE', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    function showToast(message, type = 'success') {
        // Crear toast si no existe
        let toast = document.getElementById('global-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'global-toast';
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        
        // Actualizar contenido y clase
        toast.textContent = message;
        toast.className = `toast toast-${type}`;
        
        // Mostrar toast
        toast.classList.add('show');
        
        // Ocultar después de 3 segundos
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Función para agregar eventos a los botones
    function addEventListeners() {
        // Vista Previa
        document.querySelectorAll('.preview-btn').forEach(btn => {
            btn.addEventListener('click', function () {
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
        let loader = document.getElementById('loading-overlay');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'loading-overlay';
            loader.innerHTML = '<div class="loader"><i class="bi bi-arrow-repeat"></i> Cargando...</div>';
            document.body.appendChild(loader);
        }
        loader.style.display = show ? 'flex' : 'none';
    }

    // Mostrar mensaje de éxito
    function showSuccess(message) {
        showToast(message, 'success');
    }

    // Mostrar mensaje de error
    function showError(message) {
        showToast(message, 'error');
    }

    // INYECTAR ESTILOS CSS PARA DRIVE
    function injectDriveStyles() {
        const styles = `
            <style>
                /* Drive Badge en lista */
                .drive-badge {
                    display: inline-block;
                    background: #e3f2fd;
                    color: #1976d2;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 0.8em;
                    margin-left: 8px;
                    vertical-align: middle;
                }
                
                /* Modal Drive Section */
                .drive-section {
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 15px;
                    border-left: 4px solid #4285f4;
                    margin-bottom: 20px;
                }
                
                .drive-section.no-drive {
                    border-left-color: #e74c3c;
                    background: #fdeded;
                }
                
                .drive-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }
                
                .drive-header h3 {
                    margin: 0;
                    color: #4285f4;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .btn-open-folder {
                    background: #4285f4;
                    color: white;
                    border: none;
                    padding: 8px 15px;
                    border-radius: 4px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 0.9em;
                    transition: background 0.3s;
                }
                
                .btn-open-folder:hover {
                    background: #3367d6;
                }
                
                .drive-path {
                    background: #e8f0fe;
                    padding: 8px 10px;
                    border-radius: 4px;
                    margin-bottom: 15px;
                    font-size: 0.85em;
                    color: #5f6368;
                }
                
                .drive-path code {
                    background: white;
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-family: monospace;
                }
                
                .drive-content {
                    margin-top: 15px;
                }
                
                .no-files {
                    text-align: center;
                    padding: 20px;
                    color: #95a5a6;
                }
                
                .drive-files-list {
                    margin-top: 15px;
                }
                
                .drive-files-list > p {
                    margin-bottom: 10px;
                    color: #333;
                    font-weight: 500;
                }
                
                .files-container {
                    max-height: 300px;
                    overflow-y: auto;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    background: white;
                }
                
                .file-item {
                    display: flex;
                    align-items: center;
                    padding: 12px 15px;
                    border-bottom: 1px solid #eee;
                    transition: background 0.2s;
                }
                
                .file-item:hover {
                    background: #f8f9fa;
                }
                
                .file-item:last-child {
                    border-bottom: none;
                }
                
                .file-icon {
                    font-size: 1.5em;
                    color: #4285f4;
                    margin-right: 15px;
                    width: 40px;
                    text-align: center;
                }
                
                .file-details {
                    flex: 1;
                    min-width: 0; /* Para truncar texto */
                }
                
                .file-name {
                    font-weight: 500;
                    margin-bottom: 4px;
                    word-break: break-word;
                    color: #333;
                }
                
                .file-meta {
                    display: flex;
                    gap: 15px;
                    font-size: 0.8em;
                    color: #5f6368;
                }
                
                .file-actions {
                    display: flex;
                    gap: 8px;
                }
                
                .btn-open-file,
                .btn-copy-link {
                    background: transparent;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    padding: 6px 10px;
                    cursor: pointer;
                    color: #5f6368;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .btn-open-file:hover {
                    background: #4285f4;
                    color: white;
                    border-color: #4285f4;
                }
                
                .btn-copy-link:hover {
                    background: #34a853;
                    color: white;
                    border-color: #34a853;
                }
                
                /* Info Grid mejorado */
                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    gap: 12px;
                }
                
                .info-item {
                    background: #f8f9fa;
                    padding: 10px;
                    border-radius: 6px;
                    display: flex;
                    flex-direction: column;
                }
                
                .info-label {
                    font-size: 0.85em;
                    color: #666;
                    margin-bottom: 4px;
                }
                
                .info-value {
                    font-weight: 500;
                    color: #333;
                }
                
                /* Toast notifications */
                .toast {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    padding: 12px 24px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    opacity: 0;
                    transform: translateY(20px);
                    transition: all 0.3s ease;
                    z-index: 9999;
                    max-width: 300px;
                    font-size: 0.9em;
                    display: none;
                }
                
                .toast.show {
                    opacity: 1;
                    transform: translateY(0);
                    display: block;
                }
                
                .toast-success {
                    background: #2ecc71;
                    color: white;
                    border-left: 4px solid #27ae60;
                }
                
                .toast-error {
                    background: #e74c3c;
                    color: white;
                    border-left: 4px solid #c0392b;
                }
                
                /* Loading overlay */
                #loading-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(255, 255, 255, 0.9);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9998;
                    display: none;
                }
                
                .loader {
                    text-align: center;
                    padding: 20px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                
                .loader i {
                    font-size: 2em;
                    color: #4285f4;
                    animation: spin 1s linear infinite;
                    margin-bottom: 10px;
                    display: block;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                /* Scrollbar personalizado */
                .files-container::-webkit-scrollbar {
                    width: 6px;
                }
                
                .files-container::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 3px;
                }
                
                .files-container::-webkit-scrollbar-thumb {
                    background: #ccc;
                    border-radius: 3px;
                }
                
                .files-container::-webkit-scrollbar-thumb:hover {
                    background: #999;
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
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

    const filterPeriodo = document.getElementById('filterPeriodo');
    if (filterPeriodo) filterPeriodo.addEventListener('change', filterCases);

    // Botón para limpiar filtros
    const clearFiltersBtn = document.getElementById('clearFilters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearAllFilters);
    }

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
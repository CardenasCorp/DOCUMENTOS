document.addEventListener('DOMContentLoaded', function () {
    // Cargar todas las tablas al iniciar
    loadTable('vencer', 'vencer-table', 1);
    loadTable('reclamar', 'reclamar-table', 1);
    loadTable('apelar', 'apelar-table', 1);
    loadResumenTable(1);

    // Evento para el buscador del resumen (con debounce mejorado)
    const searchInput = document.querySelector('.buscar-resumen');
    let searchTimeout;

    searchInput.addEventListener('input', function (e) {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            loadResumenTable(1, e.target.value.trim());
        }, 300);
    });
});

// Constantes para configuración
const TABLE_CONFIG = {
    'vencer': { columns: 9, noDataMessage: 'No hay registros próximos a vencer' },
    'reclamar': { columns: 5, noDataMessage: 'No hay registros por reclamar' },
    'apelar': { columns: 5, noDataMessage: 'No hay registros por apelar' }
};

// ==============================================
// Funciones Auxiliares
// ==============================================

function applyDateBasedStyling(row, diasRestantes) {
    if (diasRestantes === 0) {
        row.classList.add('due-today');
    } else if (diasRestantes !== null && diasRestantes <= 3) {
        row.classList.add('due-soon');
    } else if (diasRestantes !== null && diasRestantes < 0) {
        row.classList.add('overdue');
    }
}

function formatCurrency(value) {
    if (!value && value !== 0) return 'S/ 0.00';

    const num = parseFloat(value);
    return isNaN(num) ? 'S/ 0.00' : `S/ ${num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

function escapeHtml(text) {
    if (text === null || text === undefined) return '-';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// FUNCIÓN CORREGIDA: Formatear fechas de manera confiable
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    // Si ya es una fecha formateada, devolverla directamente
    if (typeof dateString === 'string' && dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        return dateString;
    }
    
    // Si es "0000-00-00" o fecha inválida, retornar N/A
    if (dateString === '0000-00-00' || dateString === '0000-00-00 00:00:00') {
        return 'N/A';
    }
    
    try {
        let date;
        
        // Intentar diferentes formatos de fecha
        if (dateString.includes('/')) {
            // Formato dd/mm/yyyy
            const parts = dateString.split('/');
            if (parts.length === 3) {
                date = new Date(parts[2], parts[1] - 1, parts[0]);
            }
        } else if (dateString.includes('-')) {
            // Formato yyyy-mm-dd
            const parts = dateString.split('-');
            if (parts.length === 3) {
                date = new Date(parts[0], parts[1] - 1, parts[2]);
            }
        } else {
            // Intentar parsear directamente
            date = new Date(dateString);
        }
        
        if (!date || isNaN(date.getTime())) {
            return 'N/A';
        }
        
        // Formatear a dd/mm/yyyy
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
        
    } catch (e) {
        console.error('Error formateando fecha:', dateString, e);
        return 'N/A';
    }
}

// FUNCIÓN CORREGIDA: Formatear fecha con advertencia
function formatDateWithWarning(dateString, diasRestantes) {
    if (!dateString) return '-';

    // Formatear fecha correctamente
    const formattedDate = formatDate(dateString);
    if (formattedDate === 'N/A') return '-';
    
    let warning = '';
    if (diasRestantes === 0) {
        warning = ' <span class="date-warning">(HOY)</span>';
    } else if (diasRestantes > 0 && diasRestantes <= 3) {
        warning = ` <span class="date-warning">(${diasRestantes} días)</span>`;
    } else if (diasRestantes < 0) {
        warning = ` <span class="date-warning overdue">(+${Math.abs(diasRestantes)} días)</span>`;
    }

    return formattedDate + warning;
}

// FUNCIÓN CORREGIDA: Parsear fechas para cálculos
function parseDate(dateString) {
    if (!dateString) return null;

    try {
        let date;
        
        if (dateString.includes('/')) {
            // Formato dd/mm/yyyy
            const parts = dateString.split('/');
            if (parts.length === 3) {
                date = new Date(parts[2], parts[1] - 1, parts[0]);
            }
        } else if (dateString.includes('-')) {
            // Formato yyyy-mm-dd
            const parts = dateString.split('-');
            if (parts.length === 3) {
                date = new Date(parts[0], parts[1] - 1, parts[2]);
            }
        } else {
            // Intentar parsear directamente
            date = new Date(dateString);
        }
        
        return date && !isNaN(date.getTime()) ? date : null;
        
    } catch (e) {
        console.error('Error parseando fecha:', dateString, e);
        return null;
    }
}

// ==============================================
// Funciones para las tablas principales
// ==============================================

async function loadTable(tableType, tableId, page) {
    const tableElement = document.getElementById(tableId);
    if (!tableElement) {
        console.error(`Tabla ${tableId} no encontrada`);
        return;
    }

    try {
        showLoadingState(tableElement, TABLE_CONFIG[tableType].columns);

        const response = await fetch('/app/dashboard/tables.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'fetch',
                tableType: tableType,
                page: page
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Error en la respuesta del servidor');
        }

        renderTableData(tableElement, result.data, tableType);
        updatePagination(tableType, tableId, result.pagination);
        updateCounter(tableType, result.pagination.totalRecords);

    } catch (error) {
        console.error(`Error al cargar ${tableType}:`, error);
        showErrorState(tableElement, TABLE_CONFIG[tableType].columns, error.message, () => {
            loadTable(tableType, tableId, 1);
        });
    }
}

function showLoadingState(tableElement, columns) {
    const tbody = tableElement.querySelector('tbody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="${columns}" class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>Cargando datos...</p>
                </td>
            </tr>
        `;
    }
}

function showErrorState(tableElement, columns, errorMessage, retryCallback) {
    const tbody = tableElement.querySelector('tbody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="${columns}" class="error-state">
                    <p>Error al cargar datos: ${errorMessage}</p>
                    ${retryCallback ? `
                    <button onclick="(${retryCallback.toString()})()" class="retry-btn">
                        Reintentar
                    </button>
                    ` : ''}
                </td>
            </tr>
        `;
    }
}

function renderTableData(tableElement, data, tableType) {
    const tbody = tableElement.querySelector('tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="${TABLE_CONFIG[tableType].columns}" class="no-data">
                    ${TABLE_CONFIG[tableType].noDataMessage}
                </td>
            </tr>
        `;
        return;
    }

    // Usar DocumentFragment para mejor rendimiento
    const fragment = document.createDocumentFragment();

    data.forEach(item => {
        const row = createTableRow(item, tableType);
        fragment.appendChild(row);
    });

    tbody.appendChild(fragment);
}

function createTableRow(item, tableType) {
    const row = document.createElement('tr');
    let diasRestantes = item.DiasRestantes !== undefined ? parseInt(item.DiasRestantes) : null;

    // Si no viene DiasRestantes del servidor, calcularlo
    if (diasRestantes === null && item.FechaPresentacion) {
        const fechaPresentacion = parseDate(item.FechaPresentacion);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        if (fechaPresentacion) {
            const fechaNormalizada = new Date(fechaPresentacion);
            fechaNormalizada.setHours(0, 0, 0, 0);
            
            const diffTime = fechaNormalizada.getTime() - hoy.getTime();
            diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
    }

    // Aplicar clases según días restantes
    applyDateBasedStyling(row, diasRestantes);

    if (tableType === 'vencer') {
        row.innerHTML = `
            <td>${escapeHtml(item.Empresa || '-')}</td>
            <td>${escapeHtml(item.Nro || '-')}</td>
            <td>${escapeHtml(item.Tipo || '-')}</td>
            <td>${escapeHtml(item.Etapa || '-')}</td>
            <td>${formatDateWithWarning(item.FechaPresentacion, diasRestantes)}</td>
            <td>${formatDate(item.NuevaFecha) || '-'}</td>
            <td>${escapeHtml(item.Estado || '-')}</td>
            <td>${formatCurrency(item.IGV)}</td>
            <td>
                <button class="preview-btn" onclick="openCasePreview(${item.id_fiscalizacion})" 
                        title="Ver vista previa del caso">
                    <i class="bi bi-eye"></i>
                </button>
            </td>
        `;
    } else {
        // Para las otras tablas (reclamar, apelar)
        row.innerHTML = `
            <td>${escapeHtml(item.Empresa || '-')}</td>
            <td>${escapeHtml(item.Nro || '-')}</td>
            <td>${escapeHtml(item.Tipo || '-')}</td>
            <td>${formatDateWithWarning(item.FechaPresentacion, diasRestantes)}</td>
            <td>${escapeHtml(item.Estado || '-')}</td>
        `;
    }

    return row;
}

function updatePagination(tableType, tableId, pagination) {
    // Encontrar el contenedor correcto basado en tu estructura HTML
    let container;

    if (tableId === 'vencer-table') {
        container = document.querySelector('.vencer .pagination-controls');
    } else if (tableId === 'reclamar-table') {
        container = document.querySelector('.reclamar .pagination-controls');
    } else if (tableId === 'apelar-table') {
        container = document.querySelector('.apelar .pagination-controls');
    }

    if (!container) {
        console.error(`No se encontró el contenedor de paginación para ${tableId}`);
        return;
    }

    const { currentPage, totalPages, totalRecords, perPage } = pagination;

    // No mostrar paginación si no hay suficientes registros
    if (totalRecords <= perPage) {
        container.innerHTML = '';
        return;
    }

    let html = '';
    const maxVisiblePages = 5;

    // Botón Anterior
    html += `<button class="pagination-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>
                <i class="bi bi-chevron-left"></i>
            </button>`;

    // Calcular rango de páginas a mostrar
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Ajustar si estamos cerca del final
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Primera página con elipsis si es necesario
    if (startPage > 1) {
        html += `<button class="pagination-btn" data-page="1">1</button>`;
        if (startPage > 2) {
            html += `<span class="pagination-ellipsis">...</span>`;
        }
    }

    // Páginas intermedias
    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }

    // Última página con elipsis si es necesario
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += `<span class="pagination-ellipsis">...</span>`;
        }
        html += `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`;
    }

    // Botón Siguiente
    html += `<button class="pagination-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>
                <i class="bi bi-chevron-right"></i>
            </button>`;

    // Información de registros mostrados
    const showingFrom = (currentPage - 1) * perPage + 1;
    const showingTo = Math.min(currentPage * perPage, totalRecords);
    html += `<div class="pagination-info">Mostrando ${showingFrom}-${showingTo} de ${totalRecords}</div>`;

    container.innerHTML = html;

    // Agregar event listeners
    container.querySelectorAll('.pagination-btn:not([disabled])').forEach(btn => {
        btn.addEventListener('click', function () {
            const page = parseInt(this.dataset.page);
            if (!isNaN(page)) {
                loadTable(tableType, tableId, page);
                // Scroll suave hacia la parte superior de la tabla
                const tableElement = document.getElementById(tableId);
                if (tableElement) {
                    tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });
}

function updateCounter(tableType, totalRecords) {
    const counterElement = document.querySelector(`.${tableType}-header p`);
    if (counterElement) {
        counterElement.textContent = totalRecords;

        // Opcional: añadir clase si no hay registros
        counterElement.classList.toggle('no-records', totalRecords === 0);
    }
}

// ==============================================
// Funciones para la tabla de resumen
// ==============================================

async function loadResumenTable(page, search = '') {
    const tableElement = document.querySelector('.resumen-table');
    if (!tableElement) return;

    try {
        showLoadingState(tableElement, 10); // 10 columnas para resumen

        // Configurar los datos a enviar
        const payload = {
            action: 'fetch',
            page: page
        };

        if (search) {
            payload.search = search;
        }

        // Realizar petición al servidor
        const response = await fetch('/app/dashboard/resumen.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Error en la respuesta del servidor');
        }

        // Renderizar los datos
        renderResumenData(tableElement, result.data);

        // Actualizar paginación
        updateResumenPagination(result.pagination, search);

        // Actualizar contador
        updateResumenCounter(result.pagination.totalRecords);

    } catch (error) {
        console.error('Error al cargar resumen:', error);
        showErrorState(tableElement, 10, error.message, () => {
            const searchInput = document.querySelector('.buscar-resumen');
            loadResumenTable(1, searchInput ? searchInput.value : '');
        });
    }
}

function renderResumenData(tableElement, data) {
    const tbody = tableElement.querySelector('tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="no-data">
                    No se encontraron registros de primer requerimiento
                </td>
            </tr>
        `;
        return;
    }

    // Usar DocumentFragment para mejor rendimiento
    const fragment = document.createDocumentFragment();

    data.forEach(item => {
        const row = createResumenRow(item);
        fragment.appendChild(row);
    });

    tbody.appendChild(fragment);
}

function createResumenRow(item) {
    const row = document.createElement('tr');
    
    // Calcular días restantes CORREGIDO
    let diasRestantes = null;
    
    if (item.FechaPresentacion) {
        const fechaPresentacion = parseDate(item.FechaPresentacion);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        if (fechaPresentacion) {
            // Normalizar ambas fechas para comparación
            const fechaNormalizada = new Date(fechaPresentacion);
            fechaNormalizada.setHours(0, 0, 0, 0);
            
            const diffTime = fechaNormalizada.getTime() - hoy.getTime();
            diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            console.log('Fecha cálculo:', {
                fechaPresentacion: item.FechaPresentacion,
                fechaParseada: fechaPresentacion,
                hoy: hoy,
                diasRestantes: diasRestantes
            });
            
            // Aplicar clases según días restantes usando la misma función
            applyDateBasedStyling(row, diasRestantes);
        }
    }

    // CORREGIDO: Usar id_fiscalizacion en lugar de id
    const idFiscalizacion = item.id_fiscalizacion || item.id;

    row.innerHTML = `
        <td>${escapeHtml(item.Nro || '-')}</td>
        <td>${escapeHtml(item.Tipo || '-')}</td>
        <td>${escapeHtml(item.Etapa || '-')}</td>
        <td>${escapeHtml(item.Estado || '-')}</td>
        <td>${formatDateWithWarning(item.FechaPresentacion, diasRestantes)}</td>
        <td>${formatDate(item.FechaPresentado) || '-'}</td>
        <td>${formatDate(item.NuevaFecha) || '-'}</td>
        <td>${formatCurrency(item.IGV)}</td>
        <td>${escapeHtml(item.SUNAT || '-')}</td>
        <td><i class="bi bi-eye view-detail" onclick="viewDetail(${idFiscalizacion})" title="Ver requerimientos relacionados"></i></td>
    `;

    return row;
}

function updateResumenPagination(pagination, search = '') {
    const container = document.querySelector('.resumen .pagination-controls');
    if (!container) return;

    const { currentPage, totalPages, totalRecords, perPage } = pagination;

    // No mostrar paginación si no hay suficientes registros
    if (totalRecords <= perPage) {
        container.innerHTML = '';
        return;
    }

    let html = '';
    const maxVisiblePages = 5;

    // Botón Anterior
    html += `<button class="pagination-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>
                <i class="bi bi-chevron-left"></i>
            </button>`;

    // Rango de páginas
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Ajustar si estamos cerca del final
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Primera página con elipsis si es necesario
    if (startPage > 1) {
        html += `<button class="pagination-btn" data-page="1">1</button>`;
        if (startPage > 2) {
            html += `<span class="pagination-ellipsis">...</span>`;
        }
    }

    // Páginas intermedias
    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }

    // Última página con elipsis si es necesario
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += `<span class="pagination-ellipsis">...</span>`;
        }
        html += `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`;
    }

    // Botón Siguiente
    html += `<button class="pagination-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>
                <i class="bi bi-chevron-right"></i>
            </button>`;

    // Información de registros mostrados
    const showingFrom = (currentPage - 1) * perPage + 1;
    const showingTo = Math.min(currentPage * perPage, totalRecords);
    html += `<div class="pagination-info">Mostrando ${showingFrom}-${showingTo} de ${totalRecords}</div>`;

    container.innerHTML = html;

    // Agregar event listeners
    container.querySelectorAll('.pagination-btn:not([disabled])').forEach(btn => {
        btn.addEventListener('click', function () {
            const page = parseInt(this.dataset.page);
            if (!isNaN(page)) {
                loadResumenTable(page, search);
            }
        });
    });
}

function updateResumenCounter(totalRecords) {
    const counterElement = document.querySelector('.resumen-header p');
    if (counterElement) {
        counterElement.textContent = totalRecords;
    }
}

// ==============================================
// Funciones para el modal de requerimientos hijos
// ==============================================

function viewDetail(idFiscalizacion) {
    console.log('Abriendo modal para id_fiscalizacion:', idFiscalizacion);
    
    // Mostrar modal
    const modal = document.getElementById('requerimientosModal');
    if (!modal) {
        console.error('Modal requerimientosModal no encontrado');
        return;
    }
    
    modal.style.display = 'block';

    // Mostrar estado de carga
    const modalBody = document.getElementById('modalRequerimientosBody');
    if (modalBody) {
        modalBody.innerHTML = `
            <tr>
                <td colspan="7" class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>Cargando requerimientos relacionados...</p>
                </td>
            </tr>
        `;
    }

    // Configurar cierre del modal
    const closeBtn = document.querySelector('.close-modal');
    if (closeBtn) {
        closeBtn.onclick = function () {
            modal.style.display = 'none';
        }
    }

    // Cerrar modal al hacer clic fuera del contenido
    const clickHandler = function (event) {
        if (event.target === modal) {
            modal.style.display = 'none';
            window.removeEventListener('click', clickHandler);
        }
    };
    window.addEventListener('click', clickHandler);

    // Obtener requerimientos hijos
    fetchRequerimientosHijos(idFiscalizacion);
}

async function fetchRequerimientosHijos(idPadre) {
    try {
        const response = await fetch('/app/dashboard/requerimientos_hijos.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'fetch_hijos',
                id_fiscalizacion_padre: idPadre
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Error al cargar requerimientos');
        }

        renderRequerimientosHijos(result.data);
    } catch (error) {
        console.error('Error al cargar requerimientos hijos:', error);
        const modalBody = document.getElementById('modalRequerimientosBody');
        if (modalBody) {
            modalBody.innerHTML = `
                <tr>
                    <td colspan="7" class="error-state">
                        Error al cargar datos: ${error.message}
                        <button onclick="fetchRequerimientosHijos(${idPadre})" class="retry-btn">Reintentar</button>
                    </td>
                </tr>
            `;
        }
    }
}

function renderRequerimientosHijos(data) {
    const tbody = document.getElementById('modalRequerimientosBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="no-data">
                    No se encontraron requerimientos relacionados
                </td>
            </tr>
        `;
        return;
    }

    // Usar DocumentFragment para mejor rendimiento
    const fragment = document.createDocumentFragment();

    data.forEach(item => {
        const row = createRequerimientoHijoRow(item);
        fragment.appendChild(row);
    });

    tbody.appendChild(fragment);
}

function createRequerimientoHijoRow(item) {
    const row = document.createElement('tr');
    const diasRestantes = item.dias_restantes || 0;

    // Aplicar estilos según días restantes
    if (diasRestantes === 0) {
        row.classList.add('due-today');
    } else if (diasRestantes > 0 && diasRestantes <= 3) {
        row.classList.add('due-soon');
    } else if (diasRestantes < 0) {
        row.classList.add('overdue');
    }

    row.innerHTML = `
        <td>${escapeHtml(item.numero || '-')}</td>
        <td>${escapeHtml(item.etapa || '-')}</td>
        <td>${formatDateWithWarning(item.fecha_a_presentar, diasRestantes)}</td>
        <td>${formatDate(item.fecha_presentacion) || '-'}</td>
        <td>${formatDate(item.nueva_fecha) || '-'}</td>
        <td>${escapeHtml(item.estado || '-')}</td>
        <td>${formatCurrency(item.IGV)}</td>
    `;

    return row;
}

// ==============================================
// Función para Vista Previa de Casos
// ==============================================

function openCasePreview(caseId) {
    console.log('Abriendo vista previa del caso:', caseId);

    // Cerrar modal existente si hay uno
    closeCasePreview();

    // Modal simple temporal para testing
    const modalHTML = `
        <div id="casePreviewModal" class="modal" style="display: flex;">
            <div class="modal-content" style="max-width: 700px;">
                <span class="close" onclick="closeCasePreview()">&times;</span>
                <h2>Vista Previa del Caso #${caseId}</h2>
                <div class="preview-details">
                    <div class="loading-state">
                        <div class="loading-spinner"></div>
                        <p>Cargando detalles del caso ID: ${caseId}...</p>
                        <p><small>Verifica la consola para detalles de depuración</small></p>
                    </div>
                </div>
                <div class="modal-actions">
                    <button onclick="closeCasePreview()" class="btn-secondary">Cerrar</button>
                    <button onclick="window.location.href='/app/modificar-caso.php?id=${caseId}'" class="btn-primary">Modificar</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Cerrar modal al hacer clic fuera
    document.getElementById('casePreviewModal').addEventListener('click', function (e) {
        if (e.target === this) {
            closeCasePreview();
        }
    });

    // Cargar detalles
    loadCaseDetails(caseId);
}

function closeCasePreview() {
    const modal = document.getElementById('casePreviewModal');
    if (modal) {
        modal.remove();
    }
}

async function loadCaseDetails(caseId) {
    try {
        console.log('Solicitando detalles para caso ID:', caseId);

        const requestBody = {
            id_fiscalizacion: caseId
        };

        console.log('Enviando request body:', requestBody);

        const response = await fetch('/app/dashboard/get_case_details.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        console.log('Respuesta HTTP:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}. Response: ${errorText}`);
        }

        const result = await response.json();
        console.log('Resultado JSON:', result);

        if (result.success) {
            updatePreviewModal(result.data);
        } else {
            throw new Error(result.message || 'Error al cargar detalles');
        }
    } catch (error) {
        console.error('Error completo al cargar detalles:', error);
        const previewDetails = document.querySelector('#casePreviewModal .preview-details');
        if (previewDetails) {
            previewDetails.innerHTML = `
                <div class="error-state">
                    <p><strong>Error al cargar detalles:</strong></p>
                    <p>${error.message}</p>
                    <button onclick="loadCaseDetails(${caseId})" class="retry-btn">Reintentar</button>
                    <button onclick="closeCasePreview()" class="btn-secondary">Cerrar</button>
                </div>
            `;
        }
    }
}

// FUNCIÓN CORREGIDA: Actualizar modal de vista previa con fechas correctas
function updatePreviewModal(caseData) {
    const previewDetails = document.querySelector('#casePreviewModal .preview-details');
    if (!previewDetails) return;

    // Función para formatear periodo (MMAAAA)
    const formatPeriod = (start, end) => {
        if (!start || !end) return 'Sin periodo';

        const formatPeriodo = (periodo) => {
            if (!periodo || periodo.length !== 6) return periodo;
            const mes = periodo.substring(0, 2);
            const año = periodo.substring(2, 6);
            return `${mes}/${año}`;
        };

        return `${formatPeriodo(start)} - ${formatPeriodo(end)}`;
    };

    previewDetails.innerHTML = `
        <div class="preview-sections">
            <div class="preview-section">
                <h3>📋 Información Básica</h3>
                <p><strong>Número:</strong> ${caseData.numero || 'N/A'}</p>
                <p><strong>Razón Social:</strong> ${caseData.razon_social || 'N/A'}</p>
                <p><strong>RUC:</strong> ${caseData.RUC || 'N/A'}</p>
                <p><strong>Tipo:</strong> ${caseData.tipo_descripcion || 'N/A'}</p>
                ${caseData.numero_padre ? `<p><strong>Caso Padre:</strong> ${caseData.numero_padre}</p>` : ''}
            </div>
            
            <div class="preview-section">
                <h3>📅 Fechas</h3>
                <p><strong>Fecha Notificación:</strong> ${formatDate(caseData.fecha_notificacion) || 'N/A'}</p>
                <p><strong>Fecha Presentación:</strong> ${formatDate(caseData.fecha_presentacion) || 'N/A'}</p>
                <p><strong>Fecha Prórroga:</strong> ${formatDate(caseData.fecha_prorroga) || 'N/A'}</p>
                <p><strong>Fecha Presentado:</strong> ${formatDate(caseData.fecha_presentado) || 'N/A'}</p>
            </div>
            
            <div class="preview-section">
                <h3>📊 Estado y Proceso</h3>
                <p><strong>Estado:</strong> ${caseData.estado_descripcion || 'N/A'}</p>
                <p><strong>Etapa:</strong> ${caseData.etapa_descripcion || 'N/A'}</p>
                <p><strong>Periodo:</strong> ${formatPeriod(caseData.periodo_inicio, caseData.periodo_final)}</p>
                <p><strong>IGV:</strong> ${formatCurrency(caseData.IGV)}</p>
            </div>
            
            ${caseData.agentes_sunat && caseData.agentes_sunat.length > 0 ? `
            <div class="preview-section">
                <h3>👥 Agentes SUNAT</h3>
                <div class="agentes-list">
                    ${caseData.agentes_sunat.map(agente => `
                        <div class="agente-item">
                            <strong>${agente.cargo || 'Agente'}:</strong> ${agente.nombre_completo || 'N/A'}
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : `
            <div class="preview-section">
                <h3>👥 Agentes SUNAT</h3>
                <p style="color: #7f8c8d; font-style: italic;">No hay agentes asignados</p>
            </div>
            `}
            
            ${caseData.cliente_cruce ? `
            <div class="preview-section">
                <h3>🔗 Información Adicional</h3>
                <p><strong>Cliente Cruce:</strong> ${caseData.cliente_cruce}</p>
            </div>
            ` : ''}
        </div>
    `;
}
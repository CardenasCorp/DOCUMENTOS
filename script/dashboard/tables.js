document.addEventListener('DOMContentLoaded', function () {
    // Cargar todas las tablas al iniciar
    loadTable('vencer', 'vencer-table', 1);
    loadTable('reclamar', 'reclamar-table', 1);
    loadTable('apelar', 'apelar-table', 1);
    loadResumenTable(1);

    // Evento para el buscador del resumen (con debounce para mejor performance)
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
    'vencer': { columns: 8, noDataMessage: 'No hay registros próximos a vencer' },
    'reclamar': { columns: 5, noDataMessage: 'No hay registros por reclamar' },
    'apelar': { columns: 5, noDataMessage: 'No hay registros por apelar' }
};

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
    tableElement.querySelector('tbody').innerHTML = `
        <tr>
            <td colspan="${columns}" class="loading-state">
                <div class="loading-spinner"></div>
                <p>Cargando datos...</p>
            </td>
        </tr>
    `;
}

function showErrorState(tableElement, columns, errorMessage, retryCallback) {
    tableElement.querySelector('tbody').innerHTML = `
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

function renderTableData(tableElement, data, tableType) {
    const tbody = tableElement.querySelector('tbody');
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
    const diasRestantes = item.DiasRestantes !== undefined ? parseInt(item.DiasRestantes) : null;

    // Aplicar clases según días restantes
    applyDateBasedStyling(row, diasRestantes);

    if (tableType === 'vencer') {
        row.innerHTML = `
            <td>${escapeHtml(item.Empresa || '-')}</td>
            <td>${escapeHtml(item.Nro || '-')}</td>
            <td>${escapeHtml(item.Tipo || '-')}</td>
            <td>${escapeHtml(item.Etapa || '-')}</td>
            <td>${formatDateWithWarning(item.FechaPresentacion, diasRestantes)}</td>
            <td>${escapeHtml(item.NuevaFecha || '-')}</td>
            <td>${escapeHtml(item.Estado || '-')}</td>
            <td>${formatCurrency(item.IGV)}</td> 
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
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
                document.getElementById(tableId).scrollIntoView({ behavior: 'smooth', block: 'start' });
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
            loadResumenTable(1, document.querySelector('.buscar-resumen').value);
        });
    }
}

function renderResumenData(tableElement, data) {
    const tbody = tableElement.querySelector('tbody');
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
    const fechaPresentacion = item.FechaPresentacion ? parseDate(item.FechaPresentacion) : null;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaPresentacion && fechaPresentacion < hoy) {
        row.classList.add('vencido');
    }

    // Mantenemos 10 columnas como en el HTML original
    row.innerHTML = `
        <td>${escapeHtml(item.Nro || '-')}</td>
        <td>${escapeHtml(item.Tipo || '-')}</td>
        <td>${escapeHtml(item.Etapa || '-')}</td>
        <td>${escapeHtml(item.Estado || '-')}</td>
        <td>${escapeHtml(item.FechaPresentacion || '-')}</td>
        <td>${escapeHtml(item.FechaPresentado || '-')}</td>
        <td>${escapeHtml(item.NuevaFecha || '-')}</td>
        <td>${formatCurrency(item.IGV)}</td>
        <td>${escapeHtml(item.SUNAT || '-')}</td>
        <td><i class="bi bi-eye view-detail" onclick="viewDetail(${item.id})"></i></td>
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
    // Mostrar modal
    const modal = document.getElementById('requerimientosModal');
    modal.style.display = 'block';

    // Mostrar estado de carga
    document.getElementById('modalRequerimientosBody').innerHTML = `
        <tr>
            <td colspan="7" class="loading-state">
                <div class="loading-spinner"></div>
                <p>Cargando requerimientos relacionados...</p>
            </td>
        </tr>
    `;

    // Cerrar modal al hacer clic en la X
    document.querySelector('.close-modal').onclick = function () {
        modal.style.display = 'none';
    }

    // Cerrar modal al hacer clic fuera del contenido
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }

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
        document.getElementById('modalRequerimientosBody').innerHTML = `
            <tr>
                <td colspan="7" class="error-state">
                    Error al cargar datos: ${error.message}
                </td>
            </tr>
        `;
    }
}

function renderRequerimientosHijos(data) {
    const tbody = document.getElementById('modalRequerimientosBody');
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
        <td>${escapeHtml(item.fecha_presentacion || '-')}</td>
        <td>${escapeHtml(item.nueva_fecha || '-')}</td>
        <td>${escapeHtml(item.estado || '-')}</td>
        <td> ${formatCurrency(item.IGV)}</td>
    `;

    return row;
}

// ==============================================
// Funciones auxiliares compartidas
// ==============================================

function formatDateWithWarning(dateString, diasRestantes) {
    if (!dateString) return '-';

    let warning = '';
    if (diasRestantes === 0) {
        warning = ' <span class="date-warning">(HOY)</span>';
    } else if (diasRestantes > 0 && diasRestantes <= 3) {
        warning = ` <span class="date-warning">(${diasRestantes} días)</span>`;
    } else if (diasRestantes < 0) {
        warning = ` <span class="date-warning overdue">(+${Math.abs(diasRestantes)} días)</span>`;
    }

    return escapeHtml(dateString) + warning;
}

function parseDate(dateString) {
    if (!dateString) return null;

    // Intentar diferentes formatos de fecha
    const formats = [
        // Formato dd/mm/yyyy
        () => {
            const parts = dateString.split('/');
            if (parts.length === 3) {
                return new Date(parts[2], parts[1] - 1, parts[0]);
            }
            return null;
        },
        // Formato yyyy-mm-dd
        () => {
            const parts = dateString.split('-');
            if (parts.length === 3) {
                return new Date(parts[0], parts[1] - 1, parts[2]);
            }
            return null;
        },
        // Formato ISO
        () => new Date(dateString)
    ];

    for (const format of formats) {
        try {
            const date = format();
            if (date && !isNaN(date.getTime())) {
                return date;
            }
        } catch (e) {
            // Continuar con el siguiente formato
        }
    }

    return null;
}


// Inyectar estilos
const styleElement = document.createElement('style');
styleElement.textContent = additionalStyles;
document.head.appendChild(styleElement);
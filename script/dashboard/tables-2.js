document.addEventListener('DOMContentLoaded', function () {
    // Cargar todas las tablas al iniciar
    loadTable('cerrar', 'cerrar-table', 1);
    loadTable('reclamaciones', 'reclamaciones-table', 1);
    loadTable('apelaciones', 'apelaciones-table', 1);
    loadQuejasTable(1);

    // Evento para el buscador de quejas
    document.querySelector('.buscar-quejas').addEventListener('input', function (e) {
        loadQuejasTable(1, e.target.value);
    });
});

// Función genérica para cargar tablas principales
async function loadTable(tableType, tableId, page) {
    const tableElement = document.getElementById(tableId);
    if (!tableElement) return;

    try {
        // Mostrar estado de carga
        const columns = tableType === 'cerrar' ? 5 : 4;
        tableElement.querySelector('tbody').innerHTML = `
            <tr>
                <td colspan="${columns}" style="text-align: center; padding: 20px;">
                    Cargando datos...
                </td>
            </tr>
        `;

        // Realizar petición al servidor
        const response = await fetch('/app/dashboard/tables-2.php', {
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
            throw new Error(`Error ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Error en los datos recibidos');
        }

        // Renderizar los datos
        renderTableData(tableElement, result.data, tableType);

        // Actualizar paginación
        updatePagination(tableType, tableId, result.pagination);

        // Actualizar contador
        updateCounter(tableType, result.pagination.totalRecords);

    } catch (error) {
        console.error(`Error al cargar ${tableType}:`, error);
        const columns = tableType === 'cerrar' ? 5 : 4;
        tableElement.querySelector('tbody').innerHTML = `
            <tr>
                <td colspan="${columns}" style="text-align: center; color: red; padding: 20px;">
                    Error al cargar datos: ${error.message}
                    <button onclick="loadTable('${tableType}', '${tableId}', 1)" 
                            style="margin-top: 10px; padding: 5px 10px;">
                        Reintentar
                    </button>
                </td>
            </tr>
        `;
    }
}

// Función para cargar la tabla de quejas
async function loadQuejasTable(page, search = '') {
    const tableElement = document.querySelector('.quejas-table');
    if (!tableElement) return;

    try {
        // Mostrar estado de carga
        tableElement.querySelector('tbody').innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 20px;">
                    Cargando datos...
                </td>
            </tr>
        `;

        // Realizar petición al servidor
        const response = await fetch('/app/dashboard/tables-2.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'fetch',
                tableType: 'quejas',
                page: page,
                search: search
            })
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Error en los datos recibidos');
        }

        // Renderizar los datos
        renderQuejasData(tableElement, result.data);

        // Actualizar paginación
        updateQuejasPagination(result.pagination, search);

        // Actualizar contador
        updateQuejasCounter(result.pagination.totalRecords);

    } catch (error) {
        console.error('Error al cargar quejas:', error);
        tableElement.querySelector('tbody').innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: red; padding: 20px;">
                    Error al cargar datos: ${error.message}
                    <button onclick="loadQuejasTable(1, document.querySelector('.buscar-quejas').value)" 
                            style="margin-top: 10px; padding: 5px 10px;">
                        Reintentar
                    </button>
                </td>
            </tr>
        `;
    }
}

// Función para renderizar datos en tablas principales
function renderTableData(tableElement, data, tableType) {
    const tbody = tableElement.querySelector('tbody');
    tbody.innerHTML = '';

    if (!data || data.length === 0) {
        const columns = 
            tableType === 'cerrar' ? 5 : 
            tableType === 'quejas' ? 6 : 4;
        
        tbody.innerHTML = `
            <tr>
                <td colspan="${columns}" style="text-align: center; padding: 20px;">
                    No hay registros disponibles
                </td>
            </tr>
        `;
        return;
    }

    data.forEach(item => {
        const row = document.createElement('tr');
        
        // Aplicar clases según el tipo de tabla y días restantes
        if (tableType === 'reclamaciones' || tableType === 'apelaciones') {
            const diasRestantes = item.DiasRestantes;
            
            if (diasRestantes <= 3) {
                row.classList.add('urgent-row');
            } else if (diasRestantes <= 7) {
                row.classList.add('warning-row');
            } else if (diasRestantes <= 0) {
                row.classList.add('expired-row');
            }
        }

        // Construir el contenido de la fila según el tipo de tabla
        switch (tableType) {
            case 'cerrar':
                row.innerHTML = `
                    <td>${item.Nro || '-'}</td>
                    <td>${item.Tipo || '-'}</td>
                    <td>${item.Etapa || '-'}</td>
                    <td>${item.Estado || '-'}</td>
                    <td>${item.FechaCierre || '-'}</td>
                `;
                break;

            case 'reclamaciones':
            case 'apelaciones':
                row.innerHTML = `
                    <td>${item.Nro || '-'}</td>
                    <td>${item.Tipo || '-'}</td>
                    <td>${formatDateWithWarning(item.FechaPresentar, item.DiasRestantes)}</td>
                    <td>${item.FechaMaxima || '-'}</td>
                `;
                break;

            case 'quejas':
                row.innerHTML = `
                    <td>${item.razon_social || item.Empresa || '-'}</td>
                    <td>${item.Requerimiento || '-'}</td>
                    <td>${item.id_fiscalizacion || '-'}</td>
                    <td>${item.Resumen || '-'}</td>
                    <td>${item.FechaPresentacion || '-'}</td>
                    <td>${item.FechaMaximaRespuesta || '-'}</td>
                `;
                break;
                    
            default:
                row.innerHTML = `<td colspan="6">Tipo de tabla no reconocido</td>`;
        }

        tbody.appendChild(row);
    });
}

function formatDateWithWarning(dateString, diasRestantes) {
    if (!dateString) return '-';
    
    let warning = '';
    if (diasRestantes <= 0) {
        warning = ' <span class="date-warning"></span>';
    } else if (diasRestantes <= 3) {
        warning = ` <span class="date-warning">(${diasRestantes} días)</span>`;
    } else if (diasRestantes <= 7) {
        warning = ` <span class="date-notice">(${diasRestantes} días)</span>`;
    }
    
    return dateString + warning;
}

// Función para renderizar datos de quejas
function renderQuejasData(tableElement, data) {
    const tbody = tableElement.querySelector('tbody');
    tbody.innerHTML = '';

    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 20px;">
                    No se encontraron quejas
                </td>
            </tr>
        `;
        return;
    }

    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.Empresa || '-'}</td>
            <td>${item.Requerimiento || '-'}</td>
            <td>${item.NumeroQueja || '-'}</td>
            <td>${item.Resumen || '-'}</td>
            <td>${item.FechaPresentacion || '-'}</td>
            <td>${item.FechaMaximaRespuesta || '-'}</td>
        `;
        tbody.appendChild(row);
    });
}

// Funciones de paginación
function updatePagination(tableType, tableId, pagination) {
    let container;

    if (tableId === 'cerrar-table') {
        container = document.querySelector('.cerrar .pagination-controls');
    } else if (tableId === 'reclamaciones-table') {
        container = document.querySelector('.reclamaciones .pagination-controls');
    } else if (tableId === 'apelaciones-table') {
        container = document.querySelector('.apelaciones .pagination-controls');
    }

    if (!container) return;

    const { currentPage, totalPages, totalRecords, perPage } = pagination;

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

    // Calcular rango de páginas
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

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
                document.getElementById(tableId).scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

function updateQuejasPagination(pagination, search = '') {
    const container = document.querySelector('.quejas .pagination-controls');
    if (!container) return;

    const { currentPage, totalPages, totalRecords, perPage } = pagination;

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
                loadQuejasTable(page, search);
            }
        });
    });
}

// Funciones para actualizar contadores
function updateCounter(tableType, totalRecords) {
    const counterElement = document.querySelector(`.${tableType}-header p`);
    if (counterElement) {
        counterElement.textContent = totalRecords;
        counterElement.classList.toggle('no-records', totalRecords === 0);
    }
}

function updateQuejasCounter(totalRecords) {
    const counterElement = document.querySelector('.quejas-header p');
    if (counterElement) {
        counterElement.textContent = totalRecords;
    }
}
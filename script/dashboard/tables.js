document.addEventListener('DOMContentLoaded', function() {
    // Cargar todas las tablas al iniciar
    loadTable('vencer', 'vencer-table', 1);
    loadTable('reclamar', 'reclamar-table', 1);
    loadTable('apelar', 'apelar-table', 1);
    loadResumenTable(1);
    
    // Evento para el buscador del resumen
    document.querySelector('.buscar-resumen').addEventListener('input', function(e) {
        loadResumenTable(1, e.target.value);
    });
});

// ==============================================
// Funciones para las tablas principales (vencer, reclamar, apelar)
// ==============================================

async function loadTable(tableType, tableId, page) {
    const tableElement = document.getElementById(tableId);
    if (!tableElement) return;

    try {
        // Mostrar estado de carga
        const columns = tableType === 'vencer' ? 6 : 4;
        tableElement.querySelector('tbody').innerHTML = `
            <tr>
                <td colspan="${columns}" style="text-align: center; padding: 20px;">
                    Cargando datos...
                </td>
            </tr>
        `;

        // Realizar petición al servidor
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
        const columns = tableType === 'vencer' ? 6 : 4;
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

function renderTableData(tableElement, data, tableType) {
    const tbody = tableElement.querySelector('tbody');
    tbody.innerHTML = '';

    if (!data || data.length === 0) {
        const columns = tableType === 'vencer' ? 6 : 4;
        tbody.innerHTML = `
            <tr>
                <td colspan="${columns}" style="text-align: center; padding: 20px;">
                    No hay registros próximos a vencer
                </td>
            </tr>
        `;
        return;
    }

    // Crear filas de la tabla con estilos según proximidad
    data.forEach(item => {
        const row = document.createElement('tr');
        const diasRestantes = item.DiasRestantes !== undefined ? parseInt(item.DiasRestantes) : null;
        
        // Aplicar clases según días restantes
        if (diasRestantes === 0) {
            row.classList.add('due-today');
        } else if (diasRestantes !== null && diasRestantes <= 3) {
            row.classList.add('due-soon');
        }

        if (tableType === 'vencer') {
            row.innerHTML = `
                <td>${item.Nro || '-'}</td>
                <td>${item.Tipo || '-'}</td>
                <td>${item.Etapa || '-'}</td>
                <td>${formatDateWithWarning(item.FechaPresentacion, diasRestantes)}</td>
                <td>${item.Estado || '-'}</td>
                <td>S/ ${item.IGV || '0.00'}</td>
            `;
        } else {
            row.innerHTML = `
                <td>${item.Nro || '-'}</td>
                <td>${item.Tipo || '-'}</td>
                <td>${formatDateWithWarning(item.FechaPresentacion, diasRestantes)}</td>
                <td>${item.Estado || '-'}</td>
            `;
        }

        tbody.appendChild(row);
    });
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
        btn.addEventListener('click', function() {
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
        // Mostrar estado de carga
        tableElement.querySelector('tbody').innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 20px;">
                    Cargando datos...
                </td>
            </tr>
        `;

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
            throw new Error(`Error ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Error en los datos recibidos');
        }

        // Renderizar los datos
        renderResumenData(tableElement, result.data);
        
        // Actualizar paginación
        updateResumenPagination(result.pagination, search);
        
        // Actualizar contador
        updateResumenCounter(result.pagination.totalRecords);

    } catch (error) {
        console.error('Error al cargar resumen:', error);
        tableElement.querySelector('tbody').innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; color: red; padding: 20px;">
                    Error al cargar datos: ${error.message}
                    <button onclick="loadResumenTable(1, document.querySelector('.buscar-resumen').value)" 
                            style="margin-top: 10px; padding: 5px 10px;">
                        Reintentar
                    </button>
                </td>
            </tr>
        `;
    }
}

function renderResumenData(tableElement, data) {
    const tbody = tableElement.querySelector('tbody');
    tbody.innerHTML = '';

    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 20px;">
                    No se encontraron registros de primer requerimiento
                </td>
            </tr>
        `;
        return;
    }

    // Crear filas de la tabla
    data.forEach(item => {
        const row = document.createElement('tr');
        
        // Resaltar registros vencidos si es necesario
        const fechaPresentacion = item.FechaPresentacion ? parseDate(item.FechaPresentacion) : null;
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        if (fechaPresentacion && fechaPresentacion < hoy) {
            row.classList.add('vencido');
        }

        row.innerHTML = `
            <td>${item.Nro || '-'}</td>
            <td>${item.Tipo || '-'}</td>
            <td>${item.Etapa || '-'}</td>
            <td>${item.Estado || '-'}</td>
            <td>${item.FechaPresentacion || '-'}</td>
            <td>${item.FechaPresentado || '-'}</td>
            <td>${item.IGV || 'S/ 0.00'}</td>
            <td>${item.SUNAT || '-'}</td>
            <td><i class="bi bi-eye" onclick="viewDetail(${item.id})" style="cursor: pointer;"></i></td>
        `;
        tbody.appendChild(row);
    });
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
        btn.addEventListener('click', function() {
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
            <td colspan="5" style="text-align: center; padding: 20px;">
                Cargando requerimientos relacionados...
            </td>
        </tr>
    `;
    
    // Cerrar modal al hacer clic en la X
    document.querySelector('.close-modal').onclick = function() {
        modal.style.display = 'none';
    }
    
    // Cerrar modal al hacer clic fuera del contenido
    window.onclick = function(event) {
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
            throw new Error(`Error ${response.status}`);
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
                <td colspan="5" style="text-align: center; color: red; padding: 20px;">
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
                <td colspan="5" style="text-align: center; padding: 20px;">
                    No se encontraron requerimientos relacionados
                </td>
            </tr>
        `;
        return;
    }

    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.numero || '-'}</td>
            <td>${item.etapa || '-'}</td>
            <td>${item.fecha_presentacion || '-'}</td>
            <td>${item.estado || '-'}</td>
            <td>S/ ${item.IGV ? parseFloat(item.IGV).toFixed(2) : '0.00'}</td>
        `;
        tbody.appendChild(row);
    });
}

// ==============================================
// Funciones auxiliares compartidas
// ==============================================

function formatDateWithWarning(dateString, diasRestantes) {
    if (!dateString) return '-';
    
    let warning = '';
    if (diasRestantes === 0) {
        warning = ' <span class="date-warning">(HOY)</span>';
    } else if (diasRestantes !== null && diasRestantes <= 3) {
        warning = ` <span class="date-warning">(${diasRestantes} días)</span>`;
    }
    
    return dateString + warning;
}

function parseDate(dateString) {
    if (!dateString) return null;
    
    // Formato dd/mm/yyyy
    const parts = dateString.split('/');
    if (parts.length === 3) {
        return new Date(parts[2], parts[1] - 1, parts[0]);
    }
    
    // Otros formatos
    return new Date(dateString);
}
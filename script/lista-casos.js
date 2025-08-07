document.addEventListener('DOMContentLoaded', function() {
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

    // Mapeos para tipos, estados y etapas
    const tipoMap = {
        1: "Requerimiento",
        2: "Esquela",
        3: "Notificación",
        4: "Otro"
    };

    const estadoMap = {
        1: "Notificado",
        2: "Presentado",
        3: "Prórroga",
        4: "Anulado",
        5: "Eliminado" // Nuevo estado para borrado lógico
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
        10: "Finalizado"
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
                renderCases();
                renderPagination();
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
                        <p><strong>Fecha Notif.:</strong> ${formatDate(caso.fecha_notificacion) || 'Sin fecha'}</p>
                    </div>
                    <div class="client-actions">
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

    // Función para formatear fechas
    function formatDate(dateString) {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toLocaleDateString('es-PE');
    }

    // Función para filtrar casos
    function filterCases() {
        const clientSearch = searchClientInput.value.toLowerCase();
        const rucSearch = searchRUCInput.value.toLowerCase();
        
        filteredCases = allCases.filter(caso => {
            const matchesClient = caso.razon_social?.toLowerCase().includes(clientSearch) || !clientSearch;
            const matchesRUC = caso.RUC?.includes(rucSearch) || !rucSearch;
            return matchesClient && matchesRUC;
        });
        
        currentPage = 1;
        renderCases();
        renderPagination();
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
                updatePaginationButtons();
            });
            paginationContainer.appendChild(prevBtn);
        }
        
        // Botones de página
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.className = i === currentPage ? 'active' : '';
            pageBtn.addEventListener('click', () => {
                currentPage = i;
                renderCases();
                updatePaginationButtons();
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
                updatePaginationButtons();
            });
            paginationContainer.appendChild(nextBtn);
        }
    }

    // Actualizar estado de botones de paginación
    function updatePaginationButtons() {
        const buttons = paginationContainer.querySelectorAll('button');
        buttons.forEach(button => {
            button.classList.remove('active');
            if (button.textContent == currentPage && !isNaN(button.textContent)) {
                button.classList.add('active');
            }
        });
    }

    // Función para agregar eventos a los botones
    function addEventListeners() {
        // Editar
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const caseId = this.closest('.client-item').dataset.caseId;
                window.location.href = `modificar-caso.php?id=${caseId}`;
            });
        });
        
        // Quejas (solo para etapa 1)
        document.querySelectorAll('.complaint-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const caseId = this.closest('.client-item').dataset.caseId;
                if (typeof window.openComplaintModal === 'function') {
                    window.openComplaintModal(caseId);
                } else {
                    console.error('Error: openComplaintModal no está definido');
                    // Fallback alternativo
                    document.getElementById('myModalComplaint').style.display = 'block';
                }
            });
        });
        
        // Eliminar (borrado lógico)
        document.querySelectorAll('.delete-btn').forEach(btn => {
            if (!btn.textContent.includes('Eliminado')) {
                btn.addEventListener('click', async function() {
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

    // Event listeners para los inputs de búsqueda
    searchClientInput.addEventListener('input', filterCases);
    searchRUCInput.addEventListener('input', filterCases);

    // Cargar los casos al iniciar
    loadCases();
});
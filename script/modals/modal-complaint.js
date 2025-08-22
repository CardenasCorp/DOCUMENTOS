document.addEventListener('DOMContentLoaded', function () {
    // =============================================
    // SECCIÓN 1: GESTIÓN DE CASOS FISCALIZACIÓN
    // =============================================
    const searchClientInput = document.getElementById('searchClientInput');
    const searchRUCInput = document.getElementById('searchRUCInput');
    const employeeContainer = document.querySelector('.employee-container');
    const paginationContainer = document.getElementById('pagination');
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
        10: "Finalizado"
    };

    // Cargar casos iniciales
    loadCases();

    // Función para cargar casos
    async function loadCases() {
        try {
            showLoading(true);
            const response = await fetch('../app/casos/get_cases.php');
            const data = await response.json();

            if (data.success) {
                allCases = data.data;
                filteredCases = allCases.filter(caso => caso.id_estado != 5);
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

    // Función para renderizar casos
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

        addCaseEventListeners();
    }

    // Función para agregar eventos a los casos
    function addCaseEventListeners() {
        // Editar
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const caseId = this.closest('.client-item').dataset.caseId;
                window.location.href = `modificar-caso.php?id=${caseId}`;
            });
        });

        // Quejas
        document.querySelectorAll('.complaint-btn').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                const caseId = this.closest('.client-item').dataset.caseId;
                openComplaintModal(caseId);
            });
        });

        // Eliminar
        document.querySelectorAll('.delete-btn').forEach(btn => {
            if (!btn.textContent.includes('Eliminado')) {
                btn.addEventListener('click', async function () {
                    const caseId = this.closest('.client-item').dataset.caseId;
                    if (confirm('¿Estás seguro de marcar este caso como eliminado?')) {
                        await updateCaseStatus(caseId, 5);
                    }
                });
            }
        });
    }

    // Función para actualizar estado del caso
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
                loadCases();
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

    // =============================================
    // SECCIÓN 2: GESTIÓN DE QUEJAS (MODAL)
    // =============================================
    const modal = document.getElementById('myModalComplaint');
    const closeBtn = document.getElementById('closeModalEditBusiness');
    const listComplaint = document.getElementById('listComplaint');
    let currentFiscalizacionId = null;

    // Función para abrir el modal de quejas
    window.openComplaintModal = function (fiscalizacionId) {
        if (!fiscalizacionId) {
            console.error('Error: ID de fiscalización no proporcionado');
            return;
        }

        currentFiscalizacionId = fiscalizacionId;
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        loadComplaints(fiscalizacionId);
    };

    // Función para cerrar el modal
    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        currentFiscalizacionId = null;
    }

    // Event listeners para cerrar el modal
    closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', function (event) {
        if (event.target === modal) {
            closeModal();
        }
    });

    // Función para cargar quejas
    async function loadComplaints(fiscalizacionId) {
        try {
            listComplaint.innerHTML = '<p>Cargando quejas...</p>';

            const response = await fetch(`../app/casos/get_complaints.php?id_fiscalizacion=${fiscalizacionId}`);
            const data = await response.json();

            if (data.success) {
                renderComplaints(data.data);
            } else {
                throw new Error(data.message || 'Error al cargar quejas');
            }
        } catch (error) {
            console.error('Error al cargar quejas:', error);
            showError('Error al cargar quejas: ' + error.message);
        }
    }

    // Función para renderizar quejas
    function renderComplaints(complaints) {
        listComplaint.innerHTML = `
            <div class="complaint-item">
                <div class="complaint-info">
                    <button class="add-complaint-btn"><i class="bi bi-plus-circle"></i> Agregar Queja</button>
                    <div class="table-responsive">
                        <table class="complaints-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Fecha Presentación</th>
                                    <th>Fecha Máxima</th>
                                    <th>Fecha Resolución</th>
                                    <th>Resumen</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${complaints.length > 0 ?
                complaints.map(complaint => `
                                        <tr data-complaint-id="${complaint.id}">
                                            <td>${complaint.id}</td>
                                            <td>${formatDate(complaint.fecha_presentacion)}</td>
                                            <td>${complaint.fecha_max ? formatDate(complaint.fecha_max) : 'N/A'}</td>
                                            <td>${complaint.fecha_resolucion ? formatDate(complaint.fecha_resolucion) : 'N/A'}</td>
                                            <td>${complaint.resumen || 'Sin resumen'}</td>
                                            <td class="actions-cell">
                                                <button class="edit-complaint-btn" data-id="${complaint.id}">
                                                    <i class="bi bi-pencil"></i>
                                                </button>
                                                <button class="delete-complaint-btn" data-id="${complaint.id}">
                                                    <i class="bi bi-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('') :
                '<tr><td colspan="6" class="no-complaints">No hay quejas registradas</td></tr>'
            }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        setupComplaintEventListeners();
    }

    // Función para configurar eventos de quejas
    function setupComplaintEventListeners() {
        // Botón Agregar
        document.querySelector('.add-complaint-btn')?.addEventListener('click', function (e) {
            e.preventDefault();
            showComplaintForm();
        });

        // Botones Editar
        document.querySelectorAll('.edit-complaint-btn').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const complaintId = this.getAttribute('data-id');
                showComplaintForm(complaintId);
            });
        });

        // Botones Eliminar
        document.querySelectorAll('.delete-complaint-btn').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const complaintId = this.getAttribute('data-id');
                confirmDeleteComplaint(complaintId);
            });
        });
    }

    // Función para mostrar formulario de queja
    function showComplaintForm(complaintId = null) {
        listComplaint.innerHTML = `
            <div class="complaint-form">
                <h3>${complaintId ? 'Editar Queja' : 'Nueva Queja'}</h3>
                <form id="complaintForm">
                    <input type="hidden" name="id" value="${complaintId || ''}">
                    <input type="hidden" name="id_fiscalizacion" value="${currentFiscalizacionId}">
                    
                    <div class="form-group">
                        <label for="fecha_presentacion">Fecha de Presentación:</label>
                        <input type="date" id="fecha_presentacion" name="fecha_presentacion" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="fecha_max">Fecha Máxima:</label>
                        <input type="date" id="fecha_max" name="fecha_max">
                    </div>
                    
                    <div class="form-group">
                        <label for="fecha_resolucion">Fecha de Resolución:</label>
                        <input type="date" id="fecha_resolucion" name="fecha_resolucion">
                    </div>
                    
                    <div class="form-group">
                        <label for="resumen">Resumen:</label>
                        <textarea id="resumen" name="resumen" rows="4" required></textarea>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="cancel-btn">Cancelar</button>
                        <button type="submit" class="save-btn">Guardar</button>
                    </div>
                </form>
            </div>
        `;

        if (complaintId) {
            loadComplaintData(complaintId);
        }

        document.getElementById('complaintForm')?.addEventListener('submit', handleFormSubmit);
        document.querySelector('.cancel-btn')?.addEventListener('click', () => loadComplaints(currentFiscalizacionId));
    }

    // Función para cargar datos de queja
    async function loadComplaintData(complaintId) {
        try {
            const response = await fetch(`../app/casos/get_complaint.php?id=${complaintId}`);
            const data = await response.json();

            if (data.success) {
                const complaint = data.data;
                document.getElementById('fecha_presentacion').value = complaint.fecha_presentacion;
                document.getElementById('fecha_max').value = complaint.fecha_max || '';
                document.getElementById('fecha_resolucion').value = complaint.fecha_resolucion || '';
                document.getElementById('resumen').value = complaint.resumen || '';
            } else {
                throw new Error(data.message || 'Error al cargar datos de la queja');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Error al cargar datos: ' + error.message);
        }
    }

    // Función para manejar envío de formulario
    async function handleFormSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const complaintId = formData.get('id');
        const url = complaintId ? `../app/casos/update_complaint.php` : `../app/casos/create_complaint.php`;
        const method = complaintId ? 'PUT' : 'POST';

        const rawData = Object.fromEntries(formData);

        ['fecha_presentacion', 'fecha_max', 'fecha_resolucion'].forEach(field => {
            if (rawData[field] !== undefined && rawData[field].trim() === '') {
                rawData[field] = null;
            }
        });

        if (rawData['resumen'] !== undefined && rawData['resumen'].trim() === '') {
            rawData['resumen'] = null;
        }

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(rawData)
            });

            const result = await response.json();

            if (result.success) {
                loadComplaints(currentFiscalizacionId);
            } else {
                throw new Error(result.message || 'Error al guardar la queja');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Error al guardar: ' + error.message);
        }
    }

    // Función para confirmar eliminación de queja
    function confirmDeleteComplaint(complaintId) {
        if (!confirm('¿Estás seguro de eliminar esta queja? Esta acción no se puede deshacer.')) {
            return;
        }
        deleteComplaint(complaintId);
    }

    // Función para eliminar queja
    async function deleteComplaint(complaintId) {
        try {
            const response = await fetch(`../app/casos/delete_complaint.php`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: complaintId })
            });

            const result = await response.json();

            if (result.success) {
                loadComplaints(currentFiscalizacionId);
                showSuccess('Queja eliminada correctamente');
            } else {
                throw new Error(result.message || 'Error al eliminar la queja');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Error al eliminar: ' + error.message);
        }
    }

    // =============================================
    // FUNCIONES UTILITARIAS COMPARTIDAS
    // =============================================
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-PE');
    }

    function formatPeriod(start, end) {
        if (!start || !end) return 'Sin periodo';
        return `${start} - ${end}`;
    }

    function showLoading(show) {
        const loader = document.getElementById('loading-overlay');
        if (loader) {
            loader.style.display = show ? 'flex' : 'none';
        }
    }

    function showSuccess(message) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-success';
        alert.textContent = message;
        document.querySelector('.content-complaint').prepend(alert);
        setTimeout(() => alert.remove(), 3000);
    }

    function showError(message) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-error';
        alert.textContent = message;
        document.querySelector('.content-complaint').prepend(alert);
        setTimeout(() => alert.remove(), 5000);
    }

    // Event listeners para búsqueda
    searchClientInput.addEventListener('input', filterCases);
    searchRUCInput.addEventListener('input', filterCases);

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
});
document.addEventListener('DOMContentLoaded', function () {
    // =============================================
    // SECCIÓN 2: GESTIÓN DE QUEJAS (MODAL) - FUNCIONES ÚNICAS
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
    
    // Función para formatear fechas (mantenida por si se usa en el modal)
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-PE');
    }

    // Función para mostrar mensaje de éxito
    function showSuccess(message) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-success';
        alert.textContent = message;
        document.querySelector('.content-complaint').prepend(alert);
        setTimeout(() => alert.remove(), 3000);
    }

    // Función para mostrar mensaje de error
    function showError(message) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-error';
        alert.textContent = message;
        document.querySelector('.content-complaint').prepend(alert);
        setTimeout(() => alert.remove(), 5000);
    }
});
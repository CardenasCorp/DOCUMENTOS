document.addEventListener('DOMContentLoaded', function () {
    // Elementos del DOM
    const modal = document.getElementById('myModalComplaint');
    const closeBtn = document.getElementById('closeModalEditBusiness');
    const listComplaint = document.getElementById('listComplaint');
    let currentFiscalizacionId = null;

    // Verificar que los elementos existan
    if (!modal || !closeBtn || !listComplaint) {
        console.error('Error: Elementos del modal no encontrados');
        return;
    }

    // Función para abrir el modal
    window.openComplaintModal = function (fiscalizacionId) {
        if (!fiscalizacionId) {
            console.error('Error: ID de fiscalización no proporcionado');
            return;
        }

        currentFiscalizacionId = fiscalizacionId;
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Deshabilitar scroll
        loadComplaints(fiscalizacionId);
    };

    // Función para cerrar el modal
    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = ''; // Habilitar scroll
        currentFiscalizacionId = null;
    }

    // Event listeners para cerrar el modal
    closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', function (event) {
        if (event.target === modal) {
            closeModal();
        }
    });

    // Función para cargar quejas desde el servidor
    async function loadComplaints(fiscalizacionId) {
        try {
            listComplaint.innerHTML = '<p>Cargando quejas...</p>';

            const response = await fetch(`../app/casos/get_complaints.php?id_fiscalizacion=${fiscalizacionId}`);

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

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

    // Función para mostrar las quejas en la tabla
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

        // Agregar eventos a los botones
        setupEventListeners();
    }

    // Función para formatear fechas
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-PE'); // Formato peruano
    }

    // Función para mostrar errores
    function showError(message) {
        listComplaint.innerHTML = `
            <div class="error-message">
                <i class="bi bi-exclamation-triangle"></i>
                <p>${message}</p>
            </div>
        `;
    }

    // Configurar event listeners para los botones
    function setupEventListeners() {
        // Botón Agregar
        document.querySelector('.add-complaint-btn')?.addEventListener('click', showComplaintForm);

        // Botones Editar
        document.querySelectorAll('.edit-complaint-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const complaintId = this.getAttribute('data-id');
                showComplaintForm(complaintId);
            });
        });

        // Botones Eliminar
        document.querySelectorAll('.delete-complaint-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const complaintId = this.getAttribute('data-id');
                confirmDeleteComplaint(complaintId);
            });
        });
    }

    // Función para mostrar formulario de queja
    // En la función showComplaintForm (dentro de modal-complaint.js):
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

        // Solo cargar datos si estamos editando
        if (complaintId) {
            loadComplaintData(complaintId);
        }

        // Configurar eventos del formulario
        document.getElementById('complaintForm')?.addEventListener('submit', handleFormSubmit);
        document.querySelector('.cancel-btn')?.addEventListener('click', () => loadComplaints(currentFiscalizacionId));
    }

    // Modifica la función setupEventListeners:
    function setupEventListeners() {
        // Botón Agregar
        document.querySelector('.add-complaint-btn')?.addEventListener('click', function (e) {
            e.preventDefault();
            showComplaintForm(); // Sin parámetro para nueva queja
        });

        // Botones Editar
        document.querySelectorAll('.edit-complaint-btn').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const complaintId = this.getAttribute('data-id');
                showComplaintForm(complaintId);
            });
        });

        // Resto de tus event listeners...
    }

    // Función para cargar datos de una queja específica
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

    // Función para manejar el envío del formulario
    async function handleFormSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const complaintId = formData.get('id');
        const url = complaintId
            ? `../app/casos/update_complaint.php`
            : `../app/casos/create_complaint.php`;
        const method = complaintId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(Object.fromEntries(formData))
            });

            const result = await response.json();

            if (result.success) {
                loadComplaints(currentFiscalizacionId); // Recargar lista
            } else {
                throw new Error(result.message || 'Error al guardar la queja');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Error al guardar: ' + error.message);
        }
    }

    // Función para confirmar eliminación
    function confirmDeleteComplaint(complaintId) {
        if (!confirm('¿Estás seguro de eliminar esta queja? Esta acción no se puede deshacer.')) {
            return;
        }
        deleteComplaint(complaintId);
    }

    // Función para eliminar una queja
    async function deleteComplaint(complaintId) {
        try {
            const response = await fetch(`../app/casos/delete_complaint.php`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: complaintId })
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                loadComplaints(currentFiscalizacionId);
                // Opcional: Mostrar mensaje de éxito
                alert('Queja eliminada correctamente');
            } else {
                throw new Error(result.message || 'Error al eliminar la queja');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Error al eliminar: ' + error.message);
        }
    }
});
document.addEventListener('DOMContentLoaded', function () {
    // Elementos del DOM con la nueva estructura
    const openModalButton = document.getElementById('openModalButtonRequest');
    const closeModalButton = document.getElementById('closeModalRequest');
    const modal = document.getElementById('myModalRequest');
    const numeroInput = document.getElementById('search-numero');
    const clienteInput = document.getElementById('search-cliente');
    const acceptButton = document.getElementById('acceptRequest');
    const tableBody = document.getElementById('request-table-body');

    // Variables de estado
    let selectedRequest = null;
    let requestsData = [];

    // URL base para las peticiones
    const BASE_URL = 'registrar';

    // Event Listeners
    openModalButton.addEventListener('click', openModal);
    closeModalButton.addEventListener('click', closeModal);
    acceptButton.addEventListener('click', handleAccept);

    // Eventos de búsqueda
    if (numeroInput) {
        numeroInput.addEventListener('input', function () {
            debounceSearch('numero', this.value.trim());
        });
    }

    if (clienteInput) {
        clienteInput.addEventListener('input', function () {
            debounceSearch('cliente', this.value.trim());
        });
    }

    tableBody.addEventListener('change', function (event) {
        if (event.target.name === 'request-select') {
            const selectedId = parseInt(event.target.value);
            selectedRequest = requestsData.find(r => r.id_fiscalizacion === selectedId);
            highlightSelectedRow(event.target);
        }
    });

    let debounceTimer;
    function debounceSearch(field, value) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            searchRequests(field, value);
        }, 300);
    }

    // Función de búsqueda modificada
    function searchRequests(field, searchTerm) {
        if (!searchTerm) {
            loadRequests(); // Recargar todos si no hay término
            return;
        }

        showLoader();

        // Filtrar localmente primero para respuesta rápida
        const filtered = requestsData.filter(req => {
            if (field === 'numero') {
                return req.numero && req.numero.toLowerCase().includes(searchTerm.toLowerCase());
            } else {
                return req.cliente && req.cliente.toLowerCase().includes(searchTerm.toLowerCase());
            }
        });

        if (filtered.length > 0) {
            renderRequests(filtered);
            hideLoader();
            return;
        }

        // Si no hay resultados locales, buscar en el servidor
        const params = new URLSearchParams();
        params.append('search', searchTerm);
        params.append('field', field);

        fetch(`${BASE_URL}/buscar_requerimientos_padre.php?${params.toString()}`)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(data => {
                if (data?.success) {
                    requestsData = data.data; // Actualizar datos globales
                    renderRequests(data.data);
                } else {
                    throw new Error(data?.message || 'Sin resultados');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showError(error.message);
                renderRequests([]); // Mostrar tabla vacía
            })
            .finally(hideLoader);
    }

    // Funciones principales
    function openModal() {
        modal.style.display = 'block';
        loadRequests();
    }

    function closeModal() {
        modal.style.display = 'none';
        resetModal();
    }

    function handleAccept() {
        if (selectedRequest) {
            // Actualizar el campo de requerimiento en el formulario principal
            const requerimientoInput = document.getElementById('requerimiento');
            if (requerimientoInput) {
                requerimientoInput.value = selectedRequest.numero;

                // Crear o actualizar campo oculto para el ID padre
                let idPadreInput = document.getElementById('id_fiscalizacion_padre');
                if (!idPadreInput) {
                    idPadreInput = document.createElement('input');
                    idPadreInput.type = 'hidden';
                    idPadreInput.id = 'id_fiscalizacion_padre';
                    requerimientoInput.parentNode.appendChild(idPadreInput);
                }
                idPadreInput.value = selectedRequest.id_fiscalizacion;
            }

            closeModal();
        } else {
            showAlert('Por favor seleccione un requerimiento');
        }
    }

    function loadRequests() {
        showLoader();

        fetch(`${BASE_URL}/buscar_requerimientos_padre.php`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data && data.success) {
                    requestsData = data.data;
                    renderRequests(requestsData);
                } else {
                    throw new Error(data.message || 'Error al cargar requerimientos');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showError(error.message);
            })
            .finally(hideLoader);
    }

    function searchRequests(field) {
        const searchTerm = field === 'numero'
            ? numeroInput.value.trim()
            : clienteInput.value.trim();

        if (!searchTerm) {
            loadRequests(); // Recargar todos si no hay término
            return;
        }

        showLoader();

        const params = new URLSearchParams();
        params.append('search', searchTerm);
        params.append('field', field);

        fetch(`${BASE_URL}/buscar_requerimientos_padre.php?${params.toString()}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data && data.success) {
                    requestsData = data.data;
                    renderRequests(requestsData);
                } else {
                    throw new Error(data.message || 'Sin resultados');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showError(error.message);
            })
            .finally(hideLoader);
    }

    function renderRequests(requests) {
        tableBody.innerHTML = '';

        if (!requests || requests.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" class="no-results">No se encontraron requerimientos</td></tr>';
            return;
        }

        requests.forEach(req => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${req.numero || 'N/A'}</td>
                <td>${req.cliente || 'N/A'}</td>
                <td>${req.periodo_inicio || ''} - ${req.periodo_final || ''}</td>
                <td><input type="radio" name="request-select" value="${req.id_fiscalizacion}"></td>
            `;
            tableBody.appendChild(row);
        });
    }

    function resetModal() {
        if (numeroInput) numeroInput.value = '';
        if (clienteInput) clienteInput.value = '';
        selectedRequest = null;
        tableBody.innerHTML = '';
    }

    function highlightSelectedRow(radioButton) {
        const rows = tableBody.querySelectorAll('tr');
        rows.forEach(row => row.classList.remove('selected-row'));
        radioButton.closest('tr').classList.add('selected-row');
    }

    function showAlert(msg) {
        // Eliminar alertas anteriores
        const existingAlerts = document.querySelectorAll('#myModalRequest .alert');
        existingAlerts.forEach(alert => alert.remove());

        const alert = document.createElement('div');
        alert.className = 'alert';
        alert.textContent = msg;
        alert.style.cssText = `
            background-color: #ffdddd;
            color: #d8000c;
            padding: 10px;
            margin: 15px 0;
            border-radius: 4px;
            text-align: center;
        `;

        const modalContent = document.querySelector('#myModalRequest .modal-content');
        modalContent.insertBefore(alert, modalContent.querySelector('.table-container'));

        setTimeout(() => alert.remove(), 3000);
    }

    function showLoader() {
        // Eliminar loaders anteriores
        const existingLoaders = document.querySelectorAll('#myModalRequest .loader');
        existingLoaders.forEach(loader => loader.remove());

        const loader = document.createElement('div');
        loader.className = 'loader';
        loader.innerHTML = `<div class="spinner"></div><p>Cargando requerimientos...</p>`;
        loader.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
            gap: 10px;
        `;

        const spinner = loader.querySelector('.spinner');
        if (spinner) {
            spinner.style.cssText = `
                border: 4px solid #f3f3f3;
                border-top: 4px solid #3498db;
                border-radius: 50%;
                width: 30px;
                height: 30px;
                animation: spin 1s linear infinite;
            `;

            // Crear la animación
            const style = document.createElement('style');
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }

        tableBody.parentNode.insertBefore(loader, tableBody);
    }

    function hideLoader() {
        const loaders = document.querySelectorAll('#myModalRequest .loader');
        loaders.forEach(loader => loader.remove());
    }

    function showError(msg) {
        // Eliminar errores anteriores
        const existingErrors = document.querySelectorAll('#myModalRequest .error');
        existingErrors.forEach(error => error.remove());

        const error = document.createElement('div');
        error.className = 'error';
        error.textContent = msg;
        error.style.cssText = `
            background-color: #ffdddd;
            color: #d8000c;
            padding: 10px;
            margin: 15px 0;
            border-radius: 4px;
            text-align: center;
        `;

        const modalContent = document.querySelector('#myModalRequest .modal-content');
        modalContent.insertBefore(error, modalContent.querySelector('.table-container'));
    }

    function debounce(func, wait) {
        let timeout;
        return function () {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    // Cerrar modal al presionar Escape
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && modal.style.display === 'block') {
            closeModal();
        }
    });

    // Cerrar al hacer clic fuera del contenido del modal
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModal();
        }
    });
});
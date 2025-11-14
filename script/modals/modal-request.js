document.addEventListener('DOMContentLoaded', function () {
    // Elementos del DOM con la nueva estructura
    const openModalButton = document.getElementById('openModalButtonRequest');
    const closeModalButton = document.getElementById('closeModalRequest');
    const modal = document.getElementById('myModalRequest');
    const numeroInput = document.getElementById('search-numero');
    const clienteInput = document.getElementById('search-cliente');
    const acceptButton = document.getElementById('acceptRequest');
    const tableBody = document.getElementById('request-table-body');
    const mainForm = document.getElementById('mainForm');

    // Variables de estado
    let selectedRequest = null;
    let requestsData = [];
    let currentContext = null;
    let currentInput = null;

    // URL base para las peticiones
    const BASE_URL = 'registrar';

    // Event Listeners
    openModalButton.addEventListener('click', openModal);
    closeModalButton.addEventListener('click', closeModal);
    acceptButton.addEventListener('click', handleAccept);

    // Evento de envío del formulario principal
    if (mainForm) {
        mainForm.addEventListener('submit', handleFormSubmit);
    }

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
                    idPadreInput.name = 'id_fiscalizacion_padre';
                    requerimientoInput.parentNode.appendChild(idPadreInput);
                }
                idPadreInput.value = selectedRequest.id_fiscalizacion;

                // Llamar a la función para cargar datos del padre
                cargarDatosPadre(selectedRequest.id_fiscalizacion);
            }

            closeModal();
        } else {
            showAlert('Por favor seleccione un requerimiento');
        }
    }

    // Nueva función para cargar datos del padre
    async function cargarDatosPadre(idPadre) {
        try {
            showLoading(true);
            const response = await fetch(`registrar/get_datos_padre.php?id_padre=${idPadre}`);
            const result = await response.json();

            if (result.success) {
                // Llenar los campos con los datos del padre
                llenarCamposConDatosPadre(result.data);
                showSuccess('Datos del padre cargados correctamente');
            } else {
                throw new Error(result.message || 'Error al cargar datos del padre');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Error al cargar datos del padre: ' + error.message);
        } finally {
            showLoading(false);
        }
    }

    // Función para llenar los campos con los datos del padre - CORREGIDA
    function llenarCamposConDatosPadre(datos) {
        const documento = datos.documento;
        const agentes = datos.agentes;

        // Llenar IGV
        if (documento.IGV) {
            document.getElementById('IGV').value = documento.IGV;
        }

        // Llenar periodos
        if (documento.periodo_inicio) {
            document.getElementById('periodo-inicio').value = formatPeriodForInput(documento.periodo_inicio);
        }

        if (documento.periodo_final) {
            document.getElementById('periodo-fin').value = formatPeriodForInput(documento.periodo_final);
        }

        // Llenar supervisor
        if (agentes.supervisor) {
            document.getElementById('supervisor').value = agentes.supervisor.nombre_completo || '';
            document.getElementById('supervisor_id').value = agentes.supervisor.id_personal || '';
        }

        // Llenar verificadores - USANDO LA MISMA ESTRUCTURA QUE registrar-caso.js
        const verificadoresContainer = document.querySelector('#verificadores .verificador-container');

        // Limpiar verificadores existentes
        verificadoresContainer.innerHTML = '';

        if (agentes.verificadores && agentes.verificadores.length > 0) {
            // Agregar verificadores del padre
            agentes.verificadores.forEach(verificador => {
                agregarVerificadorDesdePadre(verificador.nombre_completo, verificador.id_personal);
            });
        } else {
            // Si no hay verificadores, agregar un campo vacío usando la función existente
            if (typeof window.agregarVerificador === 'function') {
                window.agregarVerificador();
            }
        }
    }

    // Nueva función específica para agregar verificadores desde datos del padre
    function agregarVerificadorDesdePadre(nombre, id) {
        const verificadoresContainer = document.querySelector('#verificadores .verificador-container');
        const verificadorCount = verificadoresContainer.querySelectorAll('.verificador-item').length + 1;

        const nuevoVerificadorDiv = document.createElement('div');
        nuevoVerificadorDiv.classList.add('verificador-item');
        nuevoVerificadorDiv.style.marginBottom = '10px';

        // Campo oculto para el ID
        const hiddenIdInput = document.createElement('input');
        hiddenIdInput.type = 'hidden';
        hiddenIdInput.name = `verificadores[${verificadorCount}][id]`;
        hiddenIdInput.className = 'verificador-id';
        hiddenIdInput.value = id;

        // Input para el nombre (solo lectura)
        const inputVerificador = document.createElement('input');
        inputVerificador.type = 'text';
        inputVerificador.name = `verificadores[${verificadorCount}][nombre]`;
        inputVerificador.placeholder = 'Nombre del verificador';
        inputVerificador.readOnly = true;
        inputVerificador.required = true;
        inputVerificador.className = 'verificador-name';
        inputVerificador.style.marginRight = '10px';
        inputVerificador.style.padding = '8px';
        inputVerificador.style.width = '200px';
        inputVerificador.value = nombre;

        // Botón de búsqueda
        const searchButton = document.createElement('button');
        searchButton.type = 'button';
        searchButton.classList.add('search', 'verificador-search');
        searchButton.innerHTML = '<i class="bi bi-search"></i>';
        searchButton.style.marginRight = '5px';
        searchButton.style.padding = '8px 12px';
        searchButton.onclick = function () {
            currentContext = 'verificador';
            currentInput = {
                name: inputVerificador,
                id: hiddenIdInput
            };
            openEmployeeModal();
        };

        // Botón para eliminar
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.classList.add('delete');
        deleteButton.innerHTML = '<i class="bi bi-trash"></i>';
        deleteButton.style.padding = '8px 12px';
        deleteButton.onclick = function () {
            nuevoVerificadorDiv.remove();
        };

        // Contenedor interno para los elementos del verificador
        const itemContainer = document.createElement('div');
        itemContainer.style.display = 'flex';
        itemContainer.style.alignItems = 'center';
        itemContainer.style.gap = '10px';

        itemContainer.appendChild(hiddenIdInput);
        itemContainer.appendChild(inputVerificador);
        itemContainer.appendChild(searchButton);
        itemContainer.appendChild(deleteButton);

        nuevoVerificadorDiv.appendChild(itemContainer);
        verificadoresContainer.appendChild(nuevoVerificadorDiv);
    }

    // Función auxiliar para formatear periodos
    function formatPeriodForInput(period) {
        return period?.length === 6 ? `${period.substring(2, 6)}-${period.substring(0, 2)}` : '';
    }

    // Función para mostrar loading
    function showLoading(show) {
        const submitButton = document.querySelector('.post');
        if (submitButton) {
            submitButton.disabled = show;
            submitButton.innerHTML = show ? '<i class="bi bi-arrow-repeat spin"></i> Cargando...' : 'Guardar';
        }
    }

    // Función para manejar el envío del formulario principal
    function handleFormSubmit(e) {
        e.preventDefault();
        guardarFiscalizacion();
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

    // Función para abrir modal de empleados
    function openEmployeeModal() {
        const modal = document.getElementById('employeeModal');
        if (modal) {
            modal.style.display = 'block';
            loadEmployees();
        } else {
            console.error('Modal de empleados no encontrado');
        }
    }

    // Cargar empleados desde el servidor
    function loadEmployees() {
        const tableBody = document.getElementById('employeeTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Cargando empleados...</td></tr>';

        fetch('registrar/get_employees.php')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data && data.success) {
                    renderEmployees(data.data);
                } else {
                    throw new Error(data.message || 'Error al cargar empleados');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: red;">Error: ${error.message}</td></tr>`;
            });
    }

    // Renderizar empleados en la tabla
    function renderEmployees(employees) {
        const tableBody = document.getElementById('employeeTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        if (!employees || employees.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No se encontraron empleados</td></tr>';
            return;
        }

        employees.forEach(employee => {
            const row = document.createElement('tr');
            row.innerHTML = `       
                <td>${employee.id}</td>
                <td>${employee.first_name}</td>
                <td>${employee.last_name}</td>
                <td>
                    <button class="select-employee" data-id="${employee.id}" 
                            data-name="${employee.first_name} ${employee.last_name}">
                        Seleccionar
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        // Agregar eventos a los botones de selección
        document.querySelectorAll('.select-employee').forEach(button => {
            button.addEventListener('click', function () {
                const employeeId = this.getAttribute('data-id');
                const employeeName = this.getAttribute('data-name');
                selectEmployee(employeeId, employeeName);
            });
        });
    }

    // Seleccionar empleado
    function selectEmployee(employeeId, employeeName) {
        if (currentContext === 'verificador' && currentInput) {
            // Actualizar el input de texto con el nombre
            currentInput.name.value = employeeName;
            // Actualizar el campo oculto con el ID
            currentInput.id.value = employeeId;
        }
        else if (currentContext === 'supervisor') {
            // Actualizar el input de texto con el nombre
            document.getElementById('supervisor').value = employeeName;
            // Actualizar el campo oculto con el ID
            document.getElementById('supervisor_id').value = employeeId;
        }

        closeEmployeeModal();
    }

    // Función para cerrar modal de empleados
    function closeEmployeeModal() {
        const modal = document.getElementById('employeeModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Funciones para mostrar mensajes
    function showSuccess(message) {
        // Crear elemento de alerta de éxito
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success';
        alertDiv.textContent = message;
        alertDiv.style.cssText = `
            background-color: #d4edda;
            color: #155724;
            padding: 10px;
            margin: 15px 0;
            border-radius: 4px;
            text-align: center;
        `;

        // Insertar al inicio del formulario
        const formSection = document.querySelector('.form-section');
        if (formSection) {
            formSection.insertBefore(alertDiv, formSection.firstChild);

            // Remover después de 3 segundos
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.parentNode.removeChild(alertDiv);
                }
            }, 3000);
        }
    }

    // Cerrar modal al presionar Escape
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && modal.style.display === 'block') {
            closeModal();
        }
    });

    // Cerrar al hacer clic fuera del contenido del modal
    modal.addEventListener('click', function (event) {
        if (event.target === modal) {
            closeModal();
        }
    });

    // Inicializar con al menos un verificador si no existe
    document.addEventListener('DOMContentLoaded', function () {
        const verificadoresContainer = document.querySelector('#verificadores .verificador-container');
        if (verificadoresContainer && verificadoresContainer.querySelectorAll('.verificador-item').length === 0) {
            if (typeof window.agregarVerificador === 'function') {
                window.agregarVerificador();
            }
        }
    });
});
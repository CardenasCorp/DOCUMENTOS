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
    let verificadoresCount = 0;

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

    // Función para llenar los campos con los datos del padre
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
        
        // Llenar verificadores
        if (agentes.verificadores && agentes.verificadores.length > 0) {
            // Limpiar verificadores existentes
            const verificadoresContainer = document.getElementById('verificadores');
            const addButton = verificadoresContainer.querySelector('.add-verificador');
            
            verificadoresContainer.querySelectorAll('.verificador-container:not(.add-verificador)').forEach(c => c.remove());
            
            // Agregar verificadores del padre
            agentes.verificadores.forEach(verificador => {
                agregarVerificador(verificador.nombre_completo, verificador.id_personal);
            });
            
            // Asegurar que el botón de agregar esté al final
            if (addButton) {
                verificadoresContainer.appendChild(addButton);
            }
        }
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

    // Función para agregar verificadores (debe ser global para que funcione onclick)
    window.agregarVerificador = function(nombre = '', id = '') {
        verificadoresCount++;
        const container = document.createElement('div');
        container.className = 'verificador-container';
        

        const addButton = document.querySelector('.add-verificador');
        if (addButton) {
            addButton.parentNode.insertBefore(container, addButton);
        } else {
            document.getElementById('verificadores').appendChild(container);
        }

        // Agregar evento al botón de búsqueda del verificador recién creado
        const searchBtn = container.querySelector('.verificador-search');
        searchBtn.addEventListener('click', function() {
            // Aquí deberías implementar la lógica para buscar verificadores
            console.log('Búsqueda de verificador');
        });

        // Agregar evento al botón de eliminar
        const deleteBtn = container.querySelector('.delete');
        deleteBtn.addEventListener('click', function() {
            this.closest('.verificador-container').remove();
            verificadoresCount--;
        });
    };

    // Inicializar con al menos un verificador
    agregarVerificador();
});